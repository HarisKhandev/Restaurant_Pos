import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import AppShell from './layouts/AppShell'
import DemoAccess from './pages/DemoAccess'
import { BusinessTypesPage, FeatureManagementPage, Plans, RestaurantDetail, RestaurantsPage, SuperDashboard, SuperGeneric } from './pages/SuperAdmin'
import {
  BranchesPage, FeatureGate, InventoryPage, KitchenPage, MenuPage, AddonsPage, OffersPage, OperationsPage,
  OrdersPage, ReportsPage, RestaurantDashboard, SettingsPage, TablesPage,
} from './pages/RestaurantPages'
import POS from './pages/POS'
import { NotificationsPage } from './pages/Extras'
import LoginPage from './pages/LoginPage'
import Storefront from './pages/Storefront'
import { ROLE_ACCESS } from './data/roleAccess'
import { StockListPage, LedgerPage, DeliveryManagementPage, RiderDashboardPage, WaiterPage } from './pages/RecipeInventoryPages'
import { StockMovementPage } from './pages/StockMovementPage'
import { EnhancedManagerDashboard, RoleManagementPage, EnhancedSuperAdminDashboard, KitchenOrderProgressPage, CustomerManagementPage } from './pages/ManagerDashboardPages'

const owner = ['Restaurant Owner']
const management = ['Restaurant Owner', 'Branch Manager']
const operations = ['Restaurant Owner', 'Branch Manager', 'Cashier']
const kitchen = ['Restaurant Owner', 'Branch Manager', 'Kitchen Staff']
const allStaff = ['Restaurant Owner', 'Branch Manager', 'Cashier', 'Kitchen Staff', 'Waiter', 'Delivery Rider']

function homeFor(role, restaurantId) {
  if (role === 'Super Admin') return '/super-admin'
  if (restaurantId) {
    const page = { 'Restaurant Owner': 'dashboard', 'Branch Manager': 'dashboard', Cashier: 'pos', 'Kitchen Staff': 'kitchen', Waiter: 'waiter', 'Delivery Rider': 'rider-dashboard' }[role] || 'dashboard'
    return `/restaurant/${restaurantId}/${page}`
  }
  return Object.values(ROLE_ACCESS).find((item) => item.role === role)?.home || '/'
}

function RequireAccess({ roles, restaurant = false, children }) {
  const { session } = useApp()
  const { restaurantId } = useParams()
  if (!session) return <Navigate to="/login" replace />
  if (!roles.includes(session.role)) return <Navigate to={homeFor(session.role, session.restaurantId)} replace />
  if (restaurant && session.restaurantId && session.restaurantId !== restaurantId) return <Navigate to={homeFor(session.role, session.restaurantId)} replace />
  return children
}

function RestaurantScope({ children }) {
  const { restaurantId } = useParams()
  const { activeRestaurantId, switchRestaurant } = useApp()
  useEffect(() => {
    if (restaurantId && restaurantId !== activeRestaurantId) switchRestaurant(restaurantId)
  }, [activeRestaurantId, restaurantId, switchRestaurant])
  return children
}

function StoreRedirect() {
  const { restaurantId } = useParams()
  const { data } = useApp()
  const restaurant = data.restaurants.find((item) => item.id === restaurantId)
  const slug = restaurant?.slug || restaurant?.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return <Navigate to={slug ? `/online-order/${slug}` : '/'} replace/>
}

function Feature({ name, children }) {
  return <FeatureGate feature={name}>{children}</FeatureGate>
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<DemoAccess/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/online-order" element={<Navigate to="/online-order/salt-and-ember" replace/>}/>
    <Route path="/online-order/:slug" element={<Storefront/>}/>
    <Route path="/super-admin" element={<RequireAccess roles={['Super Admin']}><AppShell mode="super"/></RequireAccess>}>
      <Route index element={<EnhancedSuperAdminDashboard/>}/>
      <Route path="business-types" element={<BusinessTypesPage/>}/>
      <Route path="restaurants" element={<RestaurantsPage/>}/>
      <Route path="restaurants/:id" element={<RestaurantDetail/>}/>
      <Route path="plans" element={<Plans/>}/>
      <Route path="subscriptions" element={<SuperGeneric type="subscriptions"/>}/>
      <Route path="features" element={<FeatureManagementPage/>}/>
      <Route path="audit-logs" element={<SuperGeneric type="audit-logs"/>}/>
    </Route>
    <Route path="/restaurant/:restaurantId/pos" element={<RequireAccess roles={operations} restaurant><RestaurantScope><Feature name="pos"><POS/></Feature></RestaurantScope></RequireAccess>}/>
    <Route path="/restaurant/:restaurantId/waiter" element={<RequireAccess roles={[...management, 'Waiter']} restaurant><RestaurantScope><WaiterPage/></RestaurantScope></RequireAccess>}/>
    <Route path="/restaurant/:restaurantId/rider-dashboard" element={<RequireAccess roles={[...management, 'Delivery Rider']} restaurant><RestaurantScope><RiderDashboardPage/></RestaurantScope></RequireAccess>}/>
    <Route path="/restaurant/:restaurantId/store" element={<RequireAccess roles={management} restaurant><StoreRedirect/></RequireAccess>}/>
    <Route path="/restaurant/:restaurantId" element={<RequireAccess roles={allStaff} restaurant><RestaurantScope><AppShell mode="restaurant"/></RestaurantScope></RequireAccess>}>
      <Route index element={<Navigate to="dashboard" replace/>}/>
      <Route path="dashboard" element={<RequireAccess roles={management}><EnhancedManagerDashboard/></RequireAccess>}/>
      <Route path="branches" element={<RequireAccess roles={management}><BranchesPage/></RequireAccess>}/>
      <Route path="orders" element={<RequireAccess roles={[...operations, 'Waiter']}><OrdersPage/></RequireAccess>}/>
      <Route path="tables" element={<RequireAccess roles={management}><Feature name="tables"><TablesPage/></Feature></RequireAccess>}/>
      <Route path="kitchen" element={<RequireAccess roles={kitchen}><Feature name="kds"><KitchenPage/></Feature></RequireAccess>}/>
      <Route path="kitchen-progress" element={<RequireAccess roles={management}><Feature name="kds"><KitchenOrderProgressPage/></Feature></RequireAccess>}/>
      <Route path="menu" element={<RequireAccess roles={management}><MenuPage/></RequireAccess>}/>
      <Route path="recipes" element={<Navigate to="menu" replace/>}/>
      <Route path="addons" element={<RequireAccess roles={management}><AddonsPage/></RequireAccess>}/>
      <Route path="offers" element={<RequireAccess roles={owner}><OffersPage/></RequireAccess>}/>
      <Route path="inventory" element={<RequireAccess roles={management}><Feature name="inventory"><InventoryPage/></Feature></RequireAccess>}/>
      <Route path="stock-movement" element={<RequireAccess roles={management}><Feature name="inventory"><StockMovementPage/></Feature></RequireAccess>}/>
      <Route path="stock-lists" element={<RequireAccess roles={management}><Feature name="purchasing"><StockListPage/></Feature></RequireAccess>}/>
      <Route path="ledger" element={<RequireAccess roles={management}><Feature name="reports"><LedgerPage/></Feature></RequireAccess>}/>
      <Route path="purchasing" element={<RequireAccess roles={management}><Feature name="purchasing"><OperationsPage type="purchasing"/></Feature></RequireAccess>}/>
      <Route path="customers" element={<RequireAccess roles={management}><Feature name="crm"><CustomerManagementPage/></Feature></RequireAccess>}/>
      <Route path="online-orders" element={<Navigate to="orders" replace/>}/>
      <Route path="delivery" element={<RequireAccess roles={management}><Feature name="delivery"><DeliveryManagementPage/></Feature></RequireAccess>}/>
      <Route path="loyalty" element={<RequireAccess roles={owner}><Feature name="loyalty"><OperationsPage type="loyalty"/></Feature></RequireAccess>}/>
      <Route path="employees" element={<RequireAccess roles={management}><OperationsPage type="employees"/></RequireAccess>}/>
      <Route path="roles" element={<RequireAccess roles={management}><RoleManagementPage/></RequireAccess>}/>
      <Route path="shifts" element={<RequireAccess roles={management}><OperationsPage type="shifts"/></RequireAccess>}/>
      <Route path="expenses" element={<RequireAccess roles={management}><Feature name="expenses"><OperationsPage type="expenses"/></Feature></RequireAccess>}/>
      <Route path="reports" element={<RequireAccess roles={management}><Feature name="reports"><ReportsPage/></Feature></RequireAccess>}/>
      <Route path="settings" element={<RequireAccess roles={owner}><SettingsPage/></RequireAccess>}/>
      <Route path="notifications" element={<RequireAccess roles={allStaff}><NotificationsPage/></RequireAccess>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}

export default function App() {
  return <BrowserRouter><AppProvider><AppRoutes/></AppProvider></BrowserRouter>
}
