import { normalizeQuantity } from './inventoryUnits'
import { normalizeInventoryItem } from './inventoryUnits'
import { buildRecipeSnapshot } from './costing'
import {
  aggregateInventoryRequirements,
  getProductRecipe,
  requirementsToArray,
  resolveOrderLineRequirements,
} from './productInventoryResolver'
import { validateLineAvailability } from './inventoryAvailability'

export const MOVEMENT_TYPES = {
  OPENING_STOCK: 'OPENING_STOCK',
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  ORDER_CANCEL_RESTORE: 'ORDER_CANCEL_RESTORE',
  WASTE: 'WASTE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
  RETURN: 'RETURN',
}

export const DEDUCTION_TIMING = {
  ON_ORDER_PLACED: 'ON_ORDER_PLACED',
  ON_ORDER_CONFIRMED: 'ON_ORDER_CONFIRMED',
  ON_PAYMENT_COMPLETED: 'ON_PAYMENT_COMPLETED',
  ON_ORDER_COMPLETED: 'ON_ORDER_COMPLETED',
}

const TIMING_STATUS_MAP = {
  [DEDUCTION_TIMING.ON_ORDER_PLACED]: ['New', 'Pending Confirmation', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed'],
  [DEDUCTION_TIMING.ON_ORDER_CONFIRMED]: ['Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed'],
  [DEDUCTION_TIMING.ON_PAYMENT_COMPLETED]: ['Completed'],
  [DEDUCTION_TIMING.ON_ORDER_COMPLETED]: ['Completed'],
}

export function getDefaultInventorySettings() {
  return {
    deductionTiming: DEDUCTION_TIMING.ON_ORDER_PLACED,
    allowOversell: false,
    lowStockThreshold: 10,
  }
}

export function shouldProcessInventoryForStatus(status, timing = DEDUCTION_TIMING.ON_ORDER_PLACED) {
  const allowed = TIMING_STATUS_MAP[timing] || TIMING_STATUS_MAP[DEDUCTION_TIMING.ON_ORDER_PLACED]
  return allowed.includes(status)
}

export function validateOrderInventory(order, ctx = {}) {
  const allowOversell = ctx.allowOversell ?? ctx.inventorySettings?.allowOversell ?? false
  const shortages = []
  let ok = true

  for (const item of order.items || []) {
    const result = validateLineAvailability(item, ctx, allowOversell)
    if (!result.ok) ok = false
    shortages.push(...result.shortages.map((s) => ({ ...s, productId: item.id, productName: item.name })))
  }

  return { ok, shortages }
}

export function previewInventoryDeduction(order, ctx = {}) {
  const maps = (order.items || []).map((item) => resolveOrderLineRequirements(item, ctx))
  const aggregated = aggregateInventoryRequirements(maps)
  return requirementsToArray(aggregated, ctx.inventory || [])
}

function createMovementId() {
  return `mv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function createInventoryMovement({
  inventoryItemId,
  restaurantId,
  branchId,
  type,
  quantityIn = 0,
  quantityOut = 0,
  balanceAfter,
  referenceType,
  referenceId,
  notes,
  createdBy,
}) {
  return {
    id: createMovementId(),
    inventoryItemId,
    restaurantId,
    branchId: branchId || null,
    type,
    quantityIn: Number(quantityIn) || 0,
    quantityOut: Number(quantityOut) || 0,
    balanceAfter: Number(balanceAfter) || 0,
    referenceType: referenceType || null,
    referenceId: referenceId || null,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'system',
  }
}

export function applyInventoryChanges(inventory, changes, movements, meta) {
  const updatedInventory = inventory.map((item) => {
    const change = changes.get(item.id)
    if (!change) return item
    const normalized = normalizeInventoryItem(item)
    const nextStock = Math.max(0, normalized.currentStock + change.delta)
    movements.push(createInventoryMovement({
      inventoryItemId: item.id,
      restaurantId: meta.restaurantId,
      branchId: meta.branchId,
      type: meta.type,
      quantityIn: change.delta > 0 ? change.delta : 0,
      quantityOut: change.delta < 0 ? Math.abs(change.delta) : 0,
      balanceAfter: nextStock,
      referenceType: meta.referenceType,
      referenceId: meta.referenceId,
      notes: meta.notes,
      createdBy: meta.createdBy,
    }))
    return { ...item, stock: nextStock, currentStock: nextStock }
  })
  return updatedInventory
}

export function buildCostSnapshots(order, ctx = {}) {
  const { products = [], recipes = [], inventory = [] } = ctx
  return (order.items || []).map((item) => {
    const product = products.find((p) => p.id === item.id) || item
    const recipe = getProductRecipe(product.id, recipes)
    const snapshot = buildRecipeSnapshot(product, recipe, inventory)
    return snapshot ? { ...snapshot, quantity: item.quantity } : {
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      sellingPrice: item.price,
      estimatedCostAtSale: (product.cost || 0) * (item.quantity || 1),
      recipeSnapshot: [],
    }
  })
}

export function processInventoryForOrder({
  order,
  action = 'DEDUCT',
  ctx = {},
  partialRestore = null,
  createdBy = 'system',
}) {
  if (!order?.items?.length) {
    return { ok: true, inventory: ctx.inventory || [], movements: [], changes: [] }
  }

  const inventory = (ctx.inventory || []).map(normalizeInventoryItem)
  const movements = []
  const maps = (order.items || []).map((item) => resolveOrderLineRequirements(item, ctx))
  const aggregated = aggregateInventoryRequirements(maps)
  const changes = new Map()

  if (action === 'RESTORE' || action === 'DEDUCT') {
    for (const [inventoryItemId, req] of aggregated) {
      const item = inventory.find((i) => i.id === inventoryItemId)
      const normalized = item ? normalizeInventoryItem(item) : null
      const unit = req.unit || normalized?.baseUnit || 'pcs'
      let deltaBase = normalized ? normalizeQuantity(req.quantity, unit, normalized.baseUnit) : req.quantity

      if (action === 'RESTORE' && partialRestore) {
        const override = partialRestore.find((p) => p.inventoryItemId === inventoryItemId)
        if (override) {
          deltaBase = normalized
            ? normalizeQuantity(override.restoreQuantity, override.unit || unit, normalized.baseUnit)
            : Number(override.restoreQuantity) || 0
        }
      }

      const delta = action === 'DEDUCT' ? -deltaBase : deltaBase
      const prev = changes.get(inventoryItemId) || { delta: 0 }
      changes.set(inventoryItemId, { delta: prev.delta + delta })
    }
  }

  const movementType = action === 'DEDUCT' ? MOVEMENT_TYPES.SALE : MOVEMENT_TYPES.ORDER_CANCEL_RESTORE
  const updatedInventory = applyInventoryChanges(inventory, changes, movements, {
    restaurantId: order.restaurantId,
    branchId: order.branchId,
    type: movementType,
    referenceType: 'order',
    referenceId: order.id,
    notes: action === 'DEDUCT' ? `Order ${order.number}` : `Restore from ${order.number}`,
    createdBy,
  })

  const costSnapshots = action === 'DEDUCT' ? buildCostSnapshots(order, ctx) : []

  return {
    ok: true,
    inventory: updatedInventory,
    movements,
    changes: requirementsToArray(aggregated, inventory),
    costSnapshots,
    inventoryStatus: {
      processed: action === 'DEDUCT',
      processedAt: new Date().toISOString(),
      deductionReference: movements[0]?.id || null,
      restored: action === 'RESTORE',
      restoredAt: action === 'RESTORE' ? new Date().toISOString() : null,
    },
  }
}

export function processInventoryDeduction(order, ctx, createdBy) {
  return processInventoryForOrder({ order, action: 'DEDUCT', ctx, createdBy })
}

export function restoreInventory(order, ctx, options = {}) {
  return processInventoryForOrder({
    order,
    action: 'RESTORE',
    ctx,
    partialRestore: options.partialRestore,
    createdBy: options.createdBy,
  })
}

export function recordWasteMovement({ inventoryItemId, quantity, unit, reason, notes, ctx, createdBy }) {
  const inventory = (ctx.inventory || []).map(normalizeInventoryItem)
  const item = inventory.find((i) => i.id === inventoryItemId)
  if (!item) return { ok: false, error: 'Inventory item not found' }

  const normalized = normalizeInventoryItem(item)
  const qtyBase = normalizeQuantity(quantity, unit || normalized.baseUnit, normalized.baseUnit)
  const changes = new Map([[inventoryItemId, { delta: -qtyBase }]])
  const movements = []
  const updatedInventory = applyInventoryChanges(inventory, changes, movements, {
    restaurantId: ctx.restaurantId,
    branchId: ctx.branchId,
    type: MOVEMENT_TYPES.WASTE,
    referenceType: 'waste',
    referenceId: null,
    notes: `${reason}${notes ? ` — ${notes}` : ''}`,
    createdBy,
  })

  return { ok: true, inventory: updatedInventory, movements }
}

export function recordAdjustmentMovement({ inventoryItemId, mode, quantity, physicalCount, reason, ctx, createdBy }) {
  const inventory = (ctx.inventory || []).map(normalizeInventoryItem)
  const item = inventory.find((i) => i.id === inventoryItemId)
  if (!item) return { ok: false, error: 'Inventory item not found' }

  const normalized = normalizeInventoryItem(item)
  let delta = 0
  if (mode === 'set') {
    delta = Number(physicalCount) - normalized.currentStock
  } else {
    delta = Number(quantity) || 0
  }

  const changes = new Map([[inventoryItemId, { delta }]])
  const movements = []
  const updatedInventory = applyInventoryChanges(inventory, changes, movements, {
    restaurantId: ctx.restaurantId,
    branchId: ctx.branchId,
    type: MOVEMENT_TYPES.ADJUSTMENT,
    referenceType: 'adjustment',
    referenceId: null,
    notes: reason || `Stock ${mode}`,
    createdBy,
  })

  return { ok: true, inventory: updatedInventory, movements }
}

export function recordPurchaseMovement({ items, ctx, referenceId, notes, createdBy }) {
  const inventory = (ctx.inventory || []).map(normalizeInventoryItem)
  const changes = new Map()
  const movements = []

  for (const line of items || []) {
    const item = inventory.find((i) => i.id === line.inventoryItemId)
    if (!item) continue
    const normalized = normalizeInventoryItem(item)
    const qtyBase = normalizeQuantity(line.quantity, line.unit || normalized.baseUnit, normalized.baseUnit)
    const prev = changes.get(line.inventoryItemId) || { delta: 0 }
    changes.set(line.inventoryItemId, { delta: prev.delta + qtyBase })
  }

  if (!changes.size) return { ok: false, error: 'No valid items to receive' }

  const updatedInventory = applyInventoryChanges(inventory, changes, movements, {
    restaurantId: ctx.restaurantId,
    branchId: ctx.branchId,
    type: MOVEMENT_TYPES.PURCHASE,
    referenceType: 'purchase_order',
    referenceId,
    notes: notes || 'PO received',
    createdBy,
  })

  return { ok: true, inventory: updatedInventory, movements }
}
