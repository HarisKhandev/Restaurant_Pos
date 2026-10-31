export const FEATURE_MODULES = [
  { key: 'sales', label: 'Point of Sale', desc: 'Counter billing, payments and checkout. Sold as the core POS module.', features: [['pos', 'POS Billing']] },
  { key: 'front_of_house', label: 'Front of House', desc: 'Floor service — tables, waiters and reservations.', features: [['tables', 'Table Management'], ['reservations', 'Reservations']] },
  { key: 'kitchen', label: 'Kitchen', desc: 'Live tickets, stations and prep timing for the back of house.', features: [['kds', 'Kitchen Display']] },
  { key: 'online', label: 'Online Commerce', desc: 'Direct-to-customer storefront with live menu sync.', features: [['online', 'Online Ordering']] },
  { key: 'delivery', label: 'Delivery & Fleet', desc: 'Dispatch, rider assignment and live delivery status.', features: [['delivery', 'Delivery'], ['riders', 'Rider Management']] },
  { key: 'inventory', label: 'Inventory & Supply', desc: 'Stock, recipes, purchasing and automatic reorder lists.', features: [['inventory', 'Inventory'], ['purchasing', 'Purchasing']] },
  { key: 'customers', label: 'Customers', desc: 'Profiles, order history, loyalty and rewards.', features: [['crm', 'Customer CRM'], ['loyalty', 'Loyalty']] },
  { key: 'finance', label: 'Finance & Compliance', desc: 'Expenses, ledgers, analytics and fiscal reporting.', features: [['expenses', 'Expenses'], ['accounting', 'Accounting'], ['reports', 'Advanced Reports'], ['fbr', 'FBR']] },
]

export const FEATURES = FEATURE_MODULES.flatMap((module) => module.features)

export const BTYPE_COLORS = { restaurant: '#0f766e', bakery: '#b45309', pharmacy: '#059669', mart: '#2563eb', retail: '#7c3aed' }
export const BTYPE_LABELS = { restaurant: 'Restaurant', bakery: 'Bakery', pharmacy: 'Pharmacy', mart: 'Mart', retail: 'Retail' }

export const BUSINESS_TYPE_FEATURES = {
  restaurant: ['pos', 'inventory', 'kds', 'online', 'delivery', 'tables', 'reservations', 'loyalty', 'crm', 'reports', 'accounting', 'fbr', 'riders', 'expenses', 'purchasing'],
  bakery:     ['pos', 'inventory', 'kds', 'online', 'delivery', 'tables', 'crm', 'reports', 'riders', 'expenses', 'purchasing'],
  pharmacy:   ['pos', 'inventory', 'delivery', 'crm', 'reports', 'riders', 'expenses', 'purchasing'],
  mart:       ['pos', 'inventory', 'delivery', 'crm', 'reports', 'riders', 'expenses', 'purchasing'],
  retail:     ['pos', 'inventory', 'delivery', 'crm', 'reports', 'expenses', 'purchasing'],
}

export const BUSINESS_TYPE_NAV = {
  restaurant: ['Dashboard', 'POS', 'Orders', 'Tables', 'Kitchen', 'Kitchen Progress', 'Menu & Products', 'Addons', 'Offers', 'Inventory', 'Stock Movement', 'Stock Lists', 'Purchasing', 'Customers', 'Delivery', 'Loyalty', 'Employees', 'Roles', 'Shifts', 'Expenses', 'Ledger', 'Reports', 'Settings'],
  bakery:     ['Dashboard', 'POS', 'Orders', 'Tables', 'Kitchen', 'Kitchen Progress', 'Menu & Products', 'Addons', 'Inventory', 'Stock Movement', 'Stock Lists', 'Purchasing', 'Customers', 'Delivery', 'Employees', 'Roles', 'Expenses', 'Ledger', 'Reports', 'Settings'],
  pharmacy:   ['Dashboard', 'POS', 'Orders', 'Menu & Products', 'Addons', 'Inventory', 'Stock Movement', 'Stock Lists', 'Purchasing', 'Customers', 'Delivery', 'Employees', 'Roles', 'Expenses', 'Ledger', 'Reports', 'Settings'],
  mart:       ['Dashboard', 'POS', 'Orders', 'Menu & Products', 'Addons', 'Inventory', 'Stock Movement', 'Stock Lists', 'Purchasing', 'Customers', 'Delivery', 'Employees', 'Roles', 'Expenses', 'Ledger', 'Reports', 'Settings'],
  retail:     ['Dashboard', 'POS', 'Orders', 'Menu & Products', 'Addons', 'Inventory', 'Stock Movement', 'Stock Lists', 'Purchasing', 'Customers', 'Delivery', 'Employees', 'Roles', 'Expenses', 'Ledger', 'Reports', 'Settings'],
}

const fullFeatures = Object.fromEntries(FEATURES.map(([key]) => [key, true]))
const proFeatures = { ...fullFeatures, reservations: false, accounting: false }
const starterFeatures = Object.fromEntries(FEATURES.map(([key]) => [key, ['pos', 'tables', 'expenses'].includes(key)]))

export const DEFAULT_PREP_SETTINGS = {
  baseMinutes: 10,
  deliveryMinutes: 15,
  rangeBuffer: 10,
  extraPerItemMinutes: 3,
  largeOrderExtra: 10,
  multiStationExtra: 8,
  busyMode: false,
  busyExtraMinutes: 15,
  categoryPrepMinutes: {},
}

const CATEGORY_PREP = {
  Popular: 25, Burgers: 15, Pizza: 22, BBQ: 20, Pakistani: 40, Rice: 18, Starters: 12,
  Desserts: 8, 'Hot Drinks': 5, 'Cold Drinks': 3, Deal: 30, Pastries: 10, Breads: 12,
  Cakes: 15, Cookies: 8, 'Pain Relief': 3, Antibiotics: 5, Vitamins: 3, Groceries: 5,
  Dairy: 4, Snacks: 3, Shirts: 2, Pants: 2, Shoes: 2, Accessories: 2, Bags: 2,
}

const CATEGORY_STATION = {
  Popular: 'grill', Burgers: 'grill', Pizza: 'pizza', BBQ: 'grill', Pakistani: 'karahi',
  Rice: 'rice', Starters: 'grill', Desserts: 'cold', 'Hot Drinks': 'drinks', 'Cold Drinks': 'drinks', Deal: 'mixed',
}

const withPrepMeta = (product) => ({
  ...product,
  prepMinutes: product.prepMinutes ?? CATEGORY_PREP[product.category] ?? 15,
  station: product.station ?? CATEGORY_STATION[product.category] ?? 'grill',
})

export const restaurants = [
  { id: 'r1', type: 'restaurant', slug: 'salt-and-ember', name: 'Salt & Ember', legalName: 'Salt and Ember Foods Pvt Ltd', owner: 'Hamza Qureshi', email: 'hamza@saltandember.pk', phone: '0300 1234567', city: 'Lahore', address: '42 MM Alam Road, Gulberg III', plan: 'Enterprise', status: 'Active', monthlySales: 12840000, users: 24, createdAt: '2025-02-14', branding: { primary: '#0f766e', secondary: '#134e4a', accent: '#f59e0b', mark: 'S&E' }, features: fullFeatures, prepSettings: { ...DEFAULT_PREP_SETTINGS, categoryPrepMinutes: { Pakistani: 42, Pizza: 24 } } },
  { id: 'r2', type: 'restaurant', slug: 'daig-house', name: 'Daig House', legalName: 'Daig House Restaurants', owner: 'Areeba Malik', email: 'hello@daighouse.pk', phone: '0321 9876543', city: 'Islamabad', address: '18 Jinnah Super, F-7', plan: 'Professional', status: 'Active', monthlySales: 7650000, users: 16, createdAt: '2025-05-08', branding: { primary: '#9a3412', secondary: '#431407', accent: '#fbbf24', mark: 'DH' }, features: proFeatures },
  { id: 'r3', type: 'restaurant', slug: 'urban-tandoor', name: 'Urban Tandoor', legalName: 'Urban Tandoor PK', owner: 'Saad Ali', email: 'ops@urbantandoor.pk', phone: '0333 4455667', city: 'Karachi', address: '7-C Khayaban-e-Seher, DHA', plan: 'Professional', status: 'Active', monthlySales: 9240000, users: 19, createdAt: '2025-06-22', branding: { primary: '#be123c', secondary: '#4c0519', accent: '#fb7185', mark: 'UT' }, features: { ...proFeatures, online: false, delivery: false, loyalty: false } },
  { id: 'r4', type: 'restaurant', slug: 'basil-and-bun', name: 'Basil & Bun', legalName: 'Basil and Bun Foods', owner: 'Maham Raza', email: 'maham@basilbun.pk', phone: '0308 2255779', city: 'Rawalpindi', address: 'Bahria Food Street, Phase 7', plan: 'Starter', status: 'Trial', monthlySales: 2180000, users: 7, createdAt: '2026-07-01', branding: { primary: '#4d7c0f', secondary: '#1a2e05', accent: '#84cc16', mark: 'B&B' }, features: { ...starterFeatures, online: true, delivery: true, reservations: true } },
  { id: 'r5', type: 'restaurant', slug: 'khyber-courtyard', name: 'Khyber Courtyard', legalName: 'Khyber Courtyard Foods', owner: 'Bilal Khan', email: 'bilal@khybercourt.pk', phone: '0315 7788990', city: 'Faisalabad', address: 'Canal Road, Kohinoor City', plan: 'Starter', status: 'Suspended', monthlySales: 1430000, users: 5, createdAt: '2025-11-19', branding: { primary: '#4338ca', secondary: '#1e1b4b', accent: '#818cf8', mark: 'KC' }, features: starterFeatures },
  { id: 'r6', type: 'bakery', slug: 'golden-crust-bakery', name: 'Golden Crust Bakery', owner: 'Nadia Farooq', email: 'nadia@goldencrust.pk', phone: '0342 5567890', city: 'Lahore', address: '15 Liberty Market', plan: 'Professional', status: 'Active', monthlySales: 4200000, users: 8, createdAt: '2026-01-15', branding: { primary: '#b45309', secondary: '#78350f', accent: '#fbbf24', mark: 'GC' }, features: fullFeatures },
  { id: 'r7', type: 'pharmacy', slug: 'medicare-pharmacy', name: 'MediCare Pharmacy', owner: 'Dr. Asim Rauf', email: 'asim@medicare.pk', phone: '0300 7788990', city: 'Islamabad', address: '23 Blue Area, F-6', plan: 'Professional', status: 'Active', monthlySales: 6800000, users: 12, createdAt: '2025-09-20', branding: { primary: '#059669', secondary: '#064e3b', accent: '#34d399', mark: 'MC' }, features: fullFeatures },
  { id: 'r8', type: 'mart', slug: 'freshmart-express', name: 'FreshMart Express', owner: 'Kamran Javed', email: 'kamran@freshmart.pk', phone: '0321 3344556', city: 'Karachi', address: '88 Shahrah-e-Faisal', plan: 'Enterprise', status: 'Active', monthlySales: 15200000, users: 20, createdAt: '2025-04-10', branding: { primary: '#2563eb', secondary: '#1e3a5f', accent: '#60a5fa', mark: 'FM' }, features: fullFeatures },
  { id: 'r9', type: 'retail', slug: 'stylehub-retail', name: 'StyleHub Retail', owner: 'Ayesha Amin', email: 'ayesha@stylehub.pk', phone: '0333 9988776', city: 'Lahore', address: '45 Fortress Stadium', plan: 'Professional', status: 'Active', monthlySales: 8900000, users: 14, createdAt: '2025-07-05', branding: { primary: '#7c3aed', secondary: '#4c1d95', accent: '#a78bfa', mark: 'SH' }, features: fullFeatures },
]

export const branches = [
  { id: 'b1', restaurantId: 'r1', name: 'Gulberg', city: 'Lahore', address: '42 MM Alam Road', manager: 'Ali Raza', phone: '042 35781234', status: 'Active', terminals: 4, tables: 22 },
  { id: 'b2', restaurantId: 'r1', name: 'DHA Phase 6', city: 'Lahore', address: 'CCA, Phase 6', manager: 'Sana Ahmed', phone: '042 37181234', status: 'Active', terminals: 3, tables: 18 },
  { id: 'b3', restaurantId: 'r1', name: 'F-7', city: 'Islamabad', address: 'Jinnah Super, F-7', manager: 'Usman Tariq', phone: '051 2728123', status: 'Active', terminals: 3, tables: 16 },
  { id: 'b4', restaurantId: 'r2', name: 'Jinnah Super', city: 'Islamabad', address: '18 Jinnah Super', manager: 'Hira Noor', phone: '051 2651122', status: 'Active', terminals: 3, tables: 20 },
  { id: 'b5', restaurantId: 'r2', name: 'Bahria Town', city: 'Rawalpindi', address: 'Civic Center', manager: 'Adeel Shah', phone: '051 5708181', status: 'Active', terminals: 2, tables: 14 },
  { id: 'b6', restaurantId: 'r3', name: 'DHA Seher', city: 'Karachi', address: 'Khayaban-e-Seher', manager: 'Ayesha Siddiq', phone: '021 35241120', status: 'Active', terminals: 4, tables: 24 },
  { id: 'b7', restaurantId: 'r4', name: 'Bahria Phase 7', city: 'Rawalpindi', address: 'Food Street', manager: 'Zainab Saeed', phone: '051 5177991', status: 'Active', terminals: 2, tables: 12 },
  { id: 'b8', restaurantId: 'r5', name: 'Kohinoor City', city: 'Faisalabad', address: 'Canal Road', manager: 'Fahad Iqbal', phone: '041 8711220', status: 'Inactive', terminals: 2, tables: 15 },
  // Bakery branches
  { id: 'b9', restaurantId: 'r6', name: 'Liberty Market', city: 'Lahore', address: '15 Liberty Market', manager: 'Saba Khalid', phone: '042 36301234', status: 'Active', terminals: 2, tables: 10 },
  { id: 'b10', restaurantId: 'r6', name: 'Johar Town', city: 'Lahore', address: '22 Johar Town Main Blvd', manager: 'Rizwan Ahmed', phone: '042 35291001', status: 'Active', terminals: 2, tables: 8 },
  // Pharmacy branches
  { id: 'b11', restaurantId: 'r7', name: 'Blue Area', city: 'Islamabad', address: '23 Blue Area, F-6', manager: 'Dr. Sadia Nawaz', phone: '051 2873456', status: 'Active', terminals: 3, tables: 0 },
  { id: 'b12', restaurantId: 'r7', name: 'G-9 Markaz', city: 'Islamabad', address: '5 G-9 Markaz', manager: 'Kashif Mehmood', phone: '051 2261100', status: 'Active', terminals: 2, tables: 0 },
  // Mart branches
  { id: 'b13', restaurantId: 'r8', name: 'Shahrah-e-Faisal', city: 'Karachi', address: '88 Shahrah-e-Faisal', manager: 'Junaid Anwar', phone: '021 34561234', status: 'Active', terminals: 5, tables: 0 },
  { id: 'b14', restaurantId: 'r8', name: 'Clifton', city: 'Karachi', address: '12 Clifton Block 5', manager: 'Noman Aslam', phone: '021 35831234', status: 'Active', terminals: 4, tables: 0 },
  // Retail branches
  { id: 'b15', restaurantId: 'r9', name: 'Fortress Stadium', city: 'Lahore', address: '45 Fortress Stadium', manager: 'Hammad Raza', phone: '042 36671234', status: 'Active', terminals: 3, tables: 0 },
  { id: 'b16', restaurantId: 'r9', name: 'Packages Mall', city: 'Lahore', address: 'Shop 201, Packages Mall', manager: 'Fariha Asif', phone: '042 35111234', status: 'Active', terminals: 2, tables: 0 },
]

export const categories = [
  // Restaurant categories
  { id: 'c1', name: 'Popular', active: true, businessTypes: ['restaurant'] },
  { id: 'c2', name: 'Burgers', active: true, businessTypes: ['restaurant'] },
  { id: 'c3', name: 'Pizza', active: true, businessTypes: ['restaurant'] },
  { id: 'c4', name: 'BBQ', active: true, businessTypes: ['restaurant'] },
  { id: 'c5', name: 'Pakistani', active: true, businessTypes: ['restaurant'] },
  { id: 'c6', name: 'Rice', active: true, businessTypes: ['restaurant'] },
  { id: 'c7', name: 'Starters', active: true, businessTypes: ['restaurant'] },
  { id: 'c8', name: 'Desserts', active: true, businessTypes: ['restaurant', 'bakery'] },
  { id: 'c9', name: 'Hot Drinks', active: true, businessTypes: ['restaurant', 'bakery'] },
  { id: 'c10', name: 'Cold Drinks', active: true, businessTypes: ['restaurant', 'bakery', 'mart'] },
  // Bakery categories
  { id: 'c11', name: 'Breads', active: true, businessTypes: ['restaurant', 'bakery'] },
  { id: 'c12', name: 'Pastries', active: true, businessTypes: ['restaurant', 'bakery'] },
  { id: 'c13', name: 'Cakes', active: true, businessTypes: ['restaurant', 'bakery'] },
  { id: 'c14', name: 'Cookies', active: true, businessTypes: ['restaurant', 'bakery'] },
  { id: 'c15', name: 'Beverages', active: true, businessTypes: ['bakery'] },
  // Pharmacy categories
  { id: 'c16', name: 'Pain Relief', active: true, businessTypes: ['pharmacy'] },
  { id: 'c17', name: 'Antibiotics', active: true, businessTypes: ['pharmacy'] },
  { id: 'c18', name: 'Vitamins', active: true, businessTypes: ['pharmacy'] },
  { id: 'c19', name: 'Devices', active: true, businessTypes: ['pharmacy'] },
  { id: 'c20', name: 'First Aid', active: true, businessTypes: ['pharmacy'] },
  // Mart categories
  { id: 'c21', name: 'Grains', active: true, businessTypes: ['mart'] },
  { id: 'c22', name: 'Dairy', active: true, businessTypes: ['mart'] },
  { id: 'c23', name: 'Meat', active: true, businessTypes: ['mart'] },
  { id: 'c24', name: 'Produce', active: true, businessTypes: ['mart'] },
  { id: 'c25', name: 'Snacks', active: true, businessTypes: ['mart'] },
  // Retail categories
  { id: 'c26', name: 'Shirts', active: true, businessTypes: ['retail'] },
  { id: 'c27', name: 'Pants', active: true, businessTypes: ['retail'] },
  { id: 'c28', name: 'Shoes', active: true, businessTypes: ['retail'] },
  { id: 'c29', name: 'Accessories', active: true, businessTypes: ['retail'] },
  { id: 'c30', name: 'Bags', active: true, businessTypes: ['retail'] },
]

const productNames = [
  ['Smoky Chicken Burger', 890, 'Burgers'], ['Firehouse Beef Burger', 1090, 'Burgers'], ['Classic Crispy Burger', 690, 'Burgers'], ['Loaded Mushroom Burger', 1190, 'Burgers'],
  ['Margherita Pizza', 1290, 'Pizza'], ['Chicken Tikka Pizza', 1690, 'Pizza'], ['Smoked Beef Pizza', 1890, 'Pizza'], ['Four Cheese Pizza', 1790, 'Pizza'],
  ['Chicken Tikka', 760, 'BBQ'], ['Malai Boti', 880, 'BBQ'], ['Seekh Kebab', 720, 'BBQ'], ['Mutton Chops', 1590, 'BBQ'],
  ['Chicken Karahi', 1890, 'Pakistani'], ['Mutton Karahi', 2890, 'Pakistani'], ['Daal Makhni', 690, 'Pakistani'], ['Paneer Handi', 1190, 'Pakistani'],
  ['Chicken Biryani', 490, 'Rice'], ['Mutton Pulao', 690, 'Rice'], ['Egg Fried Rice', 520, 'Rice'], ['Special Kabuli Pulao', 790, 'Rice'],
  ['Dynamite Prawns', 1290, 'Starters'], ['Loaded Fries', 690, 'Starters'], ['Chicken Wings', 790, 'Starters'], ['Hummus Platter', 650, 'Starters'],
  ['Lotus Cheesecake', 590, 'Desserts'], ['Gulab Jamun', 290, 'Desserts'], ['Chocolate Brownie', 520, 'Desserts'], ['Kheer', 320, 'Desserts'],
  ['Karak Chai', 190, 'Hot Drinks'], ['Cappuccino', 390, 'Hot Drinks'], ['Green Tea', 220, 'Hot Drinks'], ['Hot Chocolate', 450, 'Hot Drinks'],
  ['Mint Margarita', 390, 'Cold Drinks'], ['Peach Iced Tea', 350, 'Cold Drinks'], ['Soft Drink', 180, 'Cold Drinks'], ['Mineral Water', 120, 'Cold Drinks'],
  ['Grilled Chicken', 1290, 'Popular'], ['Sizzling Steak', 2190, 'Popular'], ['Club Sandwich', 790, 'Popular'], ['Family BBQ Platter', 3490, 'Popular'],
]

const burgerAddonIds = ['a1', 'a2', 'a3', 'a4']
const pizzaAddonIds = ['a5', 'a6', 'a7', 'a8']
const bbqAddonIds = ['a9', 'a10', 'a11', 'a12']

const r1Products = productNames.map(([name, price, category], index) => withPrepMeta({
  id: `p${index + 1}`, restaurantId: 'r1', name, price, cost: Math.round(price * .38), category,
  sku: `SE-${String(index + 1).padStart(3, '0')}`, available: index !== 11, stock: 12 + (index * 7) % 48,
  barcode: `890${String(1000000000 + index * 73).slice(0, 9)}0`,
  image: `https://images.unsplash.com/photo-${['1568901346375-23c9450c58cd','1574071318508-1cdbab80d002','1547592180-85f173990554','1504674900247-0877df9cc836'][index % 4]}?auto=format&fit=crop&w=500&q=70`,
  modifiers: index < 12 ? [
    { name: 'Size', required: true, multiple: false, options: [{ name: 'Regular', price: 0 }, { name: 'Large', price: 220 }] },
  ] : [],
  addonIds: index < 4 ? burgerAddonIds : index < 8 ? pizzaAddonIds : index < 12 ? bbqAddonIds : [],
}))

const r2ProductNames = [
  ['Beef Nihari', 890, 'Pakistani'], ['Chicken Handi', 1190, 'Pakistani'], ['Mutton Paya', 790, 'Pakistani'], ['Haleem', 590, 'Pakistani'],
  ['Lamb Biryani', 690, 'Rice'], ['Chicken Pulao', 490, 'Rice'], ['Chapli Kebab', 650, 'BBQ'], ['Reshmi Kebab', 720, 'BBQ'],
  ['Daal Chawal', 390, 'Pakistani'], ['Chicken Sajji', 1590, 'BBQ'], ['Raita', 150, 'Starters'], ['Naan', 80, 'Starters'],
]
const r2FoodImages = [
  '1585937421612-70a008356fbe', '1565557623262-b51c2513a641', '1596797038530-2c107229654b',
  '1546833999-b9f581a1996d', '1563379091339-7aaac94bb1d4', '1604386846325-4c02182f1e1a',
  '1565299624946-b28f40a0ae38', '1555939593-31d81256ad58', '1588166521115-4b912c5d6c8e',
  '1606491956689-2ea866880049', '1512621776951-a57141f2eefd', '1626700051175-68c3a707a67f',
]
const r2Products = r2ProductNames.map(([name, price, category], index) => withPrepMeta({
  id: `p${50 + index}`, restaurantId: 'r2', name, price, cost: Math.round(price * .4), category,
  sku: `DH-${String(index + 1).padStart(3, '0')}`, available: true, stock: 20 + (index * 5) % 30,
  barcode: `890${String(2000000000 + index * 73).slice(0, 9)}0`,
  image: `https://images.unsplash.com/photo-${r2FoodImages[index % r2FoodImages.length]}?auto=format&fit=crop&w=500&q=70`,
  modifiers: [],
}))

// Bakery products (r6)
const bakeryProductNames = [
  ['Croissant', 280, 'Pastries'], ['Sourdough Bread', 450, 'Breads'], ['Chocolate Cake', 1890, 'Cakes'], ['Red Velvet Cupcake', 350, 'Cakes'],
  ['Danish Pastry', 320, 'Pastries'], ['Baguette', 380, 'Breads'], ['Cinnamon Roll', 290, 'Pastries'], ['Blueberry Muffin', 260, 'Pastries'],
  ['Brownie', 220, 'Desserts'], ['Eclair', 340, 'Pastries'], ['Macaron Box', 1290, 'Cookies'], ['Wedding Cake Slice', 590, 'Cakes'],
]
const r6Products = bakeryProductNames.map(([name, price, category], index) => ({
  id: `p${100 + index}`, restaurantId: 'r6', name, price, cost: Math.round(price * .35), category,
  sku: `GC-${String(index + 1).padStart(3, '0')}`, available: true, stock: 15 + (index * 4) % 30,
  barcode: `890${String(6000000000 + index * 73).slice(0, 9)}0`,
  image: `https://images.unsplash.com/photo-${['1555507036-ab1f4038024a','1509440159596-0249088772ff','1578985545062-69928b1d9587','1587668178277-295251f900ce'][index % 4]}?auto=format&fit=crop&w=500&q=70`,
  modifiers: index < 4 ? [
    { name: 'Size', required: true, multiple: false, options: [{ name: 'Regular', price: 0 }, { name: 'Large', price: 150 }] },
  ] : [],
}))

// Pharmacy products (r7)
const pharmacyProductNames = [
  ['Panadol Extra', 180, 'Pain Relief'], ['Augmentin 625mg', 890, 'Antibiotics'], ['Brufen 400mg', 150, 'Pain Relief'], ['Omeprazole 20mg', 220, 'Pain Relief'],
  ['Cetirizine 10mg', 120, 'Pain Relief'], ['Metformin 500mg', 280, 'Pain Relief'], ['Amoxicillin 500mg', 350, 'Antibiotics'], ['Vitamin D3', 490, 'Vitamins'],
  ['Calcium Tablets', 380, 'Vitamins'], ['Blood Pressure Monitor', 4500, 'Devices'], ['Digital Thermometer', 1200, 'Devices'], ['First Aid Kit', 2500, 'First Aid'],
]
const r7Products = pharmacyProductNames.map(([name, price, category], index) => ({
  id: `p${120 + index}`, restaurantId: 'r7', name, price, cost: Math.round(price * .55), category,
  sku: `MC-${String(index + 1).padStart(3, '0')}`, available: true, stock: 50 + (index * 11) % 100,
  barcode: `890${String(7000000000 + index * 73).slice(0, 9)}0`,
  image: '',
  modifiers: [],
}))

// Mart products (r8)
const martProductNames = [
  ['Basmati Rice 5kg', 1450, 'Grains'], ['Cooking Oil 5L', 2890, 'Grains'], ['Sugar 1kg', 180, 'Grains'], ['Flour 10kg', 890, 'Grains'],
  ['Milk 1L', 220, 'Dairy'], ['Eggs Dozen', 350, 'Dairy'], ['Butter 200g', 480, 'Dairy'], ['Cheese Block', 690, 'Dairy'],
  ['Chicken Breast 1kg', 780, 'Meat'], ['Beef Mince 1kg', 1290, 'Meat'], ['Fresh Vegetables Pack', 450, 'Produce'], ['Fruit Box', 890, 'Produce'],
]
const r8Products = martProductNames.map(([name, price, category], index) => ({
  id: `p${140 + index}`, restaurantId: 'r8', name, price, cost: Math.round(price * .7), category,
  sku: `FM-${String(index + 1).padStart(3, '0')}`, available: true, stock: 80 + (index * 17) % 120,
  barcode: `890${String(8000000000 + index * 73).slice(0, 9)}0`,
  image: '',
  modifiers: [],
}))

// Retail products (r9)
const retailProductNames = [
  ['Formal Shirt', 3490, 'Shirts'], ['Denim Jeans', 4290, 'Pants'], ['Leather Belt', 1890, 'Accessories'], ['Running Shoes', 7990, 'Shoes'],
  ['Wristwatch', 5490, 'Accessories'], ['Sunglasses', 2990, 'Accessories'], ['Perfume 100ml', 4990, 'Accessories'], ['Wallet', 2490, 'Accessories'],
  ['Backpack', 3990, 'Bags'], ['Polo T-Shirt', 2490, 'Shirts'], ['Chinos', 3290, 'Pants'], ['Sneakers', 6490, 'Shoes'],
]
const r9Products = retailProductNames.map(([name, price, category], index) => ({
  id: `p${160 + index}`, restaurantId: 'r9', name, price, cost: Math.round(price * .45), category,
  sku: `SH-${String(index + 1).padStart(3, '0')}`, available: true, stock: 25 + (index * 6) % 40,
  barcode: `890${String(9000000000 + index * 73).slice(0, 9)}0`,
  image: '',
  modifiers: [],
}))

export const products = [...r1Products, ...r2Products, ...r6Products, ...r7Products, ...r8Products, ...r9Products]

const customerNames = ['Ahmed Raza', 'Fatima Khan', 'Usman Malik', 'Ayesha Noor', 'Hassan Ali', 'Mariam Aslam', 'Daniyal Shah', 'Noor Fatima', 'Ali Hamza', 'Hira Siddiqui', 'Saad Ahmed', 'Zoya Tariq', 'Bilal Iqbal', 'Sana Javed', 'Omer Farooq', 'Mahnoor Riaz', 'Talha Saeed', 'Eman Khalid', 'Zain Abbas', 'Mehak Qureshi']
export const customers = [
  ...customerNames.map((name, index) => ({ id: `cu${index + 1}`, restaurantId: 'r1', name, phone: `03${index % 5}${String(12345678 + index * 735).slice(0, 8)}`, email: `${name.toLowerCase().replace(' ', '.')}@mail.pk`, orders: 2 + index % 13, spent: 4200 + index * 2170, points: 28 + index * 11, lastOrder: `2026-08-${String(15 - index % 12).padStart(2, '0')}`, status: 'Active', address: ['42 Gulberg III', '15 Model Town', '78 Garden Town', '23 DHA Phase 5', '90 Johar Town'][index % 5], area: ['Gulberg', 'Model Town', 'Garden Town', 'DHA', 'Johar Town'][index % 5] })),
  // Bakery customers (r6)
  { id: 'cu30', restaurantId: 'r6', name: 'Rabia Anwar', phone: '0300 1122334', email: 'rabia@mail.pk', orders: 8, spent: 12400, points: 62, lastOrder: '2026-08-18', status: 'Active', address: '12 Liberty Market', area: 'Liberty' },
  { id: 'cu31', restaurantId: 'r6', name: 'Tariq Mehmood', phone: '0321 5566778', email: 'tariq.m@mail.pk', orders: 15, spent: 34500, points: 120, lastOrder: '2026-08-17', status: 'Active', address: '45 Gulberg II', area: 'Gulberg' },
  { id: 'cu32', restaurantId: 'r6', name: 'Amna Shahid', phone: '0333 9900112', email: 'amna.s@mail.pk', orders: 5, spent: 8900, points: 35, lastOrder: '2026-08-15', status: 'Active', address: '67 Johar Town', area: 'Johar Town' },
  { id: 'cu33', restaurantId: 'r6', name: 'Waseem Akram', phone: '0345 3344556', email: 'waseem.a@mail.pk', orders: 3, spent: 4200, points: 18, lastOrder: '2026-08-12', status: 'Active', address: '23 Township', area: 'Township' },
  { id: 'cu34', restaurantId: 'r6', name: 'Kiran Batool', phone: '0312 7788990', email: 'kiran.b@mail.pk', orders: 11, spent: 19800, points: 85, lastOrder: '2026-08-16', status: 'Active', address: '9 Model Town', area: 'Model Town' },
  // Pharmacy customers (r7)
  { id: 'cu40', restaurantId: 'r7', name: 'Col. Rashid Hameed', phone: '0300 2233445', email: 'rashid.h@mail.pk', orders: 22, spent: 45000, points: 180, lastOrder: '2026-08-18', status: 'Active', address: '15 F-6/1', area: 'F-6' },
  { id: 'cu41', restaurantId: 'r7', name: 'Dr. Samina Parveen', phone: '0321 6677889', email: 'samina.p@mail.pk', orders: 18, spent: 38200, points: 145, lastOrder: '2026-08-17', status: 'Active', address: '8 G-9 Markaz', area: 'G-9' },
  { id: 'cu42', restaurantId: 'r7', name: 'Naveed Iqbal', phone: '0333 1100223', email: 'naveed.i@mail.pk', orders: 7, spent: 12500, points: 50, lastOrder: '2026-08-14', status: 'Active', address: '33 Blue Area', area: 'Blue Area' },
  { id: 'cu43', restaurantId: 'r7', name: 'Rubina Kosar', phone: '0345 4455667', email: 'rubina.k@mail.pk', orders: 12, spent: 28900, points: 95, lastOrder: '2026-08-16', status: 'Active', address: '22 F-8/3', area: 'F-8' },
  { id: 'cu44', restaurantId: 'r7', name: 'Asad Mehmood', phone: '0312 8899001', email: 'asad.m@mail.pk', orders: 4, spent: 6700, points: 25, lastOrder: '2026-08-10', status: 'Active', address: '77 G-11', area: 'G-11' },
  // Mart customers (r8)
  { id: 'cu50', restaurantId: 'r8', name: 'Shahid Afridi', phone: '0300 3344556', email: 'shahid.a@mail.pk', orders: 30, spent: 89000, points: 320, lastOrder: '2026-08-19', status: 'Active', address: '55 Clifton Block 5', area: 'Clifton' },
  { id: 'cu51', restaurantId: 'r8', name: 'Nazia Hassan', phone: '0321 7788990', email: 'nazia.h@mail.pk', orders: 25, spent: 67500, points: 240, lastOrder: '2026-08-18', status: 'Active', address: '12 DHA Phase 6', area: 'DHA' },
  { id: 'cu52', restaurantId: 'r8', name: 'Irfan Malik', phone: '0333 2211003', email: 'irfan.m@mail.pk', orders: 15, spent: 42000, points: 150, lastOrder: '2026-08-17', status: 'Active', address: '88 PECHS', area: 'PECHS' },
  { id: 'cu53', restaurantId: 'r8', name: 'Bushra Ansari', phone: '0345 5566778', email: 'bushra.a@mail.pk', orders: 8, spent: 23400, points: 80, lastOrder: '2026-08-15', status: 'Active', address: '34 Gulshan-e-Iqbal', area: 'Gulshan' },
  { id: 'cu54', restaurantId: 'r8', name: 'Faisal Javed', phone: '0312 9900112', email: 'faisal.j@mail.pk', orders: 19, spent: 54200, points: 195, lastOrder: '2026-08-16', status: 'Active', address: '67 North Nazimabad', area: 'North Nazimabad' },
  // Retail customers (r9)
  { id: 'cu60', restaurantId: 'r9', name: 'Amir Sohail', phone: '0300 4455667', email: 'amir.s@mail.pk', orders: 12, spent: 78000, points: 280, lastOrder: '2026-08-18', status: 'Active', address: '10 Fortress Stadium', area: 'Cantt' },
  { id: 'cu61', restaurantId: 'r9', name: 'Sadia Imam', phone: '0321 8899001', email: 'sadia.i@mail.pk', orders: 9, spent: 56000, points: 200, lastOrder: '2026-08-17', status: 'Active', address: '33 Gulberg III', area: 'Gulberg' },
  { id: 'cu62', restaurantId: 'r9', name: 'Mohsin Abbas', phone: '0333 3322114', email: 'mohsin.a@mail.pk', orders: 6, spent: 34500, points: 120, lastOrder: '2026-08-14', status: 'Active', address: '78 DHA Phase 5', area: 'DHA' },
  { id: 'cu63', restaurantId: 'r9', name: 'Farah Deeba', phone: '0345 6677889', email: 'farah.d@mail.pk', orders: 14, spent: 92000, points: 340, lastOrder: '2026-08-19', status: 'Active', address: '5 Model Town', area: 'Model Town' },
  { id: 'cu64', restaurantId: 'r9', name: 'Hamid Mir', phone: '0312 1100223', email: 'hamid.m@mail.pk', orders: 3, spent: 18900, points: 65, lastOrder: '2026-08-11', status: 'Active', address: '90 Johar Town', area: 'Johar Town' },
]

export const employees = [
  ...customerNames.slice(0, 16).map((name, index) => ({ id: `e${index + 1}`, restaurantId: index > 11 ? 'r2' : 'r1', branchId: `b${1 + index % 3}`, name, role: ['Branch Manager', 'Cashier', 'Waiter', 'Kitchen Staff', 'Inventory Manager', 'Delivery Rider'][index % 6], status: index === 14 ? 'On Leave' : 'Active', shift: index % 2 ? 'Evening' : 'Morning', lastActive: index % 3 ? 'Today, 6:42 PM' : 'Yesterday' })),
  // Bakery employees (r6)
  { id: 'e20', restaurantId: 'r6', branchId: 'b9', name: 'Saba Khalid', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:15 AM' },
  { id: 'e21', restaurantId: 'r6', branchId: 'b9', name: 'Faizan Ali', role: 'Cashier', status: 'Active', shift: 'Morning', lastActive: 'Today, 10:30 AM' },
  { id: 'e22', restaurantId: 'r6', branchId: 'b9', name: 'Zubair Khan', role: 'Kitchen Staff', status: 'Active', shift: 'Morning', lastActive: 'Today, 6:00 AM' },
  { id: 'e23', restaurantId: 'r6', branchId: 'b10', name: 'Rizwan Ahmed', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:00 AM' },
  { id: 'e24', restaurantId: 'r6', branchId: 'b9', name: 'Saima Bibi', role: 'Waiter', status: 'Active', shift: 'Evening', lastActive: 'Today, 4:30 PM' },
  { id: 'e25', restaurantId: 'r6', branchId: 'b10', name: 'Danish Rauf', role: 'Delivery Rider', status: 'Active', shift: 'Morning', lastActive: 'Today, 11:00 AM' },
  // Pharmacy employees (r7)
  { id: 'e30', restaurantId: 'r7', branchId: 'b11', name: 'Dr. Sadia Nawaz', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 8:30 AM' },
  { id: 'e31', restaurantId: 'r7', branchId: 'b11', name: 'Hamid Raza', role: 'Cashier', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:45 AM' },
  { id: 'e32', restaurantId: 'r7', branchId: 'b11', name: 'Aisha Tariq', role: 'Inventory Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 10:00 AM' },
  { id: 'e33', restaurantId: 'r7', branchId: 'b12', name: 'Kashif Mehmood', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:00 AM' },
  { id: 'e34', restaurantId: 'r7', branchId: 'b12', name: 'Lubna Shah', role: 'Cashier', status: 'Active', shift: 'Evening', lastActive: 'Today, 5:00 PM' },
  { id: 'e35', restaurantId: 'r7', branchId: 'b11', name: 'Waqar Hussain', role: 'Delivery Rider', status: 'Active', shift: 'Morning', lastActive: 'Today, 11:30 AM' },
  // Mart employees (r8)
  { id: 'e40', restaurantId: 'r8', branchId: 'b13', name: 'Junaid Anwar', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 8:00 AM' },
  { id: 'e41', restaurantId: 'r8', branchId: 'b13', name: 'Uzma Javed', role: 'Cashier', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:30 AM' },
  { id: 'e42', restaurantId: 'r8', branchId: 'b13', name: 'Atif Saeed', role: 'Inventory Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 7:30 AM' },
  { id: 'e43', restaurantId: 'r8', branchId: 'b14', name: 'Noman Aslam', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:00 AM' },
  { id: 'e44', restaurantId: 'r8', branchId: 'b14', name: 'Sana Qadir', role: 'Cashier', status: 'Active', shift: 'Evening', lastActive: 'Today, 5:15 PM' },
  { id: 'e45', restaurantId: 'r8', branchId: 'b13', name: 'Nadeem Asghar', role: 'Delivery Rider', status: 'Active', shift: 'Morning', lastActive: 'Today, 10:45 AM' },
  // Retail employees (r9)
  { id: 'e50', restaurantId: 'r9', branchId: 'b15', name: 'Hammad Raza', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 10:00 AM' },
  { id: 'e51', restaurantId: 'r9', branchId: 'b15', name: 'Nimra Awan', role: 'Cashier', status: 'Active', shift: 'Morning', lastActive: 'Today, 10:15 AM' },
  { id: 'e52', restaurantId: 'r9', branchId: 'b15', name: 'Shoaib Akhtar', role: 'Inventory Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 9:30 AM' },
  { id: 'e53', restaurantId: 'r9', branchId: 'b16', name: 'Fariha Asif', role: 'Branch Manager', status: 'Active', shift: 'Morning', lastActive: 'Today, 10:00 AM' },
  { id: 'e54', restaurantId: 'r9', branchId: 'b16', name: 'Qasim Shah', role: 'Cashier', status: 'Active', shift: 'Evening', lastActive: 'Today, 4:45 PM' },
]

export const inventory = [
  // Restaurant inventory (r1) — ingredient names match recipes
  { id: 'i1', restaurantId: 'r1', name: 'Chicken Breast', sku: 'INV-1001', category: 'Meat', stock: 45, unit: 'kg', minimum: 8, cost: 850, expiry: '3 days' },
  { id: 'i2', restaurantId: 'r1', name: 'Beef Patty', sku: 'INV-1002', category: 'Meat', stock: 32, unit: 'kg', minimum: 8, cost: 1200, expiry: '3 days' },
  { id: 'i3', restaurantId: 'r1', name: 'Cheese', sku: 'INV-1003', category: 'Dairy', stock: 18, unit: 'kg', minimum: 8, cost: 950, expiry: '14 days' },
  { id: 'i4', restaurantId: 'r1', name: 'Pizza Dough', sku: 'INV-1004', category: 'Dry Goods', stock: 25, unit: 'kg', minimum: 8, cost: 180, expiry: '7 days' },
  { id: 'i5', restaurantId: 'r1', name: 'Burger Bun', sku: 'INV-1005', category: 'Dry Goods', stock: 120, unit: 'pcs', minimum: 30, cost: 35, expiry: '5 days' },
  { id: 'i6', restaurantId: 'r1', name: 'Potato', sku: 'INV-1006', category: 'Produce', stock: 40, unit: 'kg', minimum: 10, cost: 90, expiry: '7 days' },
  { id: 'i7', restaurantId: 'r1', name: 'Lettuce', sku: 'INV-1007', category: 'Produce', stock: 12, unit: 'kg', minimum: 5, cost: 120, expiry: '3 days' },
  { id: 'i8', restaurantId: 'r1', name: 'Tomato', sku: 'INV-1008', category: 'Produce', stock: 22, unit: 'kg', minimum: 8, cost: 110, expiry: '5 days' },
  { id: 'i9', restaurantId: 'r1', name: 'Olive Oil', sku: 'INV-1009', category: 'Dry Goods', stock: 15, unit: 'kg', minimum: 4, cost: 680, expiry: '30+ days' },
  { id: 'i10', restaurantId: 'r1', name: 'Yogurt', sku: 'INV-1010', category: 'Dairy', stock: 20, unit: 'kg', minimum: 6, cost: 220, expiry: '7 days' },
  { id: 'i11', restaurantId: 'r1', name: 'Spice Mix', sku: 'INV-1011', category: 'Spices', stock: 8, unit: 'kg', minimum: 3, cost: 1400, expiry: '30+ days' },
  { id: 'i12', restaurantId: 'r1', name: 'Green Chili', sku: 'INV-1012', category: 'Produce', stock: 6, unit: 'kg', minimum: 3, cost: 180, expiry: '5 days' },
  { id: 'i13', restaurantId: 'r1', name: 'Basmati Rice', sku: 'INV-1013', category: 'Dry Goods', stock: 55, unit: 'kg', minimum: 15, cost: 320, expiry: '30+ days' },
  { id: 'i14', restaurantId: 'r1', name: 'Onion', sku: 'INV-1014', category: 'Produce', stock: 30, unit: 'kg', minimum: 10, cost: 85, expiry: '10 days' },
  { id: 'i15', restaurantId: 'r1', name: 'Cream', sku: 'INV-1015', category: 'Dairy', stock: 14, unit: 'kg', minimum: 5, cost: 850, expiry: '7 days' },
  { id: 'i16', restaurantId: 'r1', name: 'Biscuit Base', sku: 'INV-1016', category: 'Dry Goods', stock: 10, unit: 'kg', minimum: 4, cost: 420, expiry: '14 days' },
  { id: 'i17', restaurantId: 'r1', name: 'Cooking Oil', sku: 'INV-1017', category: 'Dry Goods', stock: 35, unit: 'kg', minimum: 10, cost: 380, expiry: '30+ days' },
  { id: 'i18', restaurantId: 'r1', name: 'Garlic', sku: 'INV-1018', category: 'Produce', stock: 8, unit: 'kg', minimum: 3, cost: 350, expiry: '14 days' },
  { id: 'i19', restaurantId: 'r1', name: 'Ginger', sku: 'INV-1019', category: 'Produce', stock: 7, unit: 'kg', minimum: 3, cost: 420, expiry: '14 days' },
  { id: 'i20', restaurantId: 'r1', name: 'Mutton', sku: 'INV-1020', category: 'Meat', stock: 28, unit: 'kg', minimum: 8, cost: 1800, expiry: '3 days' },
  { id: 'i21', restaurantId: 'r1', name: 'Prawns', sku: 'INV-1021', category: 'Meat', stock: 12, unit: 'kg', minimum: 4, cost: 2200, expiry: '2 days' },
  { id: 'i22', restaurantId: 'r1', name: 'Soft Drink Syrup', sku: 'INV-1022', category: 'Beverages', stock: 20, unit: 'L', minimum: 5, cost: 450, expiry: '30+ days' },
  // Daig House inventory (r2)
  { id: 'i50', restaurantId: 'r2', name: 'Beef (Nihari cut)', sku: 'DH-INV-001', category: 'Meat', stock: 35, unit: 'kg', minimum: 10, cost: 1400, expiry: '3 days' },
  { id: 'i51', restaurantId: 'r2', name: 'Mutton', sku: 'DH-INV-002', category: 'Meat', stock: 28, unit: 'kg', minimum: 8, cost: 1800, expiry: '3 days' },
  { id: 'i52', restaurantId: 'r2', name: 'Chicken', sku: 'DH-INV-003', category: 'Meat', stock: 40, unit: 'kg', minimum: 10, cost: 780, expiry: '3 days' },
  { id: 'i53', restaurantId: 'r2', name: 'Basmati Rice', sku: 'DH-INV-004', category: 'Dry Goods', stock: 60, unit: 'kg', minimum: 15, cost: 320, expiry: '30+ days' },
  { id: 'i54', restaurantId: 'r2', name: 'Wheat Flour', sku: 'DH-INV-005', category: 'Dry Goods', stock: 45, unit: 'kg', minimum: 12, cost: 95, expiry: '30+ days' },
  { id: 'i55', restaurantId: 'r2', name: 'Yogurt', sku: 'DH-INV-006', category: 'Dairy', stock: 25, unit: 'kg', minimum: 8, cost: 220, expiry: '7 days' },
  { id: 'i56', restaurantId: 'r2', name: 'Spice Mix', sku: 'DH-INV-007', category: 'Spices', stock: 10, unit: 'kg', minimum: 3, cost: 1200, expiry: '30+ days' },
  { id: 'i57', restaurantId: 'r2', name: 'Onion', sku: 'DH-INV-008', category: 'Produce', stock: 35, unit: 'kg', minimum: 10, cost: 85, expiry: '10 days' },
  { id: 'i58', restaurantId: 'r2', name: 'Tomato', sku: 'DH-INV-009', category: 'Produce', stock: 28, unit: 'kg', minimum: 8, cost: 110, expiry: '5 days' },
  { id: 'i59', restaurantId: 'r2', name: 'Cooking Oil', sku: 'DH-INV-010', category: 'Dry Goods', stock: 30, unit: 'kg', minimum: 8, cost: 380, expiry: '30+ days' },
  { id: 'i60', restaurantId: 'r2', name: 'Lentils (Daal)', sku: 'DH-INV-011', category: 'Dry Goods', stock: 40, unit: 'kg', minimum: 10, cost: 280, expiry: '30+ days' },
  { id: 'i61', restaurantId: 'r2', name: 'Naan Dough Mix', sku: 'DH-INV-012', category: 'Dry Goods', stock: 50, unit: 'kg', minimum: 12, cost: 120, expiry: '14 days' },
  // Bakery inventory (r6)
  { id: 'i100', restaurantId: 'r6', name: 'Flour', sku: 'GC-INV-001', category: 'Dry Goods', stock: 120, unit: 'kg', minimum: 30, cost: 120, expiry: '30+ days' },
  { id: 'i101', restaurantId: 'r6', name: 'Butter', sku: 'GC-INV-002', category: 'Dairy', stock: 45, unit: 'kg', minimum: 10, cost: 1800, expiry: '14 days' },
  { id: 'i102', restaurantId: 'r6', name: 'Yeast', sku: 'GC-INV-003', category: 'Dry Goods', stock: 8, unit: 'kg', minimum: 3, cost: 950, expiry: '7 days' },
  { id: 'i103', restaurantId: 'r6', name: 'Sugar', sku: 'GC-INV-004', category: 'Dry Goods', stock: 80, unit: 'kg', minimum: 20, cost: 140, expiry: '30+ days' },
  { id: 'i104', restaurantId: 'r6', name: 'Eggs', sku: 'GC-INV-005', category: 'Dairy', stock: 200, unit: 'pcs', minimum: 60, cost: 28, expiry: '14 days' },
  { id: 'i105', restaurantId: 'r6', name: 'Chocolate', sku: 'GC-INV-006', category: 'Dry Goods', stock: 25, unit: 'kg', minimum: 8, cost: 2200, expiry: '30+ days' },
  { id: 'i106', restaurantId: 'r6', name: 'Cream', sku: 'GC-INV-007', category: 'Dairy', stock: 30, unit: 'kg', minimum: 10, cost: 850, expiry: '7 days' },
  { id: 'i107', restaurantId: 'r6', name: 'Vanilla Extract', sku: 'GC-INV-008', category: 'Dry Goods', stock: 5, unit: 'kg', minimum: 2, cost: 4500, expiry: '30+ days' },
  { id: 'i108', restaurantId: 'r6', name: 'Baking Powder', sku: 'GC-INV-009', category: 'Dry Goods', stock: 12, unit: 'kg', minimum: 4, cost: 650, expiry: '30+ days' },
  { id: 'i109', restaurantId: 'r6', name: 'Fondant', sku: 'GC-INV-010', category: 'Dry Goods', stock: 15, unit: 'kg', minimum: 5, cost: 1800, expiry: '30+ days' },
  // Pharmacy inventory (r7)
  { id: 'i120', restaurantId: 'r7', name: 'Paracetamol Bulk', sku: 'MC-INV-001', category: 'Pain Relief', stock: 500, unit: 'pcs', minimum: 100, cost: 8, expiry: '30+ days' },
  { id: 'i121', restaurantId: 'r7', name: 'Ibuprofen Bulk', sku: 'MC-INV-002', category: 'Pain Relief', stock: 350, unit: 'pcs', minimum: 80, cost: 12, expiry: '30+ days' },
  { id: 'i122', restaurantId: 'r7', name: 'Antibiotic Stock', sku: 'MC-INV-003', category: 'Antibiotics', stock: 200, unit: 'pcs', minimum: 50, cost: 45, expiry: '30+ days' },
  { id: 'i123', restaurantId: 'r7', name: 'Vitamin Stock', sku: 'MC-INV-004', category: 'Vitamins', stock: 300, unit: 'pcs', minimum: 60, cost: 35, expiry: '30+ days' },
  { id: 'i124', restaurantId: 'r7', name: 'Surgical Masks', sku: 'MC-INV-005', category: 'First Aid', stock: 1000, unit: 'pcs', minimum: 200, cost: 5, expiry: '30+ days' },
  { id: 'i125', restaurantId: 'r7', name: 'Gloves', sku: 'MC-INV-006', category: 'First Aid', stock: 800, unit: 'pcs', minimum: 150, cost: 8, expiry: '30+ days' },
  { id: 'i126', restaurantId: 'r7', name: 'Syringes', sku: 'MC-INV-007', category: 'Devices', stock: 400, unit: 'pcs', minimum: 100, cost: 15, expiry: '30+ days' },
  { id: 'i127', restaurantId: 'r7', name: 'Bandages', sku: 'MC-INV-008', category: 'First Aid', stock: 250, unit: 'pcs', minimum: 50, cost: 25, expiry: '30+ days' },
  { id: 'i128', restaurantId: 'r7', name: 'Cotton', sku: 'MC-INV-009', category: 'First Aid', stock: 150, unit: 'pcs', minimum: 30, cost: 18, expiry: '30+ days' },
  { id: 'i129', restaurantId: 'r7', name: 'Sanitizer', sku: 'MC-INV-010', category: 'First Aid', stock: 180, unit: 'pcs', minimum: 40, cost: 120, expiry: '30+ days' },
  // Mart inventory (r8)
  { id: 'i140', restaurantId: 'r8', name: 'Rice Stock', sku: 'FM-INV-001', category: 'Grains', stock: 500, unit: 'kg', minimum: 100, cost: 250, expiry: '30+ days' },
  { id: 'i141', restaurantId: 'r8', name: 'Oil Stock', sku: 'FM-INV-002', category: 'Grains', stock: 300, unit: 'kg', minimum: 60, cost: 480, expiry: '30+ days' },
  { id: 'i142', restaurantId: 'r8', name: 'Sugar Stock', sku: 'FM-INV-003', category: 'Grains', stock: 400, unit: 'kg', minimum: 80, cost: 140, expiry: '30+ days' },
  { id: 'i143', restaurantId: 'r8', name: 'Flour Stock', sku: 'FM-INV-004', category: 'Grains', stock: 350, unit: 'kg', minimum: 70, cost: 80, expiry: '30+ days' },
  { id: 'i144', restaurantId: 'r8', name: 'Dairy Stock', sku: 'FM-INV-005', category: 'Dairy', stock: 200, unit: 'pcs', minimum: 50, cost: 190, expiry: '7 days' },
  { id: 'i145', restaurantId: 'r8', name: 'Meat Stock', sku: 'FM-INV-006', category: 'Meat', stock: 150, unit: 'kg', minimum: 30, cost: 850, expiry: '3 days' },
  { id: 'i146', restaurantId: 'r8', name: 'Produce Stock', sku: 'FM-INV-007', category: 'Produce', stock: 250, unit: 'kg', minimum: 50, cost: 120, expiry: '5 days' },
  { id: 'i147', restaurantId: 'r8', name: 'Frozen Stock', sku: 'FM-INV-008', category: 'Meat', stock: 180, unit: 'kg', minimum: 40, cost: 650, expiry: '30+ days' },
  { id: 'i148', restaurantId: 'r8', name: 'Beverages Stock', sku: 'FM-INV-009', category: 'Cold Drinks', stock: 600, unit: 'pcs', minimum: 120, cost: 80, expiry: '30+ days' },
  { id: 'i149', restaurantId: 'r8', name: 'Snacks Stock', sku: 'FM-INV-010', category: 'Snacks', stock: 450, unit: 'pcs', minimum: 90, cost: 55, expiry: '30+ days' },
  // Retail inventory (r9)
  { id: 'i160', restaurantId: 'r9', name: 'Shirts Stock', sku: 'SH-INV-001', category: 'Shirts', stock: 120, unit: 'pcs', minimum: 25, cost: 1500, expiry: 'N/A' },
  { id: 'i161', restaurantId: 'r9', name: 'Pants Stock', sku: 'SH-INV-002', category: 'Pants', stock: 90, unit: 'pcs', minimum: 20, cost: 1800, expiry: 'N/A' },
  { id: 'i162', restaurantId: 'r9', name: 'Shoes Stock', sku: 'SH-INV-003', category: 'Shoes', stock: 60, unit: 'pcs', minimum: 15, cost: 3200, expiry: 'N/A' },
  { id: 'i163', restaurantId: 'r9', name: 'Accessories Stock', sku: 'SH-INV-004', category: 'Accessories', stock: 150, unit: 'pcs', minimum: 30, cost: 800, expiry: 'N/A' },
  { id: 'i164', restaurantId: 'r9', name: 'Bags Stock', sku: 'SH-INV-005', category: 'Bags', stock: 45, unit: 'pcs', minimum: 10, cost: 1600, expiry: 'N/A' },
  { id: 'i165', restaurantId: 'r9', name: 'Watches Stock', sku: 'SH-INV-006', category: 'Accessories', stock: 35, unit: 'pcs', minimum: 8, cost: 2200, expiry: 'N/A' },
  { id: 'i166', restaurantId: 'r9', name: 'Perfumes Stock', sku: 'SH-INV-007', category: 'Accessories', stock: 55, unit: 'pcs', minimum: 12, cost: 2000, expiry: '30+ days' },
  { id: 'i167', restaurantId: 'r9', name: 'Belts Stock', sku: 'SH-INV-008', category: 'Accessories', stock: 70, unit: 'pcs', minimum: 15, cost: 750, expiry: 'N/A' },
  { id: 'i168', restaurantId: 'r9', name: 'Sunglasses Stock', sku: 'SH-INV-009', category: 'Accessories', stock: 40, unit: 'pcs', minimum: 10, cost: 1200, expiry: 'N/A' },
  { id: 'i169', restaurantId: 'r9', name: 'Wallets Stock', sku: 'SH-INV-010', category: 'Accessories', stock: 50, unit: 'pcs', minimum: 12, cost: 950, expiry: 'N/A' },
]

export const tables = [
  ...Array.from({ length: 18 }, (_, index) => ({ id: `t${index + 1}`, restaurantId: 'r1', branchId: 'b1', name: `T${String(index + 1).padStart(2, '0')}`, seats: [2, 4, 4, 6][index % 4], section: index > 13 ? 'VIP' : index > 7 ? 'Terrace' : 'Main Hall', status: ['Available', 'Occupied', 'Available', 'Reserved', 'Cleaning', 'Payment Pending'][index % 6] })),
  // Bakery tables (r6) - dine-in
  ...Array.from({ length: 10 }, (_, index) => ({ id: `t${20 + index}`, restaurantId: 'r6', branchId: 'b9', name: `B${String(index + 1).padStart(2, '0')}`, seats: [2, 2, 4, 4][index % 4], section: index > 6 ? 'Window' : 'Indoor', status: ['Available', 'Occupied', 'Available', 'Reserved'][index % 4] })),
]

const orderStatuses = ['New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Completed', 'Completed']
export const orders = [
  ...Array.from({ length: 34 }, (_, index) => {
    const item = products[index % products.length]
    const total = item.price * (1 + index % 3)
    return { id: `o${1001 + index}`, number: `#${1001 + index}`, restaurantId: 'r1', branchId: `b${1 + index % 3}`, customerId: `cu${1 + index % 20}`, customer: customerNames[index % 20], type: ['Dine-in', 'Takeaway', 'Delivery', 'Online'][index % 4], status: orderStatuses[index % orderStatuses.length], payment: ['Cash', 'Card', 'Raast', 'JazzCash'][index % 4], total, tax: Math.round(total * .16), discount: index % 5 === 0 ? 150 : 0, createdAt: `2026-08-${String(16 - index % 10).padStart(2, '0')} ${String(12 + index % 9).padStart(2, '0')}:20`, items: [{ ...item, quantity: 1 + index % 3, modifiers: [] }] }
  }),
  // Bakery orders (r6)
  { id: 'o2001', number: '#2001', restaurantId: 'r6', branchId: 'b9', customerId: 'cu30', customer: 'Rabia Anwar', type: 'Dine-in', status: 'Completed', payment: 'Cash', total: 860, tax: 138, discount: 0, createdAt: '2026-08-18 09:15', items: [{ ...r6Products[0], quantity: 2, modifiers: [] }, { ...r6Products[7], quantity: 1, modifiers: [] }] },
  { id: 'o2002', number: '#2002', restaurantId: 'r6', branchId: 'b9', customerId: 'cu31', customer: 'Tariq Mehmood', type: 'Takeaway', status: 'Completed', payment: 'Card', total: 2480, tax: 397, discount: 0, createdAt: '2026-08-18 10:30', items: [{ ...r6Products[2], quantity: 1, modifiers: [] }, { ...r6Products[11], quantity: 1, modifiers: [] }] },
  { id: 'o2003', number: '#2003', restaurantId: 'r6', branchId: 'b10', customerId: 'cu32', customer: 'Amna Shahid', type: 'Delivery', status: 'Out for Delivery', payment: 'JazzCash', total: 1570, tax: 251, discount: 0, createdAt: '2026-08-19 11:00', items: [{ ...r6Products[10], quantity: 1, modifiers: [] }, { ...r6Products[0], quantity: 1, modifiers: [] }] },
  { id: 'o2004', number: '#2004', restaurantId: 'r6', branchId: 'b9', customerId: 'cu33', customer: 'Waseem Akram', type: 'Dine-in', status: 'Preparing', payment: 'Cash', total: 640, tax: 102, discount: 0, createdAt: '2026-08-19 12:20', items: [{ ...r6Products[4], quantity: 2, modifiers: [] }] },
  { id: 'o2005', number: '#2005', restaurantId: 'r6', branchId: 'b9', customerId: 'cu34', customer: 'Kiran Batool', type: 'Online', status: 'New', payment: 'Card', total: 3180, tax: 509, discount: 200, createdAt: '2026-08-19 13:45', items: [{ ...r6Products[2], quantity: 1, modifiers: [] }, { ...r6Products[10], quantity: 1, modifiers: [] }] },
  // Pharmacy orders (r7)
  { id: 'o3001', number: '#3001', restaurantId: 'r7', branchId: 'b11', customerId: 'cu40', customer: 'Col. Rashid Hameed', type: 'Takeaway', status: 'Completed', payment: 'Card', total: 1250, tax: 0, discount: 0, createdAt: '2026-08-18 08:30', items: [{ ...r7Products[0], quantity: 2, modifiers: [] }, { ...r7Products[1], quantity: 1, modifiers: [] }] },
  { id: 'o3002', number: '#3002', restaurantId: 'r7', branchId: 'b11', customerId: 'cu41', customer: 'Dr. Samina Parveen', type: 'Takeaway', status: 'Completed', payment: 'Cash', total: 5700, tax: 0, discount: 0, createdAt: '2026-08-18 10:15', items: [{ ...r7Products[9], quantity: 1, modifiers: [] }, { ...r7Products[10], quantity: 1, modifiers: [] }] },
  { id: 'o3003', number: '#3003', restaurantId: 'r7', branchId: 'b12', customerId: 'cu42', customer: 'Naveed Iqbal', type: 'Delivery', status: 'Out for Delivery', payment: 'JazzCash', total: 870, tax: 0, discount: 0, createdAt: '2026-08-19 09:00', items: [{ ...r7Products[7], quantity: 1, modifiers: [] }, { ...r7Products[8], quantity: 1, modifiers: [] }] },
  { id: 'o3004', number: '#3004', restaurantId: 'r7', branchId: 'b11', customerId: 'cu43', customer: 'Rubina Kosar', type: 'Takeaway', status: 'Ready', payment: 'Cash', total: 350, tax: 0, discount: 0, createdAt: '2026-08-19 11:30', items: [{ ...r7Products[6], quantity: 1, modifiers: [] }] },
  { id: 'o3005', number: '#3005', restaurantId: 'r7', branchId: 'b12', customerId: 'cu44', customer: 'Asad Mehmood', type: 'Online', status: 'Confirmed', payment: 'Card', total: 2680, tax: 0, discount: 0, createdAt: '2026-08-19 12:45', items: [{ ...r7Products[11], quantity: 1, modifiers: [] }, { ...r7Products[0], quantity: 1, modifiers: [] }] },
  // Mart orders (r8)
  { id: 'o4001', number: '#4001', restaurantId: 'r8', branchId: 'b13', customerId: 'cu50', customer: 'Shahid Afridi', type: 'Takeaway', status: 'Completed', payment: 'Card', total: 4890, tax: 782, discount: 0, createdAt: '2026-08-18 09:00', items: [{ ...r8Products[0], quantity: 2, modifiers: [] }, { ...r8Products[1], quantity: 1, modifiers: [] }] },
  { id: 'o4002', number: '#4002', restaurantId: 'r8', branchId: 'b13', customerId: 'cu51', customer: 'Nazia Hassan', type: 'Delivery', status: 'Completed', payment: 'JazzCash', total: 2340, tax: 374, discount: 0, createdAt: '2026-08-18 11:30', items: [{ ...r8Products[4], quantity: 3, modifiers: [] }, { ...r8Products[5], quantity: 2, modifiers: [] }, { ...r8Products[6], quantity: 1, modifiers: [] }] },
  { id: 'o4003', number: '#4003', restaurantId: 'r8', branchId: 'b14', customerId: 'cu52', customer: 'Irfan Malik', type: 'Takeaway', status: 'Ready', payment: 'Cash', total: 3620, tax: 579, discount: 0, createdAt: '2026-08-19 08:15', items: [{ ...r8Products[8], quantity: 2, modifiers: [] }, { ...r8Products[10], quantity: 2, modifiers: [] }, { ...r8Products[3], quantity: 1, modifiers: [] }] },
  { id: 'o4004', number: '#4004', restaurantId: 'r8', branchId: 'b13', customerId: 'cu53', customer: 'Bushra Ansari', type: 'Online', status: 'Preparing', payment: 'Card', total: 5180, tax: 829, discount: 300, createdAt: '2026-08-19 10:45', items: [{ ...r8Products[0], quantity: 1, modifiers: [] }, { ...r8Products[1], quantity: 1, modifiers: [] }, { ...r8Products[9], quantity: 1, modifiers: [] }] },
  { id: 'o4005', number: '#4005', restaurantId: 'r8', branchId: 'b14', customerId: 'cu54', customer: 'Faisal Javed', type: 'Delivery', status: 'Out for Delivery', payment: 'Raast', total: 1780, tax: 285, discount: 0, createdAt: '2026-08-19 12:00', items: [{ ...r8Products[11], quantity: 2, modifiers: [] }] },
  // Retail orders (r9)
  { id: 'o5001', number: '#5001', restaurantId: 'r9', branchId: 'b15', customerId: 'cu60', customer: 'Amir Sohail', type: 'Takeaway', status: 'Completed', payment: 'Card', total: 11780, tax: 1885, discount: 500, createdAt: '2026-08-17 11:30', items: [{ ...r9Products[0], quantity: 1, modifiers: [] }, { ...r9Products[3], quantity: 1, modifiers: [] }] },
  { id: 'o5002', number: '#5002', restaurantId: 'r9', branchId: 'b15', customerId: 'cu61', customer: 'Sadia Imam', type: 'Takeaway', status: 'Completed', payment: 'Cash', total: 7480, tax: 1197, discount: 0, createdAt: '2026-08-18 14:00', items: [{ ...r9Products[6], quantity: 1, modifiers: [] }, { ...r9Products[7], quantity: 1, modifiers: [] }] },
  { id: 'o5003', number: '#5003', restaurantId: 'r9', branchId: 'b16', customerId: 'cu62', customer: 'Mohsin Abbas', type: 'Online', status: 'Confirmed', payment: 'Card', total: 9780, tax: 1565, discount: 0, createdAt: '2026-08-19 10:15', items: [{ ...r9Products[1], quantity: 1, modifiers: [] }, { ...r9Products[4], quantity: 1, modifiers: [] }] },
  { id: 'o5004', number: '#5004', restaurantId: 'r9', branchId: 'b15', customerId: 'cu63', customer: 'Farah Deeba', type: 'Takeaway', status: 'Ready', payment: 'Raast', total: 13470, tax: 2155, discount: 1000, createdAt: '2026-08-19 12:30', items: [{ ...r9Products[3], quantity: 1, modifiers: [] }, { ...r9Products[10], quantity: 1, modifiers: [] }, { ...r9Products[9], quantity: 1, modifiers: [] }] },
  { id: 'o5005', number: '#5005', restaurantId: 'r9', branchId: 'b16', customerId: 'cu64', customer: 'Hamid Mir', type: 'Online', status: 'New', payment: 'Card', total: 6480, tax: 1037, discount: 0, createdAt: '2026-08-19 13:15', items: [{ ...r9Products[11], quantity: 1, modifiers: [] }] },
]

export const notifications = Array.from({ length: 22 }, (_, index) => ({ id: `n${index + 1}`, restaurantId: index % 3 === 0 ? 'r1' : index % 3 === 1 ? 'r6' : 'r2', title: ['Low stock alert', 'New online order', 'Payment received', 'Shift reminder', 'Large discount applied', 'Subscription update'][index % 6], message: [`Chicken Breast is below minimum level`, `Order #${1034 + index} needs confirmation`, `PKR ${(1250 + index * 215).toLocaleString()} received via ${index % 2 ? 'Card' : 'Raast'}`, 'Evening shift has not been closed', `Discount approved by branch manager`, 'Professional plan expires in 12 days'][index % 6], time: `${index + 2} min ago`, read: index > 5, type: ['warning', 'order', 'success', 'warning', 'info', 'info'][index % 6], source: index % 6 === 0 ? 'inventory' : 'system', priority: index % 6 === 0 && index < 3 ? 'critical' : 'normal', createdAt: new Date(Date.now() - (index + 2) * 60000).toISOString() }))

export const offers = [
  { id: 'of1', restaurantId: 'r1', type: 'deal', title: 'Family Feast Box', description: '2 Burgers + 1 Pizza + 4 Drinks + Loaded Fries', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=70', originalPrice: 4340, dealPrice: 2990, prepMinutes: 45, items: ['p1', 'p2', 'p5', 'p22', 'p35', 'p35', 'p35', 'p35'], badge: 'Best Value', active: true, validFrom: '2026-08-01', validUntil: '2026-09-30' },
  { id: 'of2', restaurantId: 'r1', type: 'deal', title: 'BBQ Night Platter', description: 'Chicken Tikka + Malai Boti + Seekh Kebab + 2 Naan + Raita', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=70', originalPrice: 2510, dealPrice: 1790, prepMinutes: 35, items: ['p9', 'p10', 'p11'], badge: 'Popular', active: true, validFrom: '2026-08-01', validUntil: '2026-09-30' },
  { id: 'of3', restaurantId: 'r1', type: 'discount', title: '20% Off All Pizzas', description: 'Get 20% off on any pizza from our menu. Limited time offer!', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=70', discountType: 'percentage', discountValue: 20, category: 'Pizza', badge: 'Limited', active: true, validFrom: '2026-08-10', validUntil: '2026-08-31' },
  { id: 'of4', restaurantId: 'r1', type: 'discount', title: 'Free Delivery Friday', description: 'Order above PKR 1,500 and get free delivery every Friday', image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=500&q=70', discountType: 'freeDelivery', minOrder: 1500, badge: 'Fridays', active: true, validFrom: '2026-08-01', validUntil: '2026-12-31' },
  { id: 'of5', restaurantId: 'r1', type: 'deal', title: 'Lunch Special', description: 'Any Burger + Fries + Soft Drink', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=70', originalPrice: 1760, dealPrice: 1190, prepMinutes: 20, items: ['p1', 'p22', 'p35'], badge: 'Lunch', active: false, validFrom: '2026-07-01', validUntil: '2026-08-15' },
  { id: 'of6', restaurantId: 'r2', type: 'deal', title: 'Daig Special Combo', description: 'Beef Nihari + Lamb Biryani + Naan + Raita', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=500&q=70', originalPrice: 1810, dealPrice: 1290, prepMinutes: 35, items: ['p50', 'p54', 'p61', 'p60'], badge: 'Chef Pick', active: true, validFrom: '2026-08-01', validUntil: '2026-09-30' },
]

export const users = [
  { id: 'u1', restaurantId: 'r1', name: 'Hamza Qureshi', email: 'owner@saltandember.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u2', restaurantId: 'r1', name: 'Ali Raza', email: 'manager@saltandember.pk', password: 'orbit123', role: 'Branch Manager' },
  { id: 'u3', restaurantId: 'r1', name: 'Fatima Khan', email: 'cashier@saltandember.pk', password: 'orbit123', role: 'Cashier' },
  { id: 'u4', restaurantId: 'r1', name: 'Usman Malik', email: 'kitchen@saltandember.pk', password: 'orbit123', role: 'Kitchen Staff' },
  { id: 'u4w', restaurantId: 'r1', name: 'Daniyal Shah', email: 'waiter@saltandember.pk', password: 'orbit123', role: 'Waiter' },
  { id: 'u4r', restaurantId: 'r1', name: 'Imran Ali', email: 'rider@saltandember.pk', password: 'orbit123', role: 'Delivery Rider' },
  { id: 'u5', restaurantId: 'r2', name: 'Areeba Malik', email: 'owner@daighouse.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u6', restaurantId: 'r3', name: 'Saad Ali', email: 'owner@urbantandoor.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u7', restaurantId: 'r4', name: 'Maham Raza', email: 'owner@basilbun.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u8', restaurantId: 'r5', name: 'Bilal Khan', email: 'owner@khybercourt.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u0', restaurantId: null, name: 'Platform Owner', email: 'owner@orbitpos.pk', password: 'orbit123', role: 'Super Admin' },
  // Bakery users (r6)
  { id: 'u10', restaurantId: 'r6', name: 'Nadia Farooq', email: 'owner@goldencrust.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u11', restaurantId: 'r6', name: 'Saba Khalid', email: 'manager@goldencrust.pk', password: 'orbit123', role: 'Branch Manager' },
  { id: 'u12', restaurantId: 'r6', name: 'Faizan Ali', email: 'cashier@goldencrust.pk', password: 'orbit123', role: 'Cashier' },
  { id: 'u13', restaurantId: 'r6', name: 'Saima Bibi', email: 'waiter@goldencrust.pk', password: 'orbit123', role: 'Waiter' },
  { id: 'u14', restaurantId: 'r6', name: 'Danish Rauf', email: 'rider@goldencrust.pk', password: 'orbit123', role: 'Delivery Rider' },
  // Pharmacy users (r7)
  { id: 'u20', restaurantId: 'r7', name: 'Dr. Asim Rauf', email: 'owner@medicare.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u21', restaurantId: 'r7', name: 'Dr. Sadia Nawaz', email: 'manager@medicare.pk', password: 'orbit123', role: 'Branch Manager' },
  { id: 'u22', restaurantId: 'r7', name: 'Hamid Raza', email: 'cashier@medicare.pk', password: 'orbit123', role: 'Cashier' },
  { id: 'u23', restaurantId: 'r7', name: 'Waqar Hussain', email: 'rider@medicare.pk', password: 'orbit123', role: 'Delivery Rider' },
  // Mart users (r8)
  { id: 'u30', restaurantId: 'r8', name: 'Kamran Javed', email: 'owner@freshmart.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u31', restaurantId: 'r8', name: 'Junaid Anwar', email: 'manager@freshmart.pk', password: 'orbit123', role: 'Branch Manager' },
  { id: 'u32', restaurantId: 'r8', name: 'Uzma Javed', email: 'cashier@freshmart.pk', password: 'orbit123', role: 'Cashier' },
  { id: 'u33', restaurantId: 'r8', name: 'Nadeem Asghar', email: 'rider@freshmart.pk', password: 'orbit123', role: 'Delivery Rider' },
  // Retail users (r9)
  { id: 'u40', restaurantId: 'r9', name: 'Ayesha Amin', email: 'owner@stylehub.pk', password: 'orbit123', role: 'Restaurant Owner' },
  { id: 'u41', restaurantId: 'r9', name: 'Hammad Raza', email: 'manager@stylehub.pk', password: 'orbit123', role: 'Branch Manager' },
  { id: 'u42', restaurantId: 'r9', name: 'Nimra Awan', email: 'cashier@stylehub.pk', password: 'orbit123', role: 'Cashier' },
]

export const recipes = [
  // Restaurant recipes (r1)
  { id: 'rec1', restaurantId: 'r1', productId: 'p1', name: 'Smoky Chicken Burger', ingredients: [
    { inventoryId: 'i1', name: 'Chicken Breast', quantity: 0.2, unit: 'kg' },
    { inventoryId: 'i3', name: 'Cheese', quantity: 0.05, unit: 'kg' },
    { inventoryId: 'i5', name: 'Burger Bun', quantity: 1, unit: 'pcs' },
    { inventoryId: 'i7', name: 'Lettuce', quantity: 0.03, unit: 'kg' },
  ]},
  { id: 'rec2', restaurantId: 'r1', productId: 'p2', name: 'Firehouse Beef Burger', ingredients: [
    { inventoryId: 'i2', name: 'Beef Patty', quantity: 0.25, unit: 'kg' },
    { inventoryId: 'i3', name: 'Cheese', quantity: 0.06, unit: 'kg' },
    { inventoryId: 'i5', name: 'Burger Bun', quantity: 1, unit: 'pcs' },
    { inventoryId: 'i8', name: 'Tomato', quantity: 0.04, unit: 'kg' },
  ]},
  { id: 'rec3', restaurantId: 'r1', productId: 'p5', name: 'Margherita Pizza', ingredients: [
    { inventoryId: 'i4', name: 'Pizza Dough', quantity: 0.3, unit: 'kg' },
    { inventoryId: 'i3', name: 'Cheese', quantity: 0.15, unit: 'kg' },
    { inventoryId: 'i8', name: 'Tomato', quantity: 0.1, unit: 'kg' },
    { inventoryId: 'i9', name: 'Olive Oil', quantity: 0.02, unit: 'kg' },
  ]},
  { id: 'rec4', restaurantId: 'r1', productId: 'p9', name: 'Chicken Tikka', ingredients: [
    { inventoryId: 'i1', name: 'Chicken Breast', quantity: 0.3, unit: 'kg' },
    { inventoryId: 'i10', name: 'Yogurt', quantity: 0.05, unit: 'kg' },
    { inventoryId: 'i11', name: 'Spice Mix', quantity: 0.02, unit: 'kg' },
  ]},
  { id: 'rec5', restaurantId: 'r1', productId: 'p13', name: 'Chicken Karahi', ingredients: [
    { inventoryId: 'i1', name: 'Chicken Breast', quantity: 0.5, unit: 'kg' },
    { inventoryId: 'i8', name: 'Tomato', quantity: 0.2, unit: 'kg' },
    { inventoryId: 'i11', name: 'Spice Mix', quantity: 0.03, unit: 'kg' },
    { inventoryId: 'i12', name: 'Green Chili', quantity: 0.05, unit: 'kg' },
  ]},
  { id: 'rec6', restaurantId: 'r1', productId: 'p17', name: 'Chicken Biryani', ingredients: [
    { inventoryId: 'i1', name: 'Chicken Breast', quantity: 0.35, unit: 'kg' },
    { inventoryId: 'i13', name: 'Basmati Rice', quantity: 0.3, unit: 'kg' },
    { inventoryId: 'i11', name: 'Spice Mix', quantity: 0.04, unit: 'kg' },
    { inventoryId: 'i14', name: 'Onion', quantity: 0.1, unit: 'kg' },
  ]},
  { id: 'rec7', restaurantId: 'r1', productId: 'p25', name: 'Lotus Cheesecake', ingredients: [
    { inventoryId: 'i3', name: 'Cheese', quantity: 0.2, unit: 'kg' },
    { inventoryId: 'i15', name: 'Cream', quantity: 0.1, unit: 'kg' },
    { inventoryId: 'i16', name: 'Biscuit Base', quantity: 0.08, unit: 'kg' },
  ]},
  // Bakery recipes (r6)
  { id: 'rec10', restaurantId: 'r6', productId: 'p100', name: 'Croissant', ingredients: [
    { inventoryId: 'i100', name: 'Flour', quantity: 0.15, unit: 'kg' },
    { inventoryId: 'i101', name: 'Butter', quantity: 0.1, unit: 'kg' },
    { inventoryId: 'i102', name: 'Yeast', quantity: 0.01, unit: 'kg' },
    { inventoryId: 'i103', name: 'Sugar', quantity: 0.02, unit: 'kg' },
  ]},
  { id: 'rec11', restaurantId: 'r6', productId: 'p101', name: 'Sourdough Bread', ingredients: [
    { inventoryId: 'i100', name: 'Flour', quantity: 0.4, unit: 'kg' },
    { inventoryId: 'i102', name: 'Yeast', quantity: 0.02, unit: 'kg' },
  ]},
  { id: 'rec12', restaurantId: 'r6', productId: 'p102', name: 'Chocolate Cake', ingredients: [
    { inventoryId: 'i100', name: 'Flour', quantity: 0.25, unit: 'kg' },
    { inventoryId: 'i103', name: 'Sugar', quantity: 0.2, unit: 'kg' },
    { inventoryId: 'i105', name: 'Chocolate', quantity: 0.15, unit: 'kg' },
    { inventoryId: 'i104', name: 'Eggs', quantity: 4, unit: 'pcs' },
    { inventoryId: 'i101', name: 'Butter', quantity: 0.12, unit: 'kg' },
    { inventoryId: 'i106', name: 'Cream', quantity: 0.1, unit: 'kg' },
  ]},
  { id: 'rec13', restaurantId: 'r6', productId: 'p103', name: 'Red Velvet Cupcake', ingredients: [
    { inventoryId: 'i100', name: 'Flour', quantity: 0.08, unit: 'kg' },
    { inventoryId: 'i103', name: 'Sugar', quantity: 0.06, unit: 'kg' },
    { inventoryId: 'i104', name: 'Eggs', quantity: 1, unit: 'pcs' },
    { inventoryId: 'i106', name: 'Cream', quantity: 0.05, unit: 'kg' },
    { inventoryId: 'i107', name: 'Vanilla Extract', quantity: 0.005, unit: 'kg' },
  ]},
  { id: 'rec14', restaurantId: 'r6', productId: 'p104', name: 'Danish Pastry', ingredients: [
    { inventoryId: 'i100', name: 'Flour', quantity: 0.12, unit: 'kg' },
    { inventoryId: 'i101', name: 'Butter', quantity: 0.08, unit: 'kg' },
    { inventoryId: 'i102', name: 'Yeast', quantity: 0.008, unit: 'kg' },
    { inventoryId: 'i104', name: 'Eggs', quantity: 1, unit: 'pcs' },
  ]},
  { id: 'rec15', restaurantId: 'r6', productId: 'p106', name: 'Cinnamon Roll', ingredients: [
    { inventoryId: 'i100', name: 'Flour', quantity: 0.15, unit: 'kg' },
    { inventoryId: 'i101', name: 'Butter', quantity: 0.06, unit: 'kg' },
    { inventoryId: 'i103', name: 'Sugar', quantity: 0.08, unit: 'kg' },
    { inventoryId: 'i102', name: 'Yeast', quantity: 0.01, unit: 'kg' },
  ]},
  { id: 'rec16', restaurantId: 'r6', productId: 'p108', name: 'Brownie', ingredients: [
    { inventoryId: 'i105', name: 'Chocolate', quantity: 0.1, unit: 'kg' },
    { inventoryId: 'i101', name: 'Butter', quantity: 0.08, unit: 'kg' },
    { inventoryId: 'i103', name: 'Sugar', quantity: 0.1, unit: 'kg' },
    { inventoryId: 'i100', name: 'Flour', quantity: 0.06, unit: 'kg' },
    { inventoryId: 'i104', name: 'Eggs', quantity: 2, unit: 'pcs' },
  ]},
  // Daig House recipes (r2)
  { id: 'rec20', restaurantId: 'r2', productId: 'p50', name: 'Beef Nihari', ingredients: [
    { inventoryId: 'i50', name: 'Beef (Nihari cut)', quantity: 0.35, unit: 'kg' },
    { inventoryId: 'i56', name: 'Spice Mix', quantity: 0.04, unit: 'kg' },
    { inventoryId: 'i57', name: 'Onion', quantity: 0.1, unit: 'kg' },
    { inventoryId: 'i59', name: 'Cooking Oil', quantity: 0.05, unit: 'kg' },
  ]},
  { id: 'rec21', restaurantId: 'r2', productId: 'p51', name: 'Chicken Handi', ingredients: [
    { inventoryId: 'i52', name: 'Chicken', quantity: 0.45, unit: 'kg' },
    { inventoryId: 'i58', name: 'Tomato', quantity: 0.15, unit: 'kg' },
    { inventoryId: 'i56', name: 'Spice Mix', quantity: 0.03, unit: 'kg' },
    { inventoryId: 'i55', name: 'Yogurt', quantity: 0.08, unit: 'kg' },
  ]},
  { id: 'rec22', restaurantId: 'r2', productId: 'p54', name: 'Lamb Biryani', ingredients: [
    { inventoryId: 'i51', name: 'Mutton', quantity: 0.3, unit: 'kg' },
    { inventoryId: 'i53', name: 'Basmati Rice', quantity: 0.35, unit: 'kg' },
    { inventoryId: 'i56', name: 'Spice Mix', quantity: 0.04, unit: 'kg' },
    { inventoryId: 'i57', name: 'Onion', quantity: 0.12, unit: 'kg' },
  ]},
  { id: 'rec23', restaurantId: 'r2', productId: 'p58', name: 'Daal Chawal', ingredients: [
    { inventoryId: 'i60', name: 'Lentils (Daal)', quantity: 0.15, unit: 'kg' },
    { inventoryId: 'i53', name: 'Basmati Rice', quantity: 0.2, unit: 'kg' },
    { inventoryId: 'i56', name: 'Spice Mix', quantity: 0.02, unit: 'kg' },
  ]},
  { id: 'rec24', restaurantId: 'r2', productId: 'p61', name: 'Naan', ingredients: [
    { inventoryId: 'i61', name: 'Naan Dough Mix', quantity: 0.12, unit: 'kg' },
  ]},
]

export const riders = [
  { id: 'rd1', restaurantId: 'r1', branchId: 'b1', name: 'Imran Ali', phone: '0300 1112233', vehicle: 'Motorcycle', status: 'Available', activeOrders: 0, completedToday: 8, rating: 4.7, zone: 'Gulberg', route: 'Gulberg III → Model Town → Garden Town' },
  { id: 'rd2', restaurantId: 'r1', branchId: 'b1', name: 'Waqas Ahmed', phone: '0321 4455667', vehicle: 'Motorcycle', status: 'On Delivery', activeOrders: 2, completedToday: 12, rating: 4.9, zone: 'DHA', route: 'DHA Phase 5 → Phase 6 → Cantt' },
  { id: 'rd3', restaurantId: 'r1', branchId: 'b2', name: 'Zahid Hussain', phone: '0333 7788001', vehicle: 'Motorcycle', status: 'Available', activeOrders: 0, completedToday: 6, rating: 4.5, zone: 'Model Town', route: 'Model Town → Township → Iqbal Town' },
  { id: 'rd4', restaurantId: 'r2', branchId: 'b4', name: 'Shahbaz Khan', phone: '0345 2233445', vehicle: 'Motorcycle', status: 'On Delivery', activeOrders: 1, completedToday: 9, rating: 4.8, zone: 'F-7', route: 'F-7 → F-8 → F-10' },
  { id: 'rd5', restaurantId: 'r6', branchId: 'b9', name: 'Danish Rauf', phone: '0300 5566778', vehicle: 'Motorcycle', status: 'Available', activeOrders: 0, completedToday: 5, rating: 4.6, zone: 'Liberty', route: 'Liberty → Gulberg → Jail Road' },
  { id: 'rd6', restaurantId: 'r6', branchId: 'b10', name: 'Farhan Saeed', phone: '0321 8899001', vehicle: 'Motorcycle', status: 'On Delivery', activeOrders: 1, completedToday: 7, rating: 4.4, zone: 'Johar Town', route: 'Johar Town → Faisal Town → Township' },
  { id: 'rd7', restaurantId: 'r7', branchId: 'b11', name: 'Waqar Hussain', phone: '0333 1122334', vehicle: 'Motorcycle', status: 'Available', activeOrders: 0, completedToday: 10, rating: 4.8, zone: 'Blue Area', route: 'F-6 → F-7 → F-8 → G-9' },
  { id: 'rd8', restaurantId: 'r8', branchId: 'b13', name: 'Nadeem Asghar', phone: '0345 4455667', vehicle: 'Van', status: 'On Delivery', activeOrders: 3, completedToday: 15, rating: 4.7, zone: 'Shahrah-e-Faisal', route: 'PECHS → Gulshan → North Nazimabad' },
]

export const stockLists = [
  { id: 'sl1', restaurantId: 'r1', title: 'Weekly Kitchen Restock', frequency: 'weekly', lastGenerated: '2026-08-12', nextDue: '2026-08-19', status: 'Pending', items: [
    { inventoryId: 'i1', name: 'Chicken Breast', currentStock: 5, minimumStock: 8, requiredQuantity: 20, unit: 'kg', estimatedCost: 4600 },
    { inventoryId: 'i3', name: 'Cheese', currentStock: 3, minimumStock: 8, requiredQuantity: 15, unit: 'kg', estimatedCost: 5250 },
    { inventoryId: 'i8', name: 'Tomato', currentStock: 4, minimumStock: 8, requiredQuantity: 12, unit: 'kg', estimatedCost: 720 },
    { inventoryId: 'i14', name: 'Onion', currentStock: 6, minimumStock: 8, requiredQuantity: 15, unit: 'kg', estimatedCost: 600 },
    { inventoryId: 'i13', name: 'Basmati Rice', currentStock: 10, minimumStock: 8, requiredQuantity: 25, unit: 'kg', estimatedCost: 3750 },
  ]},
  { id: 'sl2', restaurantId: 'r6', title: 'Bakery Weekly Supplies', frequency: 'weekly', lastGenerated: '2026-08-12', nextDue: '2026-08-19', status: 'Pending', items: [
    { inventoryId: 'i100', name: 'Flour', currentStock: 120, minimumStock: 30, requiredQuantity: 100, unit: 'kg', estimatedCost: 12000 },
    { inventoryId: 'i101', name: 'Butter', currentStock: 45, minimumStock: 10, requiredQuantity: 30, unit: 'kg', estimatedCost: 54000 },
    { inventoryId: 'i102', name: 'Yeast', currentStock: 8, minimumStock: 3, requiredQuantity: 5, unit: 'kg', estimatedCost: 4750 },
    { inventoryId: 'i104', name: 'Eggs', currentStock: 200, minimumStock: 60, requiredQuantity: 150, unit: 'pcs', estimatedCost: 4200 },
    { inventoryId: 'i105', name: 'Chocolate', currentStock: 25, minimumStock: 8, requiredQuantity: 15, unit: 'kg', estimatedCost: 33000 },
  ]},
  { id: 'sl3', restaurantId: 'r7', title: 'Pharmacy Monthly Restock', frequency: 'monthly', lastGenerated: '2026-08-01', nextDue: '2026-09-01', status: 'Approved', items: [
    { inventoryId: 'i120', name: 'Paracetamol Bulk', currentStock: 500, minimumStock: 100, requiredQuantity: 500, unit: 'pcs', estimatedCost: 4000 },
    { inventoryId: 'i122', name: 'Antibiotic Stock', currentStock: 200, minimumStock: 50, requiredQuantity: 200, unit: 'pcs', estimatedCost: 9000 },
    { inventoryId: 'i124', name: 'Surgical Masks', currentStock: 1000, minimumStock: 200, requiredQuantity: 1000, unit: 'pcs', estimatedCost: 5000 },
    { inventoryId: 'i126', name: 'Syringes', currentStock: 400, minimumStock: 100, requiredQuantity: 300, unit: 'pcs', estimatedCost: 4500 },
  ]},
  { id: 'sl4', restaurantId: 'r8', title: 'Mart Weekly Restock', frequency: 'weekly', lastGenerated: '2026-08-12', nextDue: '2026-08-19', status: 'Pending', items: [
    { inventoryId: 'i140', name: 'Rice Stock', currentStock: 500, minimumStock: 100, requiredQuantity: 300, unit: 'kg', estimatedCost: 75000 },
    { inventoryId: 'i144', name: 'Dairy Stock', currentStock: 200, minimumStock: 50, requiredQuantity: 150, unit: 'pcs', estimatedCost: 28500 },
    { inventoryId: 'i145', name: 'Meat Stock', currentStock: 150, minimumStock: 30, requiredQuantity: 100, unit: 'kg', estimatedCost: 85000 },
    { inventoryId: 'i146', name: 'Produce Stock', currentStock: 250, minimumStock: 50, requiredQuantity: 200, unit: 'kg', estimatedCost: 24000 },
    { inventoryId: 'i148', name: 'Beverages Stock', currentStock: 600, minimumStock: 120, requiredQuantity: 400, unit: 'pcs', estimatedCost: 32000 },
  ]},
]

export const purchaseOrders = [
  {
    id: 'po-seed-d1', restaurantId: 'r1', groupId: 'pg-r1-seed', frequency: 'daily',
    number: 'PO-D-1001', title: 'Daily Auto PO', status: 'Draft', supplier: 'Auto-generated', autoGenerated: true,
    generatedAt: '2026-08-16', items: [
      { inventoryId: 'i1', name: 'Chicken Breast', currentStock: 5, minimum: 8, deficit: 3, requiredQty: 3, unit: 'kg', cost: 230, estimatedCost: 690 },
      { inventoryId: 'i3', name: 'Cheese', currentStock: 3, minimum: 8, deficit: 5, requiredQty: 5, unit: 'kg', cost: 350, estimatedCost: 1750 },
    ],
  },
  {
    id: 'po-seed-w1', restaurantId: 'r1', groupId: 'pg-r1-seed', frequency: 'weekly',
    number: 'PO-W-1002', title: 'Weekly Auto PO', status: 'Draft', supplier: 'Auto-generated', autoGenerated: true,
    generatedAt: '2026-08-16', items: [
      { inventoryId: 'i1', name: 'Chicken Breast', currentStock: 5, minimum: 8, deficit: 3, requiredQty: 12, unit: 'kg', cost: 230, estimatedCost: 2760 },
      { inventoryId: 'i3', name: 'Cheese', currentStock: 3, minimum: 8, deficit: 5, requiredQty: 20, unit: 'kg', cost: 350, estimatedCost: 7000 },
    ],
  },
  {
    id: 'po-seed-m1', restaurantId: 'r1', groupId: 'pg-r1-seed', frequency: 'monthly',
    number: 'PO-M-1003', title: 'Monthly Auto PO', status: 'Draft', supplier: 'Auto-generated', autoGenerated: true,
    generatedAt: '2026-08-16', items: [
      { inventoryId: 'i1', name: 'Chicken Breast', currentStock: 5, minimum: 8, deficit: 3, requiredQty: 36, unit: 'kg', cost: 230, estimatedCost: 8280 },
      { inventoryId: 'i3', name: 'Cheese', currentStock: 3, minimum: 8, deficit: 5, requiredQty: 60, unit: 'kg', cost: 350, estimatedCost: 21000 },
    ],
  },
]

export const feedback = [
  { id: 'fb1', restaurantId: 'r1', customerId: 'cu1', customerName: 'Ahmed Raza', orderId: 'o1001', rating: 5, category: 'Food Quality', message: 'Biryani was amazing, will order again!', createdAt: '2026-08-16T14:30:00', status: 'Published' },
  { id: 'fb2', restaurantId: 'r1', customerId: 'cu3', customerName: 'Usman Malik', orderId: null, rating: 4, category: 'Website', message: 'Easy to order but delivery took a bit longer than expected.', createdAt: '2026-08-15T19:00:00', status: 'Published' },
  { id: 'fb3', restaurantId: 'r1', customerId: 'cu5', customerName: 'Hassan Ali', orderId: 'o1005', rating: 5, category: 'Delivery', message: 'Rider was polite and food arrived hot.', createdAt: '2026-08-14T21:15:00', status: 'Published' },
]

export const supportTickets = [
  { id: 'st1', restaurantId: 'r1', customerId: 'cu2', customerName: 'Fatima Khan', subject: 'Wrong item delivered', message: 'I ordered chicken biryani but received mutton pulao.', type: 'Order Issue', status: 'Resolved', createdAt: '2026-08-17T12:00:00', response: 'We apologize — a full refund has been processed.' },
  { id: 'st2', restaurantId: 'r1', customerId: 'cu4', customerName: 'Ayesha Noor', subject: 'How to use loyalty points?', message: 'Can I redeem points on my next online order?', type: 'General', status: 'Open', createdAt: '2026-08-18T09:30:00', response: null },
]

export const addons = [
  { id: 'a1', restaurantId: 'r1', name: 'Extra Cheese', price: 120, category: 'Burgers', active: true, inventoryTracking: true, inventoryItemId: 'i3', quantityPerAddon: 1, unit: 'kg' },
  { id: 'a2', restaurantId: 'r1', name: 'Extra Patty', price: 250, category: 'Burgers', active: true },
  { id: 'a3', restaurantId: 'r1', name: 'Bacon Strip', price: 180, category: 'Burgers', active: true },
  { id: 'a4', restaurantId: 'r1', name: 'Jalapeños', price: 80, category: 'Burgers', active: true },
  { id: 'a5', restaurantId: 'r1', name: 'Extra Cheese', price: 150, category: 'Pizza', active: true },
  { id: 'a6', restaurantId: 'r1', name: 'Stuffed Crust', price: 220, category: 'Pizza', active: true },
  { id: 'a7', restaurantId: 'r1', name: 'Olives', price: 100, category: 'Pizza', active: true },
  { id: 'a8', restaurantId: 'r1', name: 'Mushrooms', price: 90, category: 'Pizza', active: true },
  { id: 'a9', restaurantId: 'r1', name: 'Mint Chutney', price: 60, category: 'BBQ', active: true },
  { id: 'a10', restaurantId: 'r1', name: 'Raita', price: 80, category: 'BBQ', active: true },
  { id: 'a11', restaurantId: 'r1', name: 'Naan', price: 80, category: 'BBQ', active: true },
  { id: 'a12', restaurantId: 'r1', name: 'Paratha', price: 90, category: 'BBQ', active: true },
]

const calcSeedRecipeCost = (ingredients, items) => ingredients.reduce((sum, ing) => {
  const item = items.find((i) => i.id === ing.inventoryId)
  return sum + (item?.cost || 0) * (Number(ing.quantity) || 0)
}, 0)

const calcSeedMaxServings = (ingredients, items) => {
  const usable = ingredients.filter((ing) => ing.inventoryId && Number(ing.quantity) > 0)
  if (!usable.length) return 0
  return Math.min(...usable.map((ing) => {
    const item = items.find((i) => i.id === ing.inventoryId)
    return item ? Math.floor(item.stock / Number(ing.quantity)) : 0
  }))
}

const syncedProducts = products.map((product) => {
  const recipe = recipes.find((r) => r.productId === product.id)
  if (!recipe?.ingredients?.length) return { ...product, stockMode: product.stockMode || 'direct', productType: product.productType || 'DIRECT_STOCK' }
  return {
    ...product,
    stockMode: 'recipe',
    productType: 'RECIPE',
    inventoryTracking: true,
    cost: calcSeedRecipeCost(recipe.ingredients, inventory),
    stock: calcSeedMaxServings(recipe.ingredients, inventory),
  }
})

export const initialData = { restaurants, branches, categories, products: syncedProducts, addons, orders, customers, inventory, inventoryMovements: [], employees, tables, notifications, users, offers, recipes, riders, stockLists, purchaseOrders, feedback, supportTickets, expenses: [], heldOrders: [], pendingSync: [] }
