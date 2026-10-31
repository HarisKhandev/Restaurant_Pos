import { initialData } from '../data/seed'
import { normalizeRestaurantData } from '../utils/dataNormalization'

const KEY = 'orbit-pos-state-v1'

const clone = (value) => JSON.parse(JSON.stringify(value))

export const mockStorage = {
  load() {
    try {
      const saved = localStorage.getItem(KEY)
      if (!saved) return normalizeRestaurantData(clone(initialData))
      const parsed = JSON.parse(saved)
      const merged = { ...clone(initialData), ...parsed }
      for (const key of Object.keys(initialData)) {
        if (Array.isArray(initialData[key]) && Array.isArray(parsed[key])) {
          const savedIds = new Set(parsed[key].map((item) => item.id))
          const missing = initialData[key].filter((item) => !savedIds.has(item.id))
          if (missing.length) merged[key] = [...parsed[key], ...clone(missing)]
        }
      }
      if (Array.isArray(merged.products)) {
        merged.products = merged.products.map((product) => {
          const seed = initialData.products.find((item) => item.id === product.id)
          if (!seed) {
            return {
              ...product,
              modifiers: (product.modifiers || []).filter((group) => group?.name?.trim().toLowerCase() !== 'add-ons'),
            }
          }
          const stripAddonGroups = (modifiers = []) => modifiers.filter((group) => group?.name?.trim().toLowerCase() !== 'add-ons')
          return {
            ...product,
            addonIds: product.addonIds?.length ? product.addonIds : (seed.addonIds || []),
            modifiers: stripAddonGroups(product.modifiers?.length ? product.modifiers : (seed.modifiers || [])),
            stockMode: product.stockMode || seed.stockMode,
            productType: product.productType || seed.productType,
            cost: seed.stockMode === 'recipe' && !product.cost ? seed.cost : product.cost,
          }
        })
      }
      if (Array.isArray(initialData.inventory)) {
        const savedById = new Map((parsed.inventory || []).map((item) => [item.id, item]))
        const seen = new Set()
        merged.inventory = [
          ...initialData.inventory.map((seed) => {
            seen.add(seed.id)
            const saved = savedById.get(seed.id)
            return saved ? { ...seed, stock: saved.stock ?? saved.currentStock ?? seed.stock, currentStock: saved.currentStock ?? saved.stock ?? seed.stock } : seed
          }),
          ...(parsed.inventory || []).filter((item) => !seen.has(item.id)),
        ]
      }
      if (Array.isArray(initialData.recipes)) {
        const savedById = new Map((parsed.recipes || []).map((item) => [item.id, item]))
        const seen = new Set()
        merged.recipes = [
          ...initialData.recipes.map((seed) => {
            seen.add(seed.id)
            return savedById.get(seed.id) || seed
          }),
          ...(parsed.recipes || []).filter((item) => !seen.has(item.id)),
        ]
      }
      if (!Array.isArray(merged.inventoryMovements)) merged.inventoryMovements = []
      return normalizeRestaurantData(merged)
    } catch {
      return normalizeRestaurantData(clone(initialData))
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Demo state could not be persisted', error)
    }
  },
  reset() {
    localStorage.removeItem(KEY)
    return normalizeRestaurantData(clone(initialData))
  },
}
