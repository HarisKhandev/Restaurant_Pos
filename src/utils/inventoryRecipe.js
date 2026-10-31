/**
 * Backward-compatible re-exports — prefer importing from specific modules.
 */
import { calculateRecipeCost } from './costing'
import { calcMaxServings, getEffectiveStock } from './inventoryAvailability'
import { getProductRecipe, PRODUCT_TYPES, resolveProductType } from './productInventoryResolver'

export function calcRecipeCost(ingredients = [], inventory = []) {
  return calculateRecipeCost(ingredients, inventory)
}

export { calcMaxServings, getEffectiveStock, getProductRecipe }

export function productUsesRecipe(product, recipes = []) {
  return resolveProductType(product, recipes) === PRODUCT_TYPES.RECIPE
}
