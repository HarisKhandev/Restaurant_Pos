import { normalizeQuantity } from './inventoryUnits'
import { normalizeInventoryItem } from './inventoryUnits'
import {
  PRODUCT_TYPES,
  getProductRecipe,
  resolveProductType,
  resolveProductInventoryRequirements,
} from './productInventoryResolver'

export const STOCK_STATUSES = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  MANUALLY_DISABLED: 'MANUALLY_DISABLED',
}

export function calculateRecipeAvailability(ingredients = [], inventory = []) {
  const usable = ingredients.filter((ing) => ing.inventoryId && Number(ing.quantity) > 0)
  if (!usable.length) return Infinity
  return Math.min(
    ...usable.map((ing) => {
      const item = inventory.find((i) => i.id === ing.inventoryId)
      if (!item) return 0
      const normalized = normalizeInventoryItem(item)
      const unit = ing.unit || normalized.baseUnit
      const required = normalizeQuantity(ing.quantity, unit, normalized.baseUnit)
      if (!required) return Infinity
      return Math.floor(normalized.currentStock / required)
    }),
  )
}

export function calculateDirectStockAvailability(product, inventory = []) {
  const config = product.directStockConfig || {}
  const inventoryItemId = config.inventoryItemId
  const perSale = Number(config.quantityPerSale ?? 1)
  if (!inventoryItemId || !perSale) return product.stock ?? Infinity
  const item = inventory.find((i) => i.id === inventoryItemId)
  if (!item) return 0
  const normalized = normalizeInventoryItem(item)
  const required = normalizeQuantity(perSale, config.unit, normalized.baseUnit)
  if (!required) return Infinity
  return Math.floor(normalized.currentStock / required)
}

export function calculateComboAvailability(product, ctx = {}) {
  const { products = [], recipes = [], inventory = [] } = ctx
  const comboItems = product.comboItems || []
  if (!comboItems.length) return 0
  const servings = comboItems.map((comboItem) => {
    const child = products.find((p) => p.id === comboItem.productId)
    if (!child) return 0
    const childAvailable = calculateProductAvailability(child, ctx)
    const needed = Number(comboItem.quantity) || 1
    return Math.floor(childAvailable / needed)
  })
  return servings.length ? Math.min(...servings) : 0
}

export function calculateProductAvailability(product, ctx = {}) {
  if (!product) return 0
  const { recipes = [], inventory = [] } = ctx
  const type = resolveProductType(product, recipes)

  if (type === PRODUCT_TYPES.SERVICE || product.inventoryTracking === false) return Infinity
  if (product.manuallyDisabled || product.available === false) return 0

  if (type === PRODUCT_TYPES.DIRECT_STOCK) return calculateDirectStockAvailability(product, inventory)
  if (type === PRODUCT_TYPES.RECIPE) {
    const recipe = getProductRecipe(product.id, recipes)
    return calculateRecipeAvailability(recipe?.ingredients || [], inventory)
  }
  if (type === PRODUCT_TYPES.COMBO) return calculateComboAvailability(product, ctx)

  return product.stock ?? Infinity
}

export function getProductStockStatus(product, ctx = {}, lowThreshold = 10) {
  if (product?.manuallyDisabled || product?.available === false) {
    return STOCK_STATUSES.MANUALLY_DISABLED
  }
  const available = calculateProductAvailability(product, ctx)
  if (available === Infinity) return STOCK_STATUSES.IN_STOCK
  if (available <= 0) return STOCK_STATUSES.OUT_OF_STOCK
  if (available <= lowThreshold) return STOCK_STATUSES.LOW_STOCK
  return STOCK_STATUSES.IN_STOCK
}

export function isProductOrderable(product, ctx = {}, requestedQty = 1) {
  if (product?.manuallyDisabled || product?.available === false) return false
  const available = calculateProductAvailability(product, ctx)
  if (available === Infinity) return true
  return available >= requestedQty
}

export function validateLineAvailability(orderItem, ctx = {}, allowOversell = false) {
  const product = ctx.products?.find((p) => p.id === orderItem.id) || orderItem
  const qty = Number(orderItem.quantity) || 1
  const requirements = resolveProductInventoryRequirements(product, qty, ctx)
  const shortages = []

  for (const [, req] of requirements) {
    const item = ctx.inventory?.find((i) => i.id === req.inventoryItemId)
    const normalized = item ? normalizeInventoryItem(item) : null
    const unit = req.unit || normalized?.baseUnit || 'pcs'
    const required = normalized ? normalizeQuantity(req.quantity, unit, normalized.baseUnit) : req.quantity
    const available = normalized?.currentStock ?? 0
    if (available < required) {
      shortages.push({
        inventoryItemId: req.inventoryItemId,
        name: normalized?.name || 'Unknown',
        required,
        available,
        unit: normalized?.baseUnit || unit,
        maxPossible: normalized && required ? Math.floor(available / (required / qty)) : 0,
      })
    }
  }

  if (!shortages.length) return { ok: true, shortages: [] }
  if (allowOversell) return { ok: true, shortages, warning: true }
  return { ok: false, shortages }
}

/** Backward-compatible alias */
export function calcMaxServings(ingredients = [], inventory = []) {
  const result = calculateRecipeAvailability(ingredients, inventory)
  return result === Infinity ? 0 : result
}

export function getEffectiveStock(product, recipes = [], inventory = []) {
  const available = calculateProductAvailability(product, { recipes, inventory, products: [product] })
  return available === Infinity ? (product.stock ?? 9999) : available
}
