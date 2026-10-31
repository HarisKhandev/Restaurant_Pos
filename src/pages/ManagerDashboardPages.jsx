import { useState, useEffect, useMemo } from 'react'
import { Activity, AlertTriangle, ArrowRight, Bike, Box, ChefHat, CircleDollarSign, Clock3, Eye, EyeOff, Filter, GitBranch, Heart, Mail, MapPin, Package, Phone, Plus, Printer, RefreshCw, Search, Settings, Shield, ShoppingBag, Star, Store, Trash2, TrendingDown, TrendingUp, Truck, User, UserCheck, UserPlus, Users, Zap } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { DASHBOARD_PIPELINE_STATUSES, KITCHEN_PIPELINE_STAGES, KITCHEN_QUEUE_STATUSES, countOrdersByPipelineStatus, filterKitchenPipeline, getKitchenStageActionLabel, getNextOrderStatus, getOrderActionLabel, ordersInKitchenStage, statusForKitchenStage } from '../utils/orderWorkflow'
import { KanbanBoard } from '../components/KanbanBoard'
import { Badge, Button, Card, DataTable, Drawer, Field, Input, Modal, PageHeader, SearchBox, SectionHeader, Select, StatCard, Tabs, money } from '../components/ui'
import { FeatureToggleMatrix } from '../components/FeatureMatrix'

// ─── Helpers ────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const pct = (a, b) => b ? `${((a / b) * 100).toFixed(1)}%` : '0%'
const avg = (arr) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0

const PIPELINE_STAGES = DASHBOARD_PIPELINE_STATUSES.slice(0, 5)
const STATIONS = ['Grill', 'Pizza', 'Drinks', 'Dessert', 'BBQ', 'Bakery']
const ORDER_TYPES = ['Dine-in', 'Takeaway', 'Delivery', 'Online']
const PAYMENT_METHODS = ['Cash', 'Card', 'Raast', 'JazzCash', 'EasyPaisa']
const PERMISSIONS = ['POS Access', 'Kitchen Access', 'Inventory Access', 'Reports Access', 'Customer Management', 'Delivery Management', 'Order Management', 'Menu Management', 'Settings Access']
const DEFAULT_ROLES = [
  { name: 'Waiter', icon: Users, permissions: ['POS Access', 'Order Management'] },
  { name: 'Cashier', icon: CircleDollarSign, permissions: ['POS Access', 'Order Management', 'Customer Management'] },
  { name: 'Kitchen Staff', icon: ChefHat, permissions: ['Kitchen Access', 'Inventory Access'] },
  { name: 'Delivery Rider', icon: Bike, permissions: ['Delivery Management'] },
  { name: 'Branch Manager', icon: Shield, permissions: PERMISSIONS },
]
const TIERS = (orders) => orders >= 10 ? 'VIP' : orders >= 5 ? 'Regular' : orders >= 2 ? 'Returning' : 'New'
const TIER_TONE = { VIP: 'active', Regular: 'info', Returning: 'warning', New: '' }
const BUSINESS_TYPES = ['All', 'Restaurant', 'Bakery', 'Pharmacy', 'Mart', 'Retail']

// ─── 1. EnhancedManagerDashboard ────────────────────────────────────────────

export function EnhancedManagerDashboard() {
  const { data, activeRestaurant, activeBranch, updateCollection, notify } = useApp()
  const [clock, setClock] = useState(new Date())
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState(today())
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [branchFilter, setBranchFilter] = useState('All')
  const [customerModal, setCustomerModal] = useState(null)

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 60000); return () => clearInterval(t) }, [])

  const branches = data.branches.filter((b) => b.restaurantId === activeRestaurant.id)
  const allOrders = data.orders.filter((o) => o.restaurantId === activeRestaurant.id)
  const filtered = useMemo(() => allOrders.filter((o) => {
    const d = o.createdAt?.slice(0, 10) || ''
    if (d < dateFrom || d > dateTo) return false
    if (branchFilter !== 'All' && o.branchId !== branchFilter) return false
    if (categoryFilter !== 'All') {
      const catProducts = data.products.filter((p) => p.category === categoryFilter).map((p) => p.id)
      if (!o.items?.some((i) => catProducts.includes(i.id))) return false
    }
    return true
  }), [allOrders, dateFrom, dateTo, branchFilter, categoryFilter, data.products])

  const todayOrders = allOrders.filter((o) => o.createdAt?.includes(today()))
  const todaySales = todayOrders.filter((o) => o.status === 'Completed').reduce((s, o) => s + o.total, 0)
  const customers = data.customers.filter((c) => c.restaurantId === activeRestaurant.id)
  const recurringCustomers = customers.filter((c) => c.orders >= 3)
  const avgOrderValue = todayOrders.length ? Math.round(todaySales / todayOrders.length) : 0

  // Sales chart data grouped by day
  const salesChart = useMemo(() => {
    const map = {}
    filtered.forEach((o) => {
      const d = o.createdAt?.slice(0, 10)
      if (!map[d]) map[d] = { date: d, sales: 0, prev: 0 }
      map[d].sales += o.total
    })
    const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
    sorted.forEach((v, i) => { v.prev = Math.round(v.sales * (0.8 + Math.random() * 0.3)) })
    return sorted
  }, [filtered])

  // Recurring products (ordered > 5 times)
  const productFreq = useMemo(() => {
    const freq = {}
    allOrders.forEach((o) => o.items?.forEach((i) => {
      if (!freq[i.id]) freq[i.id] = { id: i.id, name: i.name, count: 0, revenue: 0 }
      freq[i.id].count += i.quantity
      freq[i.id].revenue += i.price * i.quantity
    }))
    return Object.values(freq).filter((p) => p.count > 5).sort((a, b) => b.count - a.count)
  }, [allOrders])

  // Pipeline counts — canonical statuses shared with orders queue
  const pipelineCounts = useMemo(() => {
    const c = {}
    DASHBOARD_PIPELINE_STATUSES.forEach((s) => { c[s] = countOrdersByPipelineStatus(allOrders, s) })
    return c
  }, [allOrders])

  // Order type breakdown
  const typeBreakdown = ORDER_TYPES.map((t) => ({ name: t, value: allOrders.filter((o) => o.type === t).length || Math.floor(Math.random() * 30 + 5) }))
  const paymentBreakdown = PAYMENT_METHODS.map((m) => ({ name: m, value: allOrders.filter((o) => o.payment === m).length || Math.floor(Math.random() * 20 + 3) }))
  const typeColors = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b']
  const payColors = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#ef4444']

  // Riders
  const riders = (data.riders || data.employees?.filter((e) => e.role === 'Delivery Rider') || []).filter((r) => r.restaurantId === activeRestaurant.id)

  // Low stock
  const lowStock = data.inventory.filter((i) => i.stock <= i.minimum)

  // Customer order history
  const customerOrders = (c) => allOrders.filter((o) => o.customer === c.name || o.phone === c.phone)

  return <div>
    <PageHeader eyebrow={`${activeBranch?.name?.toUpperCase()} · MANAGER DASHBOARD`} title={`${activeRestaurant.name}`} description={`${clock.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${clock.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}`}><Button variant="outline"><RefreshCw size={16} /> Refresh</Button></PageHeader>

    {/* Quick Stats */}
    <div className="stat-grid four">
      <StatCard label="Today's sales" value={money(todaySales || 486240)} change="+14.2% vs yesterday" icon={TrendingUp} />
      <StatCard label="Today's orders" value={todayOrders.length || 184} change="+8.6% vs yesterday" icon={ShoppingBag} tone="blue" />
      <StatCard label="Recurring customers" value={recurringCustomers.length || 47} change={`${pct(recurringCustomers.length, customers.length)} of total`} icon={Heart} tone="violet" />
      <StatCard label="Average order value" value={money(avgOrderValue || 2642)} change="+5.1%" icon={CircleDollarSign} tone="amber" />
    </div>

    {/* Filters */}
    <Card className="report-filters">
      <Field label="From"><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field>
      <Field label="To"><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field>
      <Field label="Product category"><Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>All</option>{data.categories.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Branch"><Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}><option value="All">All branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      <Button><Filter size={16} /> Apply filters</Button>
    </Card>

    {/* Sales Chart */}
    <div className="dashboard-grid">
      <Card className="chart-card wide">
        <SectionHeader title="Sales performance" description="Filtered period with previous period comparison"><Tabs items={['Period', 'Comparison']} active="Period" onChange={() => {}} /></SectionHeader>
        <div className="chart-value"><strong>{money(filtered.reduce((s, o) => s + o.total, 0))}</strong><Badge tone="active">↑ 11.8%</Badge></div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={salesChart}>
            <defs>
              <linearGradient id="mgSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={.3} /><stop offset="100%" stopColor="#0f766e" stopOpacity={0} /></linearGradient>
              <linearGradient id="mgPrev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#94a3b8" stopOpacity={.15} /><stop offset="100%" stopColor="#94a3b8" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
            <YAxis hide />
            <Tooltip formatter={(v) => money(v)} />
            <Area type="monotone" dataKey="prev" stroke="#94a3b8" strokeWidth={1.5} fill="url(#mgPrev)" name="Previous" />
            <Area type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={2.5} fill="url(#mgSales)" name="Current" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Breakdown - Order Types */}
      <Card className="chart-card">
        <SectionHeader title="Revenue by type" description="Order channel distribution" />
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={typeBreakdown} innerRadius={55} outerRadius={77} paddingAngle={4} dataKey="value">{typeColors.map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip /></PieChart>
        </ResponsiveContainer>
        <div className="legend-row">{typeBreakdown.map((t, i) => <span key={t.name}><i className={`dot ${['green', 'blue', 'violet', 'amber'][i]}`} />{t.name} {t.value}</span>)}</div>
      </Card>
    </div>

    {/* Kitchen Order Pipeline */}
    <Card>
      <SectionHeader title="Kitchen order pipeline" description="Live order progress across stages" />
      <div className="stat-grid five" style={{ '--cols': 5 }}>
        {PIPELINE_STAGES.map((stage, i) => {
          const count = pipelineCounts[stage] || 0
          const avgTime = [0, 8, 14, 3, 12][i]
          return <Card key={stage} className="stat-card">
            <div className={`stat-icon tone-${['brand', 'amber', 'blue', 'violet', 'brand'][i]}`}><ChefHat size={19} /></div>
            <div><p>{stage}</p><strong>{count}</strong><small>{avgTime ? `Avg ${avgTime}m` : '—'}</small></div>
          </Card>
        })}
      </div>
      {allOrders.filter((o) => o.status === 'Preparing').length > 0 && <div className="operation-metric" style={{ marginTop: 12 }}>
        <span className="tone-red"><AlertTriangle size={18} /></span>
        <div><strong>{allOrders.filter((o) => o.status === 'Preparing').length} orders in preparation</strong><small>Monitor for delays over 20 minutes</small></div>
      </div>}
    </Card>

    {/* Recurring Products */}
    <Card>
      <SectionHeader title="Recurring products" description="Products ordered more than 5 times" />
      <DataTable rows={productFreq.slice(0, 15)} columns={[
        { key: 'name', label: 'Product', render: (r) => <strong>{r.name}</strong> },
        { key: 'count', label: 'Times ordered', render: (r) => <strong>{r.count}</strong> },
        { key: 'revenue', label: 'Total revenue', render: (r) => <strong>{money(r.revenue)}</strong> },
        { key: 'trend', label: 'Trend', render: (r) => r.count > 10 ? <Badge tone="active"><TrendingUp size={12} /> High</Badge> : <Badge tone="info">Steady</Badge> },
      ]} />
    </Card>

    {/* Recurring Customers */}
    <Card>
      <SectionHeader title="Recurring customers" description="Customers who ordered 3+ times" />
      <DataTable rows={recurringCustomers.length ? recurringCustomers : customers.filter((c) => c.orders >= 2).slice(0, 10)} columns={[
        { key: 'name', label: 'Customer', render: (r) => <div><strong>{r.name}</strong><small className="block">{r.phone}</small></div> },
        { key: 'orders', label: 'Total orders', render: (r) => <strong>{r.orders}</strong> },
        { key: 'spent', label: 'Total spent', render: (r) => <strong>{money(r.spent)}</strong> },
        { key: 'lastOrder', label: 'Last order', render: (r) => formatDate(r.lastOrder) },
        { key: 'points', label: 'Points', render: (r) => <Badge tone="info">{r.points} pts</Badge> },
        { key: 'action', label: '', render: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setCustomerModal(r) }}>View Profile</Button> },
      ]} />
    </Card>

    {/* Rider Performance */}
    <Card>
      <SectionHeader title="Rider performance" description="Active delivery crew tracking" />
      {riders.length ? <DataTable rows={riders} columns={[
        { key: 'name', label: 'Rider', render: (r) => <div><strong>{r.name}</strong></div> },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Active' ? 'active' : 'warning'}>{r.status || 'Active'}</Badge> },
        { key: 'ordersToday', label: 'Orders today', render: () => Math.floor(Math.random() * 12 + 3) },
        { key: 'avgTime', label: 'Avg delivery', render: () => `${Math.floor(Math.random() * 15 + 18)}m` },
        { key: 'rating', label: 'Rating', render: () => <span><Star size={13} style={{ color: '#f59e0b' }} /> {(4 + Math.random() * 0.9).toFixed(1)}</span> },
      ]} /> : <div className="operation-metric"><span className="tone-blue"><Truck size={18} /></span><div><strong>No riders configured</strong><small>Add delivery riders from Employees section</small></div></div>}
    </Card>

    {/* Payment Breakdown */}
    <div className="dashboard-grid">
      <Card className="chart-card">
        <SectionHeader title="Payment methods" description="Breakdown by tender type" />
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={paymentBreakdown} innerRadius={55} outerRadius={77} paddingAngle={4} dataKey="value">{payColors.map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip /></PieChart>
        </ResponsiveContainer>
        <div className="legend-row">{paymentBreakdown.slice(0, 4).map((p, i) => <span key={p.name}><i className={`dot ${['green', 'blue', 'violet', 'amber'][i]}`} />{p.name}</span>)}</div>
      </Card>

      {/* Low Stock */}
      <Card className="chart-card">
        <SectionHeader title="Low stock alerts" description={`${lowStock.length} items below threshold`} />
        {lowStock.slice(0, 8).map((item) => <div key={item.id} className="operation-metric">
          <span className={`tone-${item.stock === 0 ? 'red' : 'amber'}`}><Package size={18} /></span>
          <div><strong>{item.name}</strong><small>{item.stock} / {item.minimum} {item.unit}</small></div>
          <Button size="sm" variant="outline" onClick={() => { updateCollection('inventory', (items) => items.map((i) => i.id === item.id ? { ...i, stock: i.minimum * 3 } : i)); notify(`${item.name} restocked`) }}>Restock</Button>
        </div>)}
        {!lowStock.length && <div className="operation-metric"><span className="tone-brand"><Box size={18} /></span><div><strong>All stock levels healthy</strong><small>No items below minimum threshold</small></div></div>}
      </Card>
    </div>

    {/* Customer Profile Modal */}
    <Modal open={!!customerModal} onClose={() => setCustomerModal(null)} title={customerModal?.name || 'Customer'} description={customerModal?.phone} size="lg">
      {customerModal && <div>
        <div className="stat-grid four" style={{ marginBottom: 16 }}>
          <div><p>Total orders</p><strong>{customerModal.orders}</strong></div>
          <div><p>Total spent</p><strong>{money(customerModal.spent)}</strong></div>
          <div><p>Points</p><strong>{customerModal.points}</strong></div>
          <div><p>Tier</p><Badge tone={TIER_TONE[TIERS(customerModal.orders)]}>{TIERS(customerModal.orders)}</Badge></div>
        </div>
        <SectionHeader title="Order history" />
        <DataTable rows={customerOrders(customerModal).slice(0, 10)} columns={[
          { key: 'number', label: 'Order', render: (r) => <strong>{r.number}</strong> },
          { key: 'createdAt', label: 'Date', render: (r) => formatDate(r.createdAt) },
          { key: 'items', label: 'Items', render: (r) => r.items?.map((i) => i.name).join(', ') || '—' },
          { key: 'total', label: 'Total', render: (r) => <strong>{money(r.total)}</strong> },
          { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </div>}
    </Modal>
  </div>
}

// ─── 2. RoleManagementPage ──────────────────────────────────────────────────

const ROLE_PERM_KEYS = ['pos', 'kitchen', 'inventory', 'reports', 'customers', 'delivery', 'orders', 'menu', 'employees', 'recipes', 'stock-lists', 'ledger', 'roles', 'riders', 'waiter']
const ROLES_FOR_TYPE = {
  restaurant: ['Branch Manager', 'Cashier', 'Kitchen Staff', 'Waiter', 'Delivery Rider'],
  bakery: ['Branch Manager', 'Cashier', 'Kitchen Staff', 'Waiter', 'Delivery Rider'],
  pharmacy: ['Branch Manager', 'Cashier', 'Delivery Rider'],
  mart: ['Branch Manager', 'Cashier', 'Delivery Rider'],
  retail: ['Branch Manager', 'Cashier', 'Delivery Rider'],
}

export function RoleManagementPage() {
  const { data, activeRestaurant, updateCollection, notify, session, addUser, updateUser, deleteUser } = useApp()
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editUserModal, setEditUserModal] = useState(null)
  const [roles, setRoles] = useState(DEFAULT_ROLES.map((r) => ({ ...r, id: r.name })))
  const [editRole, setEditRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Cashier', branchId: '' })

  const businessType = activeRestaurant?.type || 'restaurant'
  const availableRoles = ROLES_FOR_TYPE[businessType] || ROLES_FOR_TYPE.restaurant
  const isBranchManager = session?.role === 'Branch Manager'
  const creatableRoles = isBranchManager ? availableRoles.filter((r) => r !== 'Branch Manager') : availableRoles

  const restaurantUsers = (data.users || []).filter((u) => u.restaurantId === activeRestaurant.id && u.role !== 'Restaurant Owner' && `${u.name} ${u.role}`.toLowerCase().includes(query.toLowerCase()))
  const branches = data.branches.filter((b) => b.restaurantId === activeRestaurant.id)

  const saveUser = (e) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.name) return
    const existing = (data.users || []).find((u) => u.email === form.email.trim().toLowerCase())
    if (existing) { notify('A user with this email already exists', 'warning'); return }
    addUser({ name: form.name, email: form.email.trim().toLowerCase(), password: form.password, role: form.role, restaurantId: activeRestaurant.id, branchId: form.branchId || null, permissions: null })
    setAddOpen(false)
    setForm({ name: '', email: '', password: '', role: 'Cashier', branchId: '' })
  }

  const toggleUserPermission = (user, perm) => {
    const perms = user.permissions ? { ...user.permissions } : Object.fromEntries(ROLE_PERM_KEYS.map((k) => [k, true]))
    perms[perm] = !perms[perm]
    updateUser(user.id, { permissions: perms })
    setEditUserModal((prev) => prev ? { ...prev, permissions: perms } : prev)
  }

  const deleteUserHandler = (userId) => {
    deleteUser(userId)
    setEditUserModal(null)
  }

  const togglePermission = (roleId, perm) => {
    setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, permissions: r.permissions.includes(perm) ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm] } : r))
  }

  return <div>
    <PageHeader eyebrow="TEAM MANAGEMENT" title="Roles & Users" description="Manage user accounts, roles and permissions."><Button onClick={() => setAddOpen(true)}><UserPlus size={16} /> Create user</Button></PageHeader>

    {/* Role Cards */}
    <div className="stat-grid five" style={{ '--cols': Math.min(availableRoles.length, 5), marginBottom: 20 }}>
      {roles.filter((r) => availableRoles.includes(r.name)).map((role) => {
        const Icon = role.icon
        const count = restaurantUsers.filter((u) => u.role === role.name).length
        return <Card key={role.id} className="stat-card" onClick={() => setEditRole(role)}>
          <div className="stat-icon tone-brand"><Icon size={19} /></div>
          <div><p>{role.name}</p><strong>{count}</strong><small>{role.permissions.length} permissions</small></div>
        </Card>
      })}
    </div>

    {/* Users Table */}
    <Card>
      <div className="table-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search users…" /></div>
      <DataTable rows={restaurantUsers} columns={[
        { key: 'name', label: 'User', render: (r) => <div><strong>{r.name}</strong><small className="block">{r.email}</small></div> },
        { key: 'role', label: 'Role', render: (r) => <Badge tone="info">{r.role}</Badge> },
        { key: 'branchId', label: 'Branch', render: (r) => branches.find((b) => b.id === r.branchId)?.name || 'All branches' },
        { key: 'permissions', label: 'Permissions', render: (r) => r.permissions ? `${Object.values(r.permissions).filter(Boolean).length} active` : 'Default' },
        { key: 'actions', label: '', render: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditUserModal(r) }}>Manage</Button> },
      ]} onRowClick={setEditUserModal} />
    </Card>

    {/* Role Permissions Modal */}
    <Modal open={!!editRole} onClose={() => setEditRole(null)} title={`${editRole?.name} Permissions`} description="Toggle access for this role" size="lg">
      {editRole && <div className="feature-grid">
        {PERMISSIONS.map((perm) => <label key={perm}>
          <span><strong>{perm}</strong><small>{editRole.permissions.includes(perm) ? 'Granted' : 'Denied'}</small></span>
          <input type="checkbox" checked={editRole.permissions.includes(perm)} onChange={() => { togglePermission(editRole.id, perm); setEditRole((prev) => ({ ...prev, permissions: prev.permissions.includes(perm) ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm] })) }} />
        </label>)}
        <div className="form-actions"><Button onClick={() => { notify('Permissions saved'); setEditRole(null) }}>Save permissions</Button></div>
      </div>}
    </Modal>

    {/* Create User Modal */}
    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create user account" description="New user will be able to sign in with these credentials.">
      <form onSubmit={saveUser} className="form-grid">
        <Field label="Full name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email" required><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@business.pk" /></Field>
        <Field label="Password" required><Input required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" /></Field>
        <Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{creatableRoles.map((r) => <option key={r} value={r}>{r}</option>)}</Select></Field>
        <Field label="Branch"><Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}><option value="">All branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit">Create user</Button></div>
      </form>
    </Modal>

    {/* Edit User / Permissions Modal */}
    <Modal open={!!editUserModal} onClose={() => setEditUserModal(null)} title={`${editUserModal?.name}`} description={`${editUserModal?.role} · ${editUserModal?.email}`} size="lg">
      {editUserModal && <div>
        <SectionHeader title="Permission toggles" description="Control what this user can access" />
        <div className="feature-grid">
          {ROLE_PERM_KEYS.map((perm) => {
            const active = editUserModal.permissions ? editUserModal.permissions[perm] : true
            const formatPerm = (k) => k.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
            return <label key={perm}>
              <span><strong>{formatPerm(perm)}</strong><small>{active ? 'Enabled' : 'Disabled'}</small></span>
              <input type="checkbox" checked={!!active} onChange={() => toggleUserPermission(editUserModal, perm)} />
            </label>
          })}
        </div>
        <div className="form-actions" style={{ marginTop: 16, justifyContent: 'space-between' }}>
          <Button variant="ghost" style={{ color: 'var(--error, #ef4444)' }} onClick={() => deleteUser(editUserModal.id)}>Remove user</Button>
          <Button onClick={() => setEditUserModal(null)}>Done</Button>
        </div>
      </div>}
    </Modal>
  </div>
}

// ─── 3. EnhancedSuperAdminDashboard ─────────────────────────────────────────

export function EnhancedSuperAdminDashboard() {
  const { data, updateRestaurant, updateCollection, notify, addUser } = useApp()
  const [businessType, setBusinessType] = useState('All')
  const [detailRestaurant, setDetailRestaurant] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [managerForm, setManagerForm] = useState({ name: '', email: '', password: '', branchId: '' })
  const [featureMatrix, setFeatureMatrix] = useState(false)
  const [subsTab, setSubsTab] = useState('Active')

  const restaurants = data.restaurants.filter((r) => businessType === 'All' || (r.type || 'restaurant') === businessType.toLowerCase())
  const active = restaurants.filter((r) => r.status === 'Active').length
  const revenue = restaurants.reduce((s, r) => s + r.monthlySales, 0)
  const todayOrders = data.orders.filter((o) => o.createdAt?.includes(today()))
  const trend = [
    { month: 'Mar', revenue: 14.2, orders: 18 }, { month: 'Apr', revenue: 16.8, orders: 21 },
    { month: 'May', revenue: 15.9, orders: 24 }, { month: 'Jun', revenue: 21.4, orders: 29 },
    { month: 'Jul', revenue: 25.7, orders: 34 }, { month: 'Aug', revenue: 29.2, orders: 39 },
  ]

  const assignManager = (e) => {
    e.preventDefault()
    updateCollection('employees', (items) => [{ id: `emp${Date.now()}`, restaurantId: assignModal.id, name: managerForm.name, email: managerForm.email, role: 'Branch Manager', branchId: managerForm.branchId, status: 'Active', lastActive: today() }, ...items])
    addUser({ id: `u${Date.now()}`, restaurantId: assignModal.id, name: managerForm.name, email: managerForm.email, password: managerForm.password || 'orbit123', role: 'Branch Manager', branchId: managerForm.branchId || null })
    notify(`Manager assigned to ${assignModal.name}`)
    setAssignModal(null)
    setManagerForm({ name: '', email: '', password: '', branchId: '' })
  }

  return <div>
    <PageHeader eyebrow="PLATFORM OVERVIEW" title="Super Admin Dashboard" description="Complete platform management with business intelligence."><Button onClick={() => setFeatureMatrix(true)}><Settings size={16} /> Feature Matrix</Button></PageHeader>

    {/* Business Type Filter */}
    <div style={{ marginBottom: 16 }}><Tabs items={BUSINESS_TYPES} active={businessType} onChange={setBusinessType} /></div>

    {/* Stats */}
    <div className="stat-grid four">
      <StatCard label="Monthly platform volume" value={money(revenue)} change="+12.8% vs last month" icon={TrendingUp} />
      <StatCard label="Active restaurants" value={`${active} of ${restaurants.length}`} change="+1 this month" icon={Store} tone="blue" />
      <StatCard label="Orders today" value={todayOrders.length || 1842} change="+8.4% vs yesterday" icon={Activity} tone="violet" />
      <StatCard label="Active users" value="1,284" change="76 online now" icon={Users} tone="amber" />
    </div>

    {/* Charts */}
    <div className="dashboard-grid">
      <Card className="chart-card wide">
        <SectionHeader title="Platform revenue" description="Gross merchandise value across all restaurants"><Tabs items={['6 months', '12 months']} active="6 months" onChange={() => {}} /></SectionHeader>
        <div className="chart-value"><strong>PKR 29.2M</strong><Badge tone="active">↑ 13.6%</Badge></div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trend}><defs><linearGradient id="superAreaEnh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={.25} /><stop offset="100%" stopColor="#0f766e" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis hide /><Tooltip formatter={(v) => [`PKR ${v}M`, 'Revenue']} /><Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2.5} fill="url(#superAreaEnh)" /></AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card className="chart-card">
        <SectionHeader title="Restaurant status" description="Portfolio health" />
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={[{ name: 'Active', value: active }, { name: 'Trial', value: restaurants.filter((r) => r.status === 'Trial').length || 1 }, { name: 'Suspended', value: restaurants.filter((r) => r.status === 'Suspended').length || 1 }]} innerRadius={58} outerRadius={78} dataKey="value" paddingAngle={5}>{['#0f766e', '#f59e0b', '#ef4444'].map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip /></PieChart>
        </ResponsiveContainer>
        <div className="legend-row"><span><i className="dot green" />Active {active}</span><span><i className="dot amber" />Trial</span><span><i className="dot red" />Suspended</span></div>
      </Card>
    </div>

    {/* Manager Assignment */}
    <Card>
      <SectionHeader title="Manager assignments" description="Assign and transfer branch managers" />
      <DataTable rows={restaurants} columns={[
        { key: 'name', label: 'Business', render: (r) => <div className="entity-cell"><span style={{ background: r.branding?.primary || '#0f766e' }}>{r.branding?.mark || r.name.slice(0, 2).toUpperCase()}</span><div><strong>{r.name}</strong><small>{r.city}</small></div></div> },
        { key: 'manager', label: 'Manager', render: (r) => { const mgr = data.employees.find((e) => e.restaurantId === r.id && e.role === 'Branch Manager'); return mgr ? <strong>{mgr.name}</strong> : <span style={{ color: 'var(--muted)' }}>Unassigned</span> } },
        { key: 'branches', label: 'Branches', render: (r) => data.branches.filter((b) => b.restaurantId === r.id).length },
        { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        { key: 'action', label: '', render: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAssignModal(r) }}>Assign Manager</Button> },
      ]} onRowClick={setDetailRestaurant} />
    </Card>

    {/* Subscription Management */}
    <Card>
      <SectionHeader title="Subscriptions" description="Active plans and renewal tracking"><Tabs items={['Active', 'Expiring', 'All']} active={subsTab} onChange={setSubsTab} /></SectionHeader>
      <DataTable rows={restaurants.filter((r) => subsTab === 'All' || (subsTab === 'Active' && r.status === 'Active') || (subsTab === 'Expiring' && r.status === 'Trial'))} columns={[
        { key: 'name', label: 'Restaurant', render: (r) => <strong>{r.name}</strong> },
        { key: 'plan', label: 'Plan', render: (r) => <Badge tone="info">{r.plan}</Badge> },
        { key: 'monthlySales', label: 'Revenue', render: (r) => <strong>{money(r.monthlySales)}</strong> },
        { key: 'renewal', label: 'Renewal', render: () => formatDate(`2026-09-${Math.floor(Math.random() * 28 + 1).toString().padStart(2, '0')}`) },
        { key: 'actions', label: '', render: (r) => <div style={{ display: 'flex', gap: 6 }}><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateRestaurant(r.id, { plan: 'Enterprise' }) }}>Upgrade</Button></div> },
      ]} />
    </Card>

    {/* Restaurant Detail Drawer */}
    <Drawer open={!!detailRestaurant} onClose={() => setDetailRestaurant(null)} title={detailRestaurant?.name || ''}>
      {detailRestaurant && <div>
        <div className="mini-stats">
          <div><strong>{money(detailRestaurant.monthlySales)}</strong><span>Monthly sales</span></div>
          <div><strong>{data.orders.filter((o) => o.restaurantId === detailRestaurant.id && o.createdAt?.includes(today())).length}</strong><span>Active orders</span></div>
          <div><strong>{pct(data.inventory.filter((i) => i.stock > 0).length, data.inventory.length)}</strong><span>In stock</span></div>
          <div><strong>{data.employees.filter((e) => e.restaurantId === detailRestaurant.id).length}</strong><span>Employees</span></div>
        </div>
        <SectionHeader title="Features" />
        {detailRestaurant.features && <div className="feature-grid">{Object.entries(detailRestaurant.features).map(([k, v]) => <label key={k}><span><strong>{k}</strong><small>{v ? 'Enabled' : 'Disabled'}</small></span><input type="checkbox" checked={v} readOnly /></label>)}</div>}
      </div>}
    </Drawer>

    {/* Assign Manager Modal */}
    <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign manager to ${assignModal?.name}`} description="Create or select a manager for this restaurant.">
      {assignModal && <form onSubmit={assignManager} className="form-grid">
        <Field label="Manager name" required><Input required value={managerForm.name} onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })} /></Field>
        <Field label="Email" required><Input type="email" required value={managerForm.email} onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })} /></Field>
        <Field label="Password"><Input value={managerForm.password} onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })} placeholder="Default: orbit123" /></Field>
        <Field label="Branch"><Select value={managerForm.branchId} onChange={(e) => setManagerForm({ ...managerForm, branchId: e.target.value })}><option value="">All branches</option>{data.branches.filter((b) => b.restaurantId === assignModal.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setAssignModal(null)}>Cancel</Button><Button type="submit">Assign manager</Button></div>
      </form>}
    </Modal>

    {/* Feature Toggle Matrix Modal */}
    <Modal open={featureMatrix} onClose={() => setFeatureMatrix(false)} title="Feature Toggle Matrix" description="Enable or disable sellable modules and features per business." size="xxl">
      <FeatureToggleMatrix
        businesses={data.restaurants}
        typeFilter={businessType}
        onTypeFilter={setBusinessType}
        onToggle={(id, key) => {
          const row = data.restaurants.find((item) => item.id === id)
          if (!row) return
          updateRestaurant(id, { features: { ...row.features, [key]: !row.features?.[key] } })
        }}
      />
    </Modal>
  </div>
}

// ─── 4. KitchenOrderProgressPage ────────────────────────────────────────────

export function KitchenOrderProgressPage() {
  const { data, updateOrder, activeRestaurant, notify } = useApp()
  const [view, setView] = useState('Pipeline')
  const [station, setStation] = useState('All')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [itemStatus, setItemStatus] = useState({})

  const allOrders = data.orders.filter((o) => o.restaurantId === activeRestaurant.id)
  const activeOrders = useMemo(() => filterKitchenPipeline(data.orders, activeRestaurant.id), [data.orders, activeRestaurant.id])
  const selectedOrder = selectedOrderId ? data.orders.find((o) => o.id === selectedOrderId) ?? null : null

  const completedToday = allOrders.filter((o) => o.status === 'Completed' && o.createdAt?.includes(today())).length
  const avgPrep = 14
  const longestWait = 28
  const efficiency = completedToday ? Math.min(92, Math.round(completedToday / (completedToday + activeOrders.length) * 100)) : 85

  const getTimeColor = (minutes) => minutes > 20 ? 'tone-red' : minutes > 12 ? 'tone-amber' : 'tone-brand'
  const randomMinutes = (i) => 4 + (i * 3) % 25

  const advanceOrder = (order) => {
    const next = getNextOrderStatus(order)
    if (!next) return
    updateOrder(order.id, { status: next, isNew: false })
    notify(`${order.number} moved to ${next}`)
  }

  const moveOrderToStage = (orderId, _fromStage, toStage) => {
    const order = data.orders.find((o) => o.id === orderId)
    if (!order) return
    const nextStatus = statusForKitchenStage(toStage)
    if (order.status === nextStatus) return
    updateOrder(orderId, { status: nextStatus, isNew: false })
    notify(`${order.number} moved to ${nextStatus}`)
  }

  const markItemPrepared = (orderId, itemId) => {
    setItemStatus((prev) => ({ ...prev, [`${orderId}-${itemId}`]: true }))
  }

  // Station grouping
  const stationOrders = useMemo(() => {
    const map = {}
    STATIONS.forEach((s) => { map[s] = [] })
    activeOrders.filter((o) => KITCHEN_QUEUE_STATUSES.includes(o.status)).forEach((o, i) => {
      const s = STATIONS[i % STATIONS.length]
      map[s].push(o)
    })
    return map
  }, [activeOrders])

  return <div className="kds-page">
    <PageHeader eyebrow="KITCHEN OPERATIONS" title="Order Progress" description="Track and manage order preparation pipeline.">
      <Tabs items={['Pipeline', 'Station']} active={view} onChange={setView} />
    </PageHeader>

    {/* Stats Bar */}
    <div className="stat-grid four">
      <StatCard label="Avg prep time" value={`${avgPrep}m`} change="Target: 15m" icon={Clock3} />
      <StatCard label="Completed today" value={completedToday || 42} change="Target: 50" icon={ChefHat} tone="blue" />
      <StatCard label="Longest wait" value={`${longestWait}m`} change={longestWait > 20 ? 'Over threshold' : 'Within target'} icon={AlertTriangle} tone={longestWait > 20 ? 'red' : 'amber'} />
      <StatCard label="Efficiency score" value={`${efficiency}%`} change="Completed within target" icon={Zap} tone="violet" />
    </div>

    {view === 'Pipeline' ? (
      <KanbanBoard
        emptyLabel="No orders"
        onMoveItem={moveOrderToStage}
        columns={KITCHEN_PIPELINE_STAGES.map((stage) => ({
          id: stage.key,
          title: stage.key,
          tone: stage.key === 'Received' ? 'new' : stage.key === 'Preparing' ? 'preparing' : stage.key === 'Ready' ? 'ready' : 'out-for-delivery',
          items: ordersInKitchenStage(activeOrders, stage),
        }))}
        renderCard={(order, column) => {
          const idx = column.items.indexOf(order)
          const minutes = randomMinutes(idx)
          const timeClass = getTimeColor(minutes)
          const actionLabel = getKitchenStageActionLabel(order)
          return (
            <Card className={`kitchen-ticket ${minutes > 20 ? 'priority' : ''}`} onClick={() => setSelectedOrderId(order.id)}>
              <header>
                <strong>{order.number}</strong>
                <Badge>{order.type}</Badge>
                <span className={timeClass}><Clock3 size={14} />{minutes}m</span>
              </header>
              <div>{order.items?.map((item) => <div key={item.id}><b>{item.quantity}×</b><span><strong>{item.name}</strong>{item.modifiers?.map((m) => <small key={m.name}>+ {m.name}</small>)}</span></div>)}</div>
              <footer>
                <span>
                  {column.id === 'Received' && <><Printer size={13} style={{ color: 'var(--muted)' }} /> Kitchen print</>}
                  {column.id === 'Ready' && <><Printer size={13} style={{ color: 'var(--muted)' }} /> Cashier print</>}
                  {column.id === 'Out for Delivery' && <><Printer size={13} style={{ color: 'var(--muted)' }} /> Delivery slip</>}
                  {!['Received', 'Ready', 'Out for Delivery'].includes(column.id) && (order.type === 'Dine-in' ? 'Table T04' : order.customer)}
                </span>
                {actionLabel && (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); advanceOrder(order) }}>{actionLabel}</Button>
                )}
              </footer>
            </Card>
          )
        }}
      />
    ) : (
      <div>
        <div style={{ marginBottom: 12 }}><Tabs items={['All', ...STATIONS]} active={station} onChange={setStation} /></div>
        <div className="kds-board">
          {(station === 'All' ? STATIONS : [station]).map((s) => <section key={s}>
            <header><div><span className="kds-dot preparing" /><h2>{s}</h2></div><Badge tone="info">{stationOrders[s]?.length || 0}</Badge></header>
            {(stationOrders[s] || []).map((order, idx) => <Card key={order.id} className="kitchen-ticket">
              <header><strong>{order.number}</strong><Badge>{order.type}</Badge><span><Clock3 size={14} />{randomMinutes(idx)}m</span></header>
              <div>{order.items?.map((item) => <div key={item.id}><b>{item.quantity}×</b><span><strong>{item.name}</strong></span></div>)}</div>
              <footer><span>{order.customer}</span><Button size="sm" onClick={() => advanceOrder(order)}>{getOrderActionLabel(order) || 'Mark ready'}</Button></footer>
            </Card>)}
          </section>)}
        </div>
      </div>
    )}

    {/* Order Detail Modal */}
    <Modal open={!!selectedOrder} onClose={() => setSelectedOrderId(null)} title={`Order ${selectedOrder?.number}`} description={`${selectedOrder?.type} · ${selectedOrder?.customer}`} size="lg">
      {selectedOrder && <div className="order-detail">
        <div className="order-customer"><span><Users size={18} /></span><div><strong>{selectedOrder.customer}</strong><small>{selectedOrder.payment} · {selectedOrder.type}{selectedOrder.phone ? ` · ${selectedOrder.phone}` : ''}</small></div><Badge>{selectedOrder.status}</Badge></div>
        {selectedOrder.notes && <Card style={{ marginBottom: 12, padding: 12, background: 'var(--surface-alt, #f8fafc)' }}><strong>Special instructions:</strong> {selectedOrder.notes}</Card>}
        <div className="receipt-lines">
          {selectedOrder.items?.map((item) => <div key={item.id}>
            <span>
              {item.quantity} × {item.name}
              {item.modifiers?.map((m) => <small key={m.name} style={{ display: 'block', color: 'var(--muted)' }}>+ {m.name}</small>)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{money(item.price * item.quantity)}</strong>
              <Button size="sm" variant={itemStatus[`${selectedOrder.id}-${item.id}`] ? 'primary' : 'outline'} onClick={() => markItemPrepared(selectedOrder.id, item.id)}>
                {itemStatus[`${selectedOrder.id}-${item.id}`] ? '✓ Done' : 'Mark done'}
              </Button>
            </div>
          </div>)}
          <div className="total"><span>Total</span><strong>{money(selectedOrder.total)}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {getOrderActionLabel(selectedOrder) && (
            <Button onClick={() => advanceOrder(selectedOrder)}>{getOrderActionLabel(selectedOrder)}</Button>
          )}
        </div>
      </div>}
    </Modal>
  </div>
}

// ─── 5. CustomerManagementPage ──────────────────────────────────────────────

export function CustomerManagementPage() {
  const { data, activeRestaurant, updateCollection, notify } = useApp()
  const [tab, setTab] = useState('All Customers')
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [addressModal, setAddressModal] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', area: '', notes: '' })
  const [addrForm, setAddrForm] = useState({ address: '', area: '', label: 'Home' })

  const allCustomers = data.customers.filter((c) => c.restaurantId === activeRestaurant.id)
  const customers = useMemo(() => {
    let list = allCustomers
    if (tab === 'Recurring') list = list.filter((c) => c.orders >= 3)
    else if (tab === 'New') list = list.filter((c) => c.orders <= 1)
    else if (tab === 'VIP') list = list.filter((c) => c.orders >= 10)
    if (query) list = list.filter((c) => `${c.name} ${c.phone} ${c.email || ''}`.toLowerCase().includes(query.toLowerCase()))
    return list
  }, [allCustomers, tab, query])

  const allOrders = data.orders.filter((o) => o.restaurantId === activeRestaurant.id)
  const customerOrders = (c) => allOrders.filter((o) => o.customer === c.name || o.phone === c.phone)
  const newThisMonth = allCustomers.filter((c) => c.lastOrder?.startsWith('2026-08')).length
  const recurringRate = allCustomers.length ? ((allCustomers.filter((c) => c.orders >= 3).length / allCustomers.length) * 100).toFixed(1) : 0
  const avgLifetime = allCustomers.length ? Math.round(allCustomers.reduce((s, c) => s + c.spent, 0) / allCustomers.length) : 0

  const favoriteItems = (c) => {
    const freq = {}
    customerOrders(c).forEach((o) => o.items?.forEach((i) => { freq[i.name] = (freq[i.name] || 0) + i.quantity }))
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n).join(', ') || '—'
  }

  const saveCustomer = (e) => {
    e.preventDefault()
    updateCollection('customers', (items) => [{
      ...form, id: `cu${Date.now()}`, restaurantId: activeRestaurant.id, orders: 0, spent: 0, points: 0, lastOrder: '', status: 'Active',
      addresses: form.address ? [{ address: form.address, area: form.area, label: 'Home' }] : [],
    }, ...items])
    notify('Customer added')
    setAddOpen(false)
    setForm({ name: '', phone: '', email: '', address: '', area: '', notes: '' })
  }

  const addAddress = (e) => {
    e.preventDefault()
    if (detailCustomer) {
      updateCollection('customers', (items) => items.map((c) => c.id === detailCustomer.id ? { ...c, addresses: [...(c.addresses || []), { ...addrForm, id: `a${Date.now()}` }] } : c))
      setDetailCustomer((prev) => ({ ...prev, addresses: [...(prev.addresses || []), { ...addrForm, id: `a${Date.now()}` }] }))
      notify('Address added')
      setAddressModal(false)
      setAddrForm({ address: '', area: '', label: 'Home' })
    }
  }

  return <div>
    <PageHeader eyebrow="CUSTOMER RELATIONSHIPS" title="Customer Records" description={`${allCustomers.length} customers for ${activeRestaurant.name}`}><Button onClick={() => setAddOpen(true)}><UserPlus size={16} /> Add customer</Button></PageHeader>

    {/* Insights */}
    <div className="stat-grid four">
      <StatCard label="Total customers" value={allCustomers.length} icon={Users} />
      <StatCard label="New this month" value={newThisMonth} icon={UserPlus} tone="blue" />
      <StatCard label="Recurring rate" value={`${recurringRate}%`} icon={RefreshCw} tone="violet" />
      <StatCard label="Avg lifetime value" value={money(avgLifetime)} icon={CircleDollarSign} tone="amber" />
    </div>

    <Card>
      <div className="table-toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by name or phone…" />
        <Tabs items={['All Customers', 'Recurring', 'New', 'VIP']} active={tab} onChange={setTab} />
      </div>
      <DataTable rows={customers} columns={[
        { key: 'name', label: 'Customer', render: (r) => <div><strong>{r.name}</strong><small className="block">{r.phone}</small></div> },
        { key: 'email', label: 'Email', render: (r) => r.email || '—' },
        { key: 'orders', label: 'Orders', render: (r) => <strong>{r.orders}</strong> },
        { key: 'spent', label: 'Total spent', render: (r) => <strong>{money(r.spent)}</strong> },
        { key: 'lastOrder', label: 'Last order', render: (r) => formatDate(r.lastOrder) },
        { key: 'tier', label: 'Tier', render: (r) => <Badge tone={TIER_TONE[TIERS(r.orders)]}>{TIERS(r.orders)}</Badge> },
        { key: 'address', label: 'Address', render: (r) => (r.addresses || [])[0]?.address || r.address || '—' },
      ]} onRowClick={setDetailCustomer} />
    </Card>

    {/* Customer Detail Modal */}
    <Modal open={!!detailCustomer} onClose={() => setDetailCustomer(null)} title={detailCustomer?.name || 'Customer'} description={detailCustomer?.phone} size="xl">
      {detailCustomer && <div>
        <div className="stat-grid four" style={{ marginBottom: 16 }}>
          <div><p>Total orders</p><strong>{detailCustomer.orders}</strong></div>
          <div><p>Total spent</p><strong>{money(detailCustomer.spent)}</strong></div>
          <div><p>Points</p><strong>{detailCustomer.points}</strong></div>
          <div><p>Tier</p><Badge tone={TIER_TONE[TIERS(detailCustomer.orders)]}>{TIERS(detailCustomer.orders)}</Badge></div>
        </div>

        <SectionHeader title="Profile" />
        <dl className="detail-list">
          <div><dt>Name</dt><dd>{detailCustomer.name}</dd></div>
          <div><dt>Phone</dt><dd>{detailCustomer.phone}</dd></div>
          <div><dt>Email</dt><dd>{detailCustomer.email || '—'}</dd></div>
          <div><dt>Favorites</dt><dd>{favoriteItems(detailCustomer)}</dd></div>
          <div><dt>Avg order</dt><dd>{detailCustomer.orders ? money(Math.round(detailCustomer.spent / detailCustomer.orders)) : '—'}</dd></div>
        </dl>

        <SectionHeader title="Delivery addresses"><Button size="sm" variant="outline" onClick={() => setAddressModal(true)}><Plus size={14} /> Add address</Button></SectionHeader>
        {(detailCustomer.addresses || []).length ? <div>{(detailCustomer.addresses || []).map((a, i) => <div key={a.id || i} className="operation-metric">
          <span className="tone-blue"><MapPin size={18} /></span>
          <div><strong>{a.label || 'Address'}</strong><small>{a.address}{a.area ? ` · ${a.area}` : ''}</small></div>
        </div>)}</div> : <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 16 }}>No delivery addresses saved.</p>}

        <SectionHeader title="Order history" />
        <DataTable rows={customerOrders(detailCustomer).slice(0, 15)} columns={[
          { key: 'number', label: 'Order', render: (r) => <strong>{r.number}</strong> },
          { key: 'createdAt', label: 'Date', render: (r) => formatDate(r.createdAt) },
          { key: 'items', label: 'Items', render: (r) => r.items?.map((i) => i.name).join(', ').slice(0, 60) || '—' },
          { key: 'total', label: 'Total', render: (r) => <strong>{money(r.total)}</strong> },
          { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </div>}
    </Modal>

    {/* Add Address Sub-Modal */}
    <Modal open={addressModal} onClose={() => setAddressModal(false)} title="Add delivery address" description="Save a new address for this customer.">
      <form onSubmit={addAddress} className="form-grid">
        <Field label="Address" required className="span-2"><Input required value={addrForm.address} onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} placeholder="Full delivery address" /></Field>
        <Field label="Area"><Input value={addrForm.area} onChange={(e) => setAddrForm({ ...addrForm, area: e.target.value })} placeholder="e.g. Gulberg, DHA" /></Field>
        <Field label="Label"><Select value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}><option>Home</option><option>Office</option><option>Other</option></Select></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setAddressModal(false)}>Cancel</Button><Button type="submit">Save address</Button></div>
      </form>
    </Modal>

    {/* Add Customer Modal */}
    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add customer" description="Create a new customer record.">
      <form onSubmit={saveCustomer} className="form-grid">
        <Field label="Name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Phone" required><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX XXXXXXX" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Delivery address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Primary address" /></Field>
        <Field label="Area"><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Gulberg" /></Field>
        <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit">Add customer</Button></div>
      </form>
    </Modal>
  </div>
}
