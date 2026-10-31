/** Weight/volume/count unit helpers — store quantities in base units internally. */

export const UNIT_GROUPS = {
  weight: ['g', 'kg'],
  volume: ['ml', 'L'],
  count: ['pcs', 'carton'],
}

export const UNIT_INFO = {
  g: { label: 'Grams (g)', hint: 'Small amounts — cream, cheese, spices', placeholder: '100', step: 1, min: 1 },
  kg: { label: 'Kilograms (kg)', hint: 'Bulk ingredients — meat, flour, rice', placeholder: '0.25', step: 0.001, min: 0.001 },
  ml: { label: 'Milliliters (ml)', hint: 'Small liquid amounts — milk, oil, extracts', placeholder: '50', step: 1, min: 1 },
  L: { label: 'Liters (L)', hint: 'Large liquid quantities — cooking oil, sauces', placeholder: '0.5', step: 0.001, min: 0.001 },
  pcs: { label: 'Pieces (pcs)', hint: 'Countable items — buns, eggs, bottles', placeholder: '1', step: 1, min: 1 },
  carton: { label: 'Cartons', hint: 'Packaged count (typically 24 pcs)', placeholder: '1', step: 1, min: 1 },
}

const CONVERSION_TO_BASE = {
  g: 1,
  kg: 1000,
  ml: 1,
  L: 1000,
  pcs: 1,
  carton: 24,
}

export function getUnitGroup(unit) {
  if (!unit) return null
  const normalized = String(unit).trim()
  for (const [group, units] of Object.entries(UNIT_GROUPS)) {
    if (units.includes(normalized)) return group
  }
  return null
}

export function areUnitsCompatible(unitA, unitB) {
  if (!unitA || !unitB) return false
  if (unitA === unitB) return true
  return getUnitGroup(unitA) === getUnitGroup(unitB) && getUnitGroup(unitA) !== null
}

export function getCompatibleUnits(baseUnit) {
  const group = getUnitGroup(baseUnit)
  if (!group) return baseUnit ? [baseUnit] : ['pcs']
  return UNIT_GROUPS[group]
}

/** Practical unit for recipe entry — prefer g/ml/pcs over kg/L for precision. */
export function getDefaultRecipeUnit(baseUnit) {
  switch (getUnitGroup(baseUnit)) {
    case 'weight': return 'g'
    case 'volume': return 'ml'
    case 'count': return 'pcs'
    default: return baseUnit || 'pcs'
  }
}

export function getUnitInfo(unit) {
  return UNIT_INFO[unit] || { label: unit, hint: '', placeholder: '1', step: 0.01, min: 0.01 }
}

export function getQuantityInputProps(unit) {
  const info = getUnitInfo(unit)
  return { step: info.step, min: info.min, placeholder: info.placeholder }
}

export function getRecipeQuantityHint(unit, itemName = 'ingredient') {
  const info = getUnitInfo(unit)
  if (!info.hint) return `Enter ${itemName} quantity in ${info.label.toLowerCase()}`
  return `${info.label}: ${info.hint.toLowerCase()}`
}

export function validateRecipeIngredient(ingredient, inventoryItem, rowIndex) {
  const errors = []
  const row = rowIndex + 1
  if (!ingredient.inventoryId) return errors

  const item = inventoryItem ? normalizeInventoryItem(inventoryItem) : null
  const name = item?.name || 'ingredient'

  if (!ingredient.unit) {
    errors.push(`Row ${row} (${name}): select a measurement unit`)
    return errors
  }

  const baseUnit = item?.baseUnit || item?.unit
  if (item && !areUnitsCompatible(ingredient.unit, baseUnit)) {
    errors.push(`Row ${row} (${name}): unit "${ingredient.unit}" is not compatible with stock unit "${baseUnit}"`)
  }

  const qty = Number(ingredient.quantity)
  if (!Number.isFinite(qty) || qty <= 0) {
    errors.push(`Row ${row} (${name}): quantity must be greater than zero`)
    return errors
  }

  const props = getQuantityInputProps(ingredient.unit)
  if (qty < props.min) {
    errors.push(`Row ${row} (${name}): minimum quantity is ${props.min} ${ingredient.unit}`)
  }

  return errors
}

export function convertUnit(quantity, fromUnit, toUnit) {
  const qty = Number(quantity) || 0
  if (!fromUnit || !toUnit || fromUnit === toUnit) return qty
  if (!areUnitsCompatible(fromUnit, toUnit)) return null
  const fromFactor = CONVERSION_TO_BASE[fromUnit] ?? 1
  const toFactor = CONVERSION_TO_BASE[toUnit] ?? 1
  return (qty * fromFactor) / toFactor
}

export function normalizeQuantity(quantity, unit, baseUnit) {
  const converted = convertUnit(quantity, unit, baseUnit)
  return converted === null ? Number(quantity) || 0 : converted
}

export function getDefaultPurchaseUnit(baseUnit) {
  switch (baseUnit) {
    case 'g': return 'kg'
    case 'ml': return 'L'
    case 'pcs': return 'carton'
    default: return baseUnit
  }
}

export function getDefaultConversionFactor(baseUnit) {
  switch (baseUnit) {
    case 'g': return 1000
    case 'ml': return 1000
    case 'pcs': return 24
    default: return 1
  }
}

export const PURCHASE_UNITS = [
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'carton', label: 'Carton / Case' },
  { value: 'bag', label: 'Bag' },
  { value: 'tin', label: 'Tin / Can' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'L', label: 'Liter' },
  { value: 'pcs', label: 'Piece' },
]

export function getPurchaseUnitLabel(unit) {
  return PURCHASE_UNITS.find((u) => u.value === unit)?.label || unit
}

export function describeInventoryPurchase(item = {}) {
  const stockUnit = item.unit || item.baseUnit || 'kg'
  const purchaseUnit = item.purchaseUnit || 'pack'
  const packSize = Number(item.packSize ?? item.conversionFactor ?? 1)
  const purchaseCost = Number(item.purchaseCost ?? 0)
  if (purchaseCost > 0 && purchaseUnit !== stockUnit) {
    return `${purchaseCost} per ${getPurchaseUnitLabel(purchaseUnit).toLowerCase()} (${packSize} ${stockUnit} each)`
  }
  if (purchaseCost > 0) return `${purchaseCost} per ${stockUnit}`
  return null
}

export function inferBaseUnit(unit) {
  const normalized = String(unit || 'pcs').trim()
  if (normalized === 'kg') return 'g'
  if (normalized === 'L') return 'ml'
  if (normalized === 'carton') return 'pcs'
  return normalized
}

export function formatQuantity(quantity, unit, { compact = false } = {}) {
  const qty = Number(quantity) || 0
  if (compact && qty >= 1000 && unit === 'g') return `${(qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 2)} kg`
  if (compact && qty >= 1000 && unit === 'ml') return `${(qty / 1000).toFixed(qty % 1000 === 0 ? 0 : 2)} L`
  const display = Number.isInteger(qty) ? String(qty) : qty.toFixed(2).replace(/\.?0+$/, '')
  return `${display} ${unit}`
}

export function normalizeInventoryItem(item = {}) {
  const legacyUnit = item.unit || item.baseUnit || 'pcs'
  const baseUnit = item.baseUnit || inferBaseUnit(legacyUnit)
  const stock = Number(item.currentStock ?? item.stock ?? 0)
  return {
    ...item,
    baseUnit,
    purchaseUnit: item.purchaseUnit || getDefaultPurchaseUnit(baseUnit),
    conversionFactor: Number(item.conversionFactor) || getDefaultConversionFactor(baseUnit),
    currentStock: stock,
    stock,
    unit: baseUnit,
    minimum: Number(item.minimum ?? item.minimumStock ?? 5),
    minimumStock: Number(item.minimumStock ?? item.minimum ?? 5),
    cost: Number(item.cost ?? item.unitCost ?? 0),
    unitCost: Number(item.unitCost ?? item.cost ?? 0),
  }
}

export function getInventoryStockInUnit(item, unit) {
  const normalized = normalizeInventoryItem(item)
  const targetUnit = unit || normalized.baseUnit
  const converted = convertUnit(normalized.currentStock, normalized.baseUnit, targetUnit)
  return converted === null ? normalized.currentStock : converted
}
