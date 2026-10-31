import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart3, Bell, Bike, Boxes, Building2, ChefHat, ChevronRight,
  CircleDollarSign, ClipboardList, CreditCard, FileText, LayoutDashboard, Menu, Moon, Package,
  LogOut, PanelLeftClose, PanelLeftOpen, PlusCircle, ReceiptText, Search, Settings, Shield, ShoppingBag, Store,
  Sun, Table2, Tags, Truck, Users, UtensilsCrossed, WalletCards, Wifi, WifiOff, X, ArrowLeftRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BUSINESS_TYPE_NAV } from '../data/seed'
import { Badge, Input, Modal, Select, Toast } from '../components/ui'
import { NotificationBell } from '../components/NotificationBell'

const superLinks = [
  ['Dashboard', '', LayoutDashboard], ['Business Types', 'business-types', Building2], ['Businesses', 'restaurants', Store], ['Plans', 'plans', CreditCard],
  ['Subscriptions', 'subscriptions', WalletCards], ['Feature management', 'features', Tags], ['Audit logs', 'audit-logs', Activity],
]

const restaurantLinks = [
  ['Dashboard', 'dashboard', LayoutDashboard], ['POS', 'pos', ShoppingBag, 'pos'], ['Orders', 'orders', ClipboardList],
  ['Tables', 'tables', Table2, 'tables'], ['Kitchen', 'kitchen', ChefHat, 'kds'], ['Kitchen Progress', 'kitchen-progress', ChefHat, 'kds'],
  ['Menu & Products', 'menu', UtensilsCrossed], ['Addons', 'addons', PlusCircle], ['Offers', 'offers', Tags],
  ['Inventory', 'inventory', Boxes, 'inventory'], ['Stock Movement', 'stock-movement', ArrowLeftRight, 'inventory'],
  ['Stock Lists', 'stock-lists', Package, 'purchasing'], ['Purchasing', 'purchasing', Package, 'purchasing'],
  ['Customers', 'customers', Users, 'crm'],
  ['Delivery', 'delivery', Truck, 'delivery'], ['Loyalty', 'loyalty', Tags, 'loyalty'], ['Employees', 'employees', Users],
  ['Roles', 'roles', Shield], ['Shifts', 'shifts', CircleDollarSign], ['Expenses', 'expenses', ReceiptText, 'expenses'],
  ['Ledger', 'ledger', FileText, 'reports'], ['Reports', 'reports', BarChart3, 'reports'], ['Settings', 'settings', Settings],
]

function getRoleLinks(role, businessType, userPermissions) {
  const typeNav = BUSINESS_TYPE_NAV[businessType] || BUSINESS_TYPE_NAV.restaurant
  const allNav = restaurantLinks.map(([label]) => label)
  const roleBase = {
    'Restaurant Owner': allNav,
    'Branch Manager': allNav.filter((l) => l !== 'Settings'),
    Cashier: ['POS', 'Orders'],
    'Kitchen Staff': ['Kitchen'],
    Waiter: ['Orders'],
    'Delivery Rider': [],
  }
  let allowed = roleBase[role] || []
  if (userPermissions && typeof userPermissions === 'object') {
    const permToNav = { pos: 'POS', kitchen: 'Kitchen', inventory: 'Inventory', reports: 'Reports', customers: 'Customers', delivery: 'Delivery', orders: 'Orders', menu: 'Menu & Products', employees: 'Employees', 'stock-movement': 'Stock Movement', 'stock-lists': 'Stock Lists', ledger: 'Ledger', roles: 'Roles', 'rider-dashboard': 'Delivery', waiter: 'Orders' }
    const enabledLabels = new Set(Object.entries(userPermissions).filter(([, v]) => v).map(([k]) => permToNav[k]).filter(Boolean))
    enabledLabels.add('Dashboard')
    allowed = allowed.filter((label) => enabledLabels.has(label))
  }
  return allowed.filter((label) => typeNav.includes(label))
}

export default function AppShell({ mode }) {
  const { data, activeRestaurant, activeBranch, restaurantBranches, setActiveBranchId, online, toggleOnline, theme, setTheme, toast, session, logout } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isSuper = mode === 'super'
  const base = isSuper ? '/super-admin' : `/restaurant/${activeRestaurant?.id}`
  const businessType = activeRestaurant?.type || 'restaurant'
  const allowedLabels = getRoleLinks(session?.role, businessType, session?.permissions)
  const links = isSuper ? superLinks : restaurantLinks.filter(([label, , , feature]) => allowedLabels.includes(label) && (!feature || activeRestaurant?.features?.[feature]))

  useEffect(() => setMobileOpen(false), [location.pathname])
  useEffect(() => {
    const handle = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return [
      ...(isSuper ? data.restaurants.filter((item) => item.name.toLowerCase().includes(q)).map((item) => ({ type: 'Restaurant', label: item.name, detail: item.city, path: `/super-admin/restaurants/${item.id}` })) : []),
      ...data.orders.filter((item) => (isSuper || item.restaurantId === activeRestaurant.id) && (item.number.toLowerCase().includes(q) || item.customer.toLowerCase().includes(q))).slice(0, 5).map((item) => ({ type: 'Order', label: item.number, detail: item.customer, path: `/restaurant/${item.restaurantId}/orders` })),
      ...data.products.filter((item) => item.restaurantId === activeRestaurant?.id && item.name.toLowerCase().includes(q)).slice(0, 5).map((item) => ({ type: 'Product', label: item.name, detail: item.category, path: `/restaurant/${activeRestaurant.id}/menu` })),
      ...data.customers.filter((item) => item.restaurantId === activeRestaurant?.id && item.name.toLowerCase().includes(q)).slice(0, 5).map((item) => ({ type: 'Customer', label: item.name, detail: item.phone, path: `/restaurant/${activeRestaurant.id}/customers` })),
    ].slice(0, 10)
  }, [activeRestaurant, data, isSuper, query])

  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><UtensilsCrossed size={20} /></div>
        {!collapsed && <div><strong>Orbit POS</strong><span>Business OS</span></div>}
        <button className="sidebar-mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
      </div>
      <div className="demo-label">{!collapsed && 'DEMO MODE'}</div>
      {!isSuper && <div className="restaurant-chip" style={{ '--restaurant-brand': activeRestaurant?.branding?.primary }}>
        <div>{activeRestaurant?.branding?.mark}</div>{!collapsed && <span><strong>{activeRestaurant?.name}</strong><small>{businessType[0].toUpperCase() + businessType.slice(1)} · {activeRestaurant?.plan}</small></span>}
      </div>}
      <nav aria-label="Main navigation">
        {links.map(([label, path, Icon]) => <NavLink key={label} to={`${base}${path ? `/${path}` : ''}`} end={!path} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-footer">
        <button onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span>Collapse sidebar</span></button>
        <button onClick={() => { logout(); navigate('/') }}><LogOut size={18}/><span>Sign out</span></button>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
        <button className="global-search" onClick={() => setSearchOpen(true)}><Search size={17} /><span>Search anything…</span><kbd>Ctrl K</kbd></button>
        <div className="topbar-actions">
          {!isSuper && restaurantBranches.length > 0 && <label className="branch-picker"><Building2 size={16} /><Select variant="ghost" value={activeBranch?.id || ''} onChange={(event) => setActiveBranchId(event.target.value)}>{restaurantBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></label>}
          <button className={`connectivity ${online ? 'online' : 'offline'}`} onClick={toggleOnline}>{online ? <Wifi size={15} /> : <WifiOff size={15} />}<span>{online ? 'Online' : `Offline · ${data.pendingSync.length} pending`}</span></button>
          <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
          <NotificationBell basePath={base} />
          <div className="user-avatar" title={`${session?.name} · ${session?.role}`}>{session?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'OP'}</div>
        </div>
      </header>
      <div className="content"><Outlet /></div>
    </main>

    <Modal open={searchOpen} onClose={() => { setSearchOpen(false); setQuery('') }} title="Search Orbit" description="Find restaurants, orders, products and customers." size="lg">
      <Input icon={Search} autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Start typing…" />
      <div className="search-results">{query && !results.length && <p className="muted center">No matching records found.</p>}{results.map((result) => <button key={`${result.type}-${result.label}`} onClick={() => { navigate(result.path); setSearchOpen(false); setQuery('') }}><span className="result-icon"><Search size={15} /></span><span><strong>{result.label}</strong><small>{result.detail}</small></span><Badge>{result.type}</Badge><ChevronRight size={16} /></button>)}</div>
    </Modal>
    <Toast toast={toast} />
  </div>
}
