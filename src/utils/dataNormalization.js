import { calculateRecipeCost } from './costing'
import { calculateProductAvailability } from './inventoryAvailability'
import { getProductRecipe, PRODUCT_TYPES, resolveProductType } from './productInventoryResolver'
import { getDefaultInventorySettings } from './inventoryEngine'
import { getDefaultConversionFactor, getDefaultPurchaseUnit, inferBaseUnit, normalizeInventoryItem } from './inventoryUnits'

export function normalizeRecipe(recipe = {}, product = null) {
  const now = new Date().toISOString()
  return {
    ...recipe,
    id: recipe.id,
    restaurantId: recipe.restaurantId,
    productId: recipe.productId,
    version: recipe.version || 1,
    active: recipe.active !== false,
    ingredients: (recipe.ingredients || []).map((ing) => ({
      inventoryId: ing.inventoryId,
      quantity: Number(ing.quantity) || 0,
      unit: ing.unit || ing.baseUnit || 'pcs',
    })),
    createdAt: recipe.createdAt || now,
    updatedAt: recipe.updatedAt || now,
    name: recipe.name || product?.name || '',
  }
}

export function normalizeProduct(product = {}, recipes = [], inventory = []) {
  const recipe = getProductRecipe(product.id, recipes)
  let productType = product.productType || resolveProductType(product, recipes)
  let inventoryTracking = product.inventoryTracking

  if (inventoryTracking === undefined) {
    inventoryTracking = productType !== PRODUCT_TYPES.SERVICE
  }

  if (!product.productType) {
    if (recipe?.ingredients?.length) productType = PRODUCT_TYPES.RECIPE
    else if (product.stockMode === 'direct') productType = PRODUCT_TYPES.DIRECT_STOCK
    else if (product.comboItems?.length) productType = PRODUCT_TYPES.COMBO
    else if (inventoryTracking === false) productType = PRODUCT_TYPES.SERVICE
    else if (product.stock != null && !recipe) productType = PRODUCT_TYPES.DIRECT_STOCK
    else productType = PRODUCT_TYPES.SERVICE
  }

  const stockMode = productType === PRODUCT_TYPES.RECIPE ? 'recipe'
    : productType === PRODUCT_TYPES.DIRECT_STOCK ? 'direct'
      : product.stockMode

  const recipeCost = recipe?.ingredients?.length
    ? calculateRecipeCost(recipe.ingredients, inventory)
    : Number(product.cost) || 0

  const availability = calculateProductAvailability(
    { ...product, productType, inventoryTracking },
    { products: [product], recipes, inventory },
  )

  return {
    ...product,
    productType,
    inventoryTracking,
    stockMode,
    cost: productType === PRODUCT_TYPES.RECIPE ? recipeCost : Number(product.cost) || 0,
    stock: availability === Infinity ? (product.stock ?? 9999) : availability,
    directStockConfig: product.directStockConfig || (productType === PRODUCT_TYPES.DIRECT_STOCK && product.inventoryItemId
      ? { inventoryItemId: product.inventoryItemId, quantityPerSale: product.quantityPerSale || 1 }
      : product.directStockConfig),
    comboItems: product.comboItems || [],
    allowNegativeStock: product.allowNegativeStock ?? false,
    manuallyDisabled: product.manuallyDisabled ?? (product.available === false),
    station: product.station || product.kitchenStation || 'grill',
    kitchenStation: product.kitchenStation || product.station || 'grill',
    description: product.description || '',
  }
}

export function normalizeAddon(addon = {}) {
  return {
    ...addon,
    inventoryTracking: addon.inventoryTracking ?? false,
    inventoryItemId: addon.inventoryItemId || null,
    quantityPerAddon: Number(addon.quantityPerAddon) || 1,
    unit: addon.unit || 'pcs',
  }
}

export function normalizeRestaurantData(data = {}) {
  const recipes = (data.recipes || []).map((recipe) => {
    const product = (data.products || []).find((p) => p.id === recipe.productId)
    return normalizeRecipe(recipe, product)
  })

  const inventory = (data.inventory || []).map(normalizeInventoryItem)
  const products = (data.products || []).map((product) => normalizeProduct(product, recipes, inventory))
  const addons = (data.addons || []).map(normalizeAddon)

  const restaurants = (data.restaurants || []).map((restaurant) => ({
    ...restaurant,
    inventorySettings: {
      ...getDefaultInventorySettings(),
      ...(restaurant.inventorySettings || {}),
    },
  }))

  return {
    ...data,
    restaurants,
    inventory,
    products,
    recipes,
    addons,
    inventoryMovements: data.inventoryMovements || [],
  }
}

export function normalizeInventoryFormInput(form = {}) {
  const stockUnit = String(form.unit || form.stockUnit || 'kg').trim()
  const stock = Number(form.stock ?? form.currentStock ?? 0)
  const purchaseUnit = form.purchaseUnit || 'pack'
  const packSize = Number(form.packSize ?? form.conversionFactor ?? 1) || 1
  const purchaseCost = Number(form.purchaseCost ?? 0)
  const legacyCost = Number(form.cost ?? form.unitCost ?? 0)
  const unitCost = purchaseCost > 0 ? purchaseCost / packSize : legacyCost

  return {
    ...form,
    baseUnit: form.baseUnit || stockUnit,
    purchaseUnit,
    conversionFactor: packSize,
    packSize,
    purchaseCost: purchaseCost || legacyCost * packSize,
    currentStock: stock,
    stock,
    unit: stockUnit,
    minimum: Number(form.minimum ?? form.minimumStock ?? 5),
    minimumStock: Number(form.minimumStock ?? form.minimum ?? 5),
    cost: unitCost,
    unitCost,
  }
}

export function mapLegacyStockModeToProductType(stockMode, hasRecipe) {
  if (stockMode === 'recipe' || hasRecipe) return PRODUCT_TYPES.RECIPE
  if (stockMode === 'direct') return PRODUCT_TYPES.DIRECT_STOCK
  return PRODUCT_TYPES.SERVICE
}

export function mapProductTypeToStockMode(productType) {
  if (productType === PRODUCT_TYPES.RECIPE) return 'recipe'
  if (productType === PRODUCT_TYPES.DIRECT_STOCK) return 'direct'
  return null
}
