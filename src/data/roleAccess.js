import { Bike, ChefHat, ClipboardList, ShieldCheck, ShoppingBag, Store, UserRound } from 'lucide-react'

export const ROLE_ACCESS = {
  'super-admin': { role: 'Super Admin', title: 'Platform owner', icon: ShieldCheck, email: 'owner@orbitpos.pk', name: 'Platform Owner', home: '/super-admin', restaurantId: null },
  'restaurant-owner': { role: 'Restaurant Owner', title: 'Restaurant owner', icon: Store, email: 'owner@saltandember.pk', name: 'Hamza Qureshi', home: '/restaurant/r1/dashboard', restaurantId: 'r1' },
  'branch-manager': { role: 'Branch Manager', title: 'Branch manager', icon: UserRound, email: 'manager@saltandember.pk', name: 'Ali Raza', home: '/restaurant/r1/dashboard', restaurantId: 'r1' },
  cashier: { role: 'Cashier', title: 'Cashier', icon: ShoppingBag, email: 'cashier@saltandember.pk', name: 'Fatima Khan', home: '/restaurant/r1/pos', restaurantId: 'r1' },
  'kitchen-staff': { role: 'Kitchen Staff', title: 'Kitchen staff', icon: ChefHat, email: 'kitchen@saltandember.pk', name: 'Usman Malik', home: '/restaurant/r1/kitchen', restaurantId: 'r1' },
  waiter: { role: 'Waiter', title: 'Waiter / Server', icon: ClipboardList, email: 'waiter@saltandember.pk', name: 'Daniyal Shah', home: '/restaurant/r1/waiter', restaurantId: 'r1' },
  rider: { role: 'Delivery Rider', title: 'Delivery rider', icon: Bike, email: 'rider@saltandember.pk', name: 'Imran Ali', home: '/restaurant/r1/rider-dashboard', restaurantId: 'r1' },
}

export const PERMISSIONS = {
  'Restaurant Owner': ['pos', 'kitchen', 'inventory', 'reports', 'customers', 'delivery', 'orders', 'menu', 'settings', 'employees', 'stock-movement', 'stock-lists', 'ledger', 'roles', 'riders', 'waiter'],
  'Branch Manager': ['pos', 'kitchen', 'inventory', 'reports', 'customers', 'delivery', 'orders', 'menu', 'employees', 'stock-movement', 'stock-lists', 'ledger', 'roles', 'riders'],
  Cashier: ['pos', 'orders'],
  'Kitchen Staff': ['kitchen'],
  Waiter: ['waiter', 'orders'],
  'Delivery Rider': ['rider-dashboard'],
}

export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'bakery', label: 'Bakery', icon: '🥐' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'mart', label: 'Mart', icon: '🛒' },
  { value: 'retail', label: 'Retail', icon: '👔' },
]

export const ROLE_PERMISSIONS = {
  'Branch Manager': ['pos', 'kitchen', 'inventory', 'reports', 'customers', 'delivery', 'orders', 'menu', 'employees', 'stock-movement', 'stock-lists', 'ledger', 'roles', 'riders'],
  Cashier: ['pos', 'orders'],
  'Kitchen Staff': ['kitchen', 'orders'],
  Waiter: ['waiter', 'orders'],
  'Delivery Rider': ['rider-dashboard', 'delivery'],
}

export const ROLES_BY_BUSINESS_TYPE = {
  restaurant: ['Branch Manager', 'Cashier', 'Kitchen Staff', 'Waiter', 'Delivery Rider'],
  bakery: ['Branch Manager', 'Cashier', 'Kitchen Staff', 'Waiter', 'Delivery Rider'],
  pharmacy: ['Branch Manager', 'Cashier', 'Delivery Rider'],
  mart: ['Branch Manager', 'Cashier', 'Delivery Rider'],
  retail: ['Branch Manager', 'Cashier', 'Delivery Rider'],
}
