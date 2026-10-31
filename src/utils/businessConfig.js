/** Business-type-specific labels, categories and dropdown options. */

export const BUSINESS_TYPES = ['restaurant', 'bakery', 'pharmacy', 'mart', 'retail']

/** Menu categories: restaurant type also includes bakery sections (breads, pastries, etc.). */
export function getMenuCategories(allCategories = [], businessType = 'restaurant') {
  const type = businessType || 'restaurant'
  const allowed = type === 'restaurant' ? ['restaurant', 'bakery'] : [type]
  return allCategories.filter(
    (c) => c.active && (!c.businessTypes?.length || c.businessTypes.some((bt) => allowed.includes(bt))),
  )
}

export const INVENTORY_CATEGORIES = {
  restaurant: [
    { value: 'Meat', label: 'Meat & Poultry', hint: 'Chicken, beef, mutton, seafood' },
    { value: 'Produce', label: 'Fresh Produce', hint: 'Vegetables, herbs, fruits' },
    { value: 'Dairy', label: 'Dairy & Eggs', hint: 'Milk, cheese, cream, butter, eggs' },
    { value: 'Dry Goods', label: 'Dry Goods & Grains', hint: 'Rice, flour, pasta, lentils' },
    { value: 'Bakery', label: 'Bakery & Pastry', hint: 'Flour, yeast, chocolate, fondant' },
    { value: 'Spices', label: 'Spices & Seasonings', hint: 'Masala, herbs, salt, pepper' },
    { value: 'Sauces', label: 'Sauces & Condiments', hint: 'Ketchup, mayo, chutneys, oils' },
    { value: 'Beverages', label: 'Beverages', hint: 'Syrups, juices, coffee, tea' },
    { value: 'Frozen', label: 'Frozen', hint: 'Frozen fries, paratha, seafood' },
    { value: 'Packaging', label: 'Packaging', hint: 'Takeaway boxes, bags, containers' },
  ],
  bakery: [
    { value: 'Flour & Baking', label: 'Flour & Baking', hint: 'Flour, yeast, baking powder, starch' },
    { value: 'Dairy', label: 'Dairy & Eggs', hint: 'Butter, cream, milk, eggs' },
    { value: 'Sugar & Sweeteners', label: 'Sugar & Sweeteners', hint: 'Sugar, honey, fondant, syrup' },
    { value: 'Chocolate & Fillings', label: 'Chocolate & Fillings', hint: 'Chocolate, ganache, jams, nuts' },
    { value: 'Flavourings', label: 'Flavourings', hint: 'Vanilla, essences, spices' },
    { value: 'Produce', label: 'Fresh Produce', hint: 'Fruits, berries for decoration' },
    { value: 'Beverages', label: 'Beverages', hint: 'Coffee, tea, syrups' },
    { value: 'Packaging', label: 'Packaging', hint: 'Cake boxes, bags, boards' },
  ],
  pharmacy: [
    { value: 'Medicines', label: 'Medicines', hint: 'Tablets, capsules, syrups' },
    { value: 'OTC', label: 'Over-the-counter', hint: 'Pain relief, vitamins, first aid' },
    { value: 'Devices', label: 'Medical devices', hint: 'Thermometers, monitors' },
    { value: 'Personal Care', label: 'Personal care', hint: 'Skincare, hygiene products' },
  ],
  mart: [
    { value: 'Grains', label: 'Grains & Staples', hint: 'Rice, flour, pulses' },
    { value: 'Dairy', label: 'Dairy', hint: 'Milk, yogurt, cheese' },
    { value: 'Meat', label: 'Meat & Poultry', hint: 'Fresh and frozen meat' },
    { value: 'Produce', label: 'Fresh Produce', hint: 'Fruits and vegetables' },
    { value: 'Snacks', label: 'Snacks & Packaged', hint: 'Chips, biscuits, noodles' },
    { value: 'Beverages', label: 'Beverages', hint: 'Soft drinks, juices, water' },
    { value: 'Household', label: 'Household', hint: 'Cleaning, toiletries' },
  ],
  retail: [
    { value: 'Apparel', label: 'Apparel', hint: 'Clothing items' },
    { value: 'Footwear', label: 'Footwear', hint: 'Shoes, sandals' },
    { value: 'Accessories', label: 'Accessories', hint: 'Bags, belts, jewelry' },
    { value: 'Packaging', label: 'Packaging', hint: 'Bags, gift wrap' },
  ],
}

export const KITCHEN_STATIONS = {
  restaurant: [
    { value: 'grill', label: 'Grill', hint: 'Burgers, BBQ, steaks' },
    { value: 'pizza', label: 'Pizza', hint: 'Pizza oven station' },
    { value: 'karahi', label: 'Karahi / Wok', hint: 'Curries, handi, karahi' },
    { value: 'tandoor', label: 'Tandoor', hint: 'Naan, tikka, tandoori' },
    { value: 'rice', label: 'Rice Station', hint: 'Biryani, pulao, fried rice' },
    { value: 'bakery', label: 'Bakery', hint: 'Breads, pastries, baked desserts' },
    { value: 'cold', label: 'Cold Prep', hint: 'Salads, plating, cold desserts' },
    { value: 'drinks', label: 'Bar / Drinks', hint: 'Hot and cold beverages' },
    { value: 'mixed', label: 'Expo / Mixed', hint: 'Multi-station or combo items' },
  ],
  bakery: [
    { value: 'bakery', label: 'Baking', hint: 'Oven — breads, pastries, cakes' },
    { value: 'cold', label: 'Finishing', hint: 'Icing, decoration, assembly' },
    { value: 'drinks', label: 'Café Bar', hint: 'Coffee, tea, beverages' },
    { value: 'mixed', label: 'Mixed', hint: 'Multi-step items' },
  ],
  pharmacy: [],
  mart: [],
  retail: [],
}

export const WASTE_REASONS = {
  restaurant: ['Spoilage', 'Expired', 'Kitchen waste', 'Prep trim', 'Customer return', 'Damaged', 'Other'],
  bakery: ['Spoilage', 'Expired', 'Over-baked', 'Decoration waste', 'Customer return', 'Damaged', 'Other'],
  pharmacy: ['Expired', 'Damaged', 'Recalled', 'Customer return', 'Other'],
  mart: ['Expired', 'Damaged', 'Spoilage', 'Customer return', 'Other'],
  retail: ['Damaged', 'Customer return', 'Defective', 'Other'],
}

export const BUSINESS_LABELS = {
  restaurant: {
    product: 'Menu item',
    products: 'Menu & products',
    productPlural: 'menu items',
    inventory: 'Ingredients',
    inventoryItem: 'Ingredient',
    recipe: 'Recipe',
    category: 'Menu category',
    inventoryCategory: 'Ingredient category',
    addon: 'Add-on',
    posEyebrow: 'POINT OF SALE',
  },
  bakery: {
    product: 'Product',
    products: 'Products & menu',
    productPlural: 'products',
    inventory: 'Ingredients',
    inventoryItem: 'Ingredient',
    recipe: 'Recipe',
    category: 'Product category',
    inventoryCategory: 'Ingredient category',
    addon: 'Add-on',
    posEyebrow: 'POINT OF SALE',
  },
  pharmacy: {
    product: 'Product',
    products: 'Products',
    productPlural: 'products',
    inventory: 'Stock',
    inventoryItem: 'Stock item',
    recipe: 'Bill of materials',
    category: 'Category',
    inventoryCategory: 'Category',
    addon: 'Add-on',
    posEyebrow: 'POINT OF SALE',
  },
  mart: {
    product: 'Product',
    products: 'Products',
    productPlural: 'products',
    inventory: 'Stock',
    inventoryItem: 'Stock item',
    recipe: 'Bundle recipe',
    category: 'Category',
    inventoryCategory: 'Category',
    addon: 'Add-on',
    posEyebrow: 'POINT OF SALE',
  },
  retail: {
    product: 'Product',
    products: 'Products',
    productPlural: 'products',
    inventory: 'Stock',
    inventoryItem: 'Stock item',
    recipe: 'Bundle recipe',
    category: 'Category',
    inventoryCategory: 'Category',
    addon: 'Add-on',
    posEyebrow: 'POINT OF SALE',
  },
}

export function getInventoryCategories(businessType = 'restaurant') {
  return INVENTORY_CATEGORIES[businessType] || INVENTORY_CATEGORIES.restaurant
}

export function getKitchenStations(businessType = 'restaurant') {
  return KITCHEN_STATIONS[businessType] || KITCHEN_STATIONS.restaurant
}

export function getWasteReasons(businessType = 'restaurant') {
  return WASTE_REASONS[businessType] || WASTE_REASONS.restaurant
}

export function getBusinessLabels(businessType = 'restaurant') {
  return BUSINESS_LABELS[businessType] || BUSINESS_LABELS.restaurant
}

export function getDefaultInventoryCategory(businessType = 'restaurant') {
  return getInventoryCategories(businessType)[0]?.value || 'Dry Goods'
}

export function getDefaultKitchenStation(businessType = 'restaurant') {
  return getKitchenStations(businessType)[0]?.value || 'grill'
}

export function getDefaultMenuCategory(categories = [], businessType = 'restaurant') {
  const menu = getMenuCategories(categories, businessType)
  if (businessType === 'restaurant') {
    return menu.find((c) => c.name === 'Burgers')?.name || menu[0]?.name || 'Popular'
  }
  if (businessType === 'bakery') {
    return menu.find((c) => c.name === 'Pastries')?.name || menu[0]?.name || 'Pastries'
  }
  return menu[0]?.name || 'Popular'
}

/** Grouped recipe/menu filters — restaurant includes a Bakery tab for breads, pastries, etc. */
export const RECIPE_CATEGORY_FILTERS = {
  restaurant: {
    All: null,
    Mains: ['Popular', 'Burgers', 'Pizza', 'BBQ', 'Pakistani', 'Rice'],
    Bakery: ['Breads', 'Pastries', 'Cakes', 'Cookies', 'Desserts'],
    Drinks: ['Hot Drinks', 'Cold Drinks'],
    Starters: ['Starters'],
  },
  bakery: {
    All: null,
    Breads: ['Breads'],
    Pastries: ['Pastries'],
    Cakes: ['Cakes'],
    Cookies: ['Cookies'],
    Desserts: ['Desserts'],
    Drinks: ['Hot Drinks', 'Cold Drinks', 'Beverages'],
  },
}

export function getRecipeCategoryTabs(businessType = 'restaurant') {
  const filters = RECIPE_CATEGORY_FILTERS[businessType] || RECIPE_CATEGORY_FILTERS.restaurant
  return Object.keys(filters)
}

export function matchesRecipeCategoryTab(category, tab, businessType = 'restaurant') {
  if (tab === 'All') return true
  const filters = RECIPE_CATEGORY_FILTERS[businessType] || RECIPE_CATEGORY_FILTERS.restaurant
  const allowed = filters[tab]
  return allowed ? allowed.includes(category) : true
}
