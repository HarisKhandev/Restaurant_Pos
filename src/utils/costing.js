import { normalizeQuantity } from './inventoryUnits'
import { normalizeInventoryItem } from './inventoryUnits'

export function calculateIngredientLineCost(ingredient, inventoryItem) {
  if (!inventoryItem) return 0
  const item = normalizeInventoryItem(inventoryItem)
  const unit = ingredient.unit || item.baseUnit
  const qtyInBase = normalizeQuantity(ingredient.quantity, unit, item.baseUnit)
  return qtyInBase * item.unitCost
}

export function calculateRecipeCost(ingredients = [], inventory = []) {
  return ingredients.reduce((sum, ing) => {
    const item = inventory.find((i) => i.id === ing.inventoryId)
    return sum + calculateIngredientLineCost(ing, item)
  }, 0)
}

export function calculateGrossProfit(sellingPrice, recipeCost) {
  return (Number(sellingPrice) || 0) - (Number(recipeCost) || 0)
}

export function calculateFoodCostPercentage(recipeCost, sellingPrice) {
  const price = Number(sellingPrice) || 0
  if (!price) return 0
  return ((Number(recipeCost) || 0) / price) * 100
}

export function calculateGrossMarginPercentage(recipeCost, sellingPrice) {
  const price = Number(sellingPrice) || 0
  if (!price) return 0
  return (calculateGrossProfit(price, recipeCost) / price) * 100
}

export function getMarginStatus(foodCostPercent) {
  if (foodCostPercent <= 30) return { label: 'Healthy Margin', tone: 'active' }
  if (foodCostPercent <= 45) return { label: 'Medium Margin', tone: 'warning' }
  return { label: 'Low Margin', tone: 'out-of-stock' }
}

export function buildRecipeSnapshot(product, recipe, inventory = []) {
  if (!recipe?.ingredients?.length) return null
  const ingredients = recipe.ingredients.map((ing) => {
    const item = inventory.find((i) => i.id === ing.inventoryId)
    const unit = ing.unit || item?.baseUnit || item?.unit || 'pcs'
    return {
      inventoryItemId: ing.inventoryId,
      name: item?.name || ing.name || 'Unknown',
      quantity: Number(ing.quantity) || 0,
      unit,
      unitCost: normalizeInventoryItem(item).unitCost,
    }
  })
  const estimatedCostAtSale = ingredients.reduce((sum, ing) => sum + ing.quantity * ing.unitCost, 0)
  return {
    productId: product.id,
    productName: product.name,
    sellingPrice: product.price,
    recipeSnapshot: ingredients,
    estimatedCostAtSale,
  }
}
