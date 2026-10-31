import { normalizeQuantity } from './inventoryUnits'
import { normalizeInventoryItem } from './inventoryUnits'

export const PRODUCT_TYPES = {
  SERVICE: 'SERVICE',
  DIRECT_STOCK: 'DIRECT_STOCK',
  RECIPE: 'RECIPE',
  COMBO: 'COMBO',
}

export function getProductRecipe(productId, recipes = []) {
  return recipes.find((r) => r.productId === productId && r.active !== false) || null
}

export function resolveProductType(product, recipes = []) {
  if (product?.productType) return product.productType
  if (product?.stockMode === 'recipe' || getProductRecipe(product?.id, recipes)) return PRODUCT_TYPES.RECIPE
  if (product?.stockMode === 'direct' || product?.directStockConfig?.inventoryItemId) return PRODUCT_TYPES.DIRECT_STOCK
  if (product?.comboItems?.length) return PRODUCT_TYPES.COMBO
  if (product?.inventoryTracking === false) return PRODUCT_TYPES.SERVICE
  return PRODUCT_TYPES.SERVICE
}

export function productUsesInventory(product, recipes = []) {
  const type = resolveProductType(product, recipes)
  return type !== PRODUCT_TYPES.SERVICE
}

function addRequirement(map, inventoryItemId, quantity, unit, meta = {}) {
  const key = inventoryItemId
  const existing = map.get(key)
  if (existing) {
    existing.quantity += quantity
    existing.sources.push(meta)
  } else {
    map.set(key, { inventoryItemId, quantity, unit, sources: [meta] })
  }
}

export function resolveProductInventoryRequirements(product, quantity = 1, ctx = {}, visited = new Set()) {
  const { products = [], recipes = [], addons = [] } = ctx
  const requirements = new Map()
  const productId = product?.id
  if (!product || visited.has(productId)) return requirements
  visited.add(productId)

  const type = resolveProductType(product, recipes)
  const qty = Number(quantity) || 1

  if (type === PRODUCT_TYPES.SERVICE) return requirements

  if (type === PRODUCT_TYPES.DIRECT_STOCK) {
    const config = product.directStockConfig || {}
    const inventoryItemId = config.inventoryItemId
    const perSale = Number(config.quantityPerSale ?? 1)
    if (inventoryItemId) {
      addRequirement(requirements, inventoryItemId, perSale * qty, config.unit || 'pcs', { productId, type })
    }
    return requirements
  }

  if (type === PRODUCT_TYPES.RECIPE) {
    const recipe = getProductRecipe(productId, recipes)
    for (const ing of recipe?.ingredients || []) {
      addRequirement(requirements, ing.inventoryId, (Number(ing.quantity) || 0) * qty, ing.unit, { productId, type })
    }
    return requirements
  }

  if (type === PRODUCT_TYPES.COMBO) {
    for (const comboItem of product.comboItems || []) {
      const child = products.find((p) => p.id === comboItem.productId)
      if (!child) continue
      const childReqs = resolveProductInventoryRequirements(child, (Number(comboItem.quantity) || 1) * qty, ctx, new Set(visited))
      for (const [id, req] of childReqs) {
        addRequirement(requirements, id, req.quantity, req.unit, { productId, comboChildId: child.id })
      }
    }
    return requirements
  }

  return requirements
}

export function resolveAddonInventoryRequirements(selectedAddons = [], addons = []) {
  const requirements = new Map()
  for (const addonRef of selectedAddons) {
    const addonId = typeof addonRef === 'string' ? addonRef : addonRef?.id
    const addonQty = typeof addonRef === 'object' ? (Number(addonRef.quantity) || 1) : 1
    const addon = addons.find((a) => a.id === addonId)
    if (!addon?.inventoryTracking || !addon.inventoryItemId) continue
    addRequirement(
      requirements,
      addon.inventoryItemId,
      (Number(addon.quantityPerAddon) || 1) * addonQty,
      addon.unit || 'pcs',
      { addonId: addon.id },
    )
  }
  return requirements
}

export function resolveOrderLineRequirements(orderItem, ctx = {}) {
  const product = ctx.products?.find((p) => p.id === orderItem.id) || orderItem
  const qty = Number(orderItem.quantity) || 1
  const productReqs = resolveProductInventoryRequirements(product, qty, ctx)
  const addonReqs = resolveAddonInventoryRequirements(orderItem.addons || orderItem.selectedAddons || [], ctx.addons || [])

  const aggregated = new Map(productReqs)
  for (const [id, req] of addonReqs) {
    addRequirement(aggregated, id, req.quantity, req.unit, { addonId: req.sources?.[0]?.addonId })
  }
  return aggregated
}

export function aggregateInventoryRequirements(requirementMaps = []) {
  const aggregated = new Map()
  for (const map of requirementMaps) {
    for (const [id, req] of map) {
      addRequirement(aggregated, id, req.quantity, req.unit, req.sources?.[0] || {})
    }
  }
  return aggregated
}

export function requirementsToArray(requirementsMap, inventory = []) {
  return [...requirementsMap.values()].map((req) => {
    const item = inventory.find((i) => i.id === req.inventoryItemId)
    const normalized = item ? normalizeInventoryItem(item) : null
    const unit = req.unit || normalized?.baseUnit || 'pcs'
    const qtyInBase = normalized ? normalizeQuantity(req.quantity, unit, normalized.baseUnit) : req.quantity
    return {
      ...req,
      name: normalized?.name || 'Unknown',
      unit: normalized?.baseUnit || unit,
      quantityInBase: qtyInBase,
      available: normalized?.currentStock ?? 0,
      unitCost: normalized?.unitCost ?? 0,
      lineCost: qtyInBase * (normalized?.unitCost ?? 0),
    }
  })
}

export function detectComboCycle(productId, comboItems = [], products = [], stack = new Set()) {
  if (stack.has(productId)) return true
  const nextStack = new Set(stack)
  nextStack.add(productId)
  for (const item of comboItems) {
    const child = products.find((p) => p.id === item.productId)
    if (!child) continue
    if (resolveProductType(child) === PRODUCT_TYPES.COMBO) {
      if (detectComboCycle(child.id, child.comboItems || [], products, nextStack)) return true
    }
  }
  return false
}
