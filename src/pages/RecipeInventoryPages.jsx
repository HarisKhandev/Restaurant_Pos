import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Barcode, BookOpen, CalendarClock, CheckCircle2, ChefHat, CircleDollarSign, ClipboardList, Clock3, CreditCard, Download, FileText, MapPin, Minus, Package, Percent, Plus, Printer, RotateCcw, ScanLine, Send, Settings, ShoppingCart, Star, Truck, User, Users, UtensilsCrossed, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, SearchBox, SectionHeader, Select, StatCard, Tabs, money } from '../components/ui'
import { getBranchRiders } from '../utils/staffResolver'
import { calcMaxServings } from '../utils/inventoryRecipe'
import { getBusinessLabels, getRecipeCategoryTabs, matchesRecipeCategoryTab } from '../utils/businessConfig'

// ─── 1. RecipesPage ───────────────────────────────────────────────────────────

export function RecipesPage() {
  const { data, updateCollection, activeRestaurant, notify } = useApp()
  const businessType = activeRestaurant.type || 'restaurant'
  const labels = getBusinessLabels(businessType)
  const categoryTabs = getRecipeCategoryTabs(businessType)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('All')
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ productId: '', ingredients: [{ inventoryId: '', quantity: '' }] })

  const recipes = (data.recipes || []).filter(r => r.restaurantId === activeRestaurant.id)
  const products = data.products.filter(p => p.restaurantId === activeRestaurant.id)
  const inventory = (data.inventory || []).filter(i => i.restaurantId === activeRestaurant.id)

  const enriched = recipes.map(r => {
    const product = products.find(p => p.id === r.productId) || {}
    const ingredients = (r.ingredients || []).map(ing => {
      const item = inventory.find(i => i.id === ing.inventoryId) || {}
      return { ...ing, name: item.name || ing.name || 'Unknown', unit: item.unit || ing.unit || '', costPerUnit: item.cost || 0, lineCost: (item.cost || 0) * (ing.quantity || 0), stockAvailable: item.stock ?? 0 }
    })
    const totalCost = ingredients.reduce((s, i) => s + i.lineCost, 0)
    const maxServings = calcMaxServings(r.ingredients, inventory)
    return { ...r, productName: product.name || r.name || 'Unlinked', category: product.category || '', sellingPrice: product.price || 0, ingredients, totalCost, ingredientCount: ingredients.length, maxServings }
  })

  const filtered = enriched.filter((r) => matchesRecipeCategoryTab(r.category, tab, businessType) && r.productName.toLowerCase().includes(query.toLowerCase()))

  const columns = [
    { key: 'productName', label: 'Product', render: r => <strong>{r.productName}</strong> },
    { key: 'ingredientCount', label: 'Ingredients', render: r => <Badge tone="info">{r.ingredientCount}</Badge> },
    { key: 'maxServings', label: 'Can make', render: r => <Badge tone={r.maxServings === 0 ? 'out-of-stock' : r.maxServings < 10 ? 'warning' : 'active'}>{r.maxServings} units</Badge> },
    { key: 'totalCost', label: 'Recipe cost', render: r => money(r.totalCost) },
    { key: 'category', label: 'Category', render: r => <Badge>{r.category || 'General'}</Badge> },
    { key: 'margin', label: 'Margin', render: r => { const m = r.sellingPrice - r.totalCost; return <Badge tone={m > 0 ? 'active' : 'warning'}>{money(m)}</Badge> } },
  ]

  const addIngredientRow = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { inventoryId: '', quantity: '' }] }))
  const removeIngredientRow = (idx) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))
  const updateIngredient = (idx, key, val) => setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [key]: val } : ing) }))

  const save = (e) => {
    e.preventDefault()
    if (!form.productId || form.ingredients.every(i => !i.inventoryId)) return
    const recipe = { id: `rec${Date.now().toString(36)}`, restaurantId: activeRestaurant.id, productId: form.productId, ingredients: form.ingredients.filter(i => i.inventoryId).map(i => ({ inventoryId: i.inventoryId, quantity: Number(i.quantity) || 0 })) }
    updateCollection('recipes', items => [recipe, ...(items || [])])
    notify('Recipe created')
    setOpen(false)
    setForm({ productId: '', ingredients: [{ inventoryId: '', quantity: '' }] })
  }

  return <div>
    <PageHeader eyebrow="RECIPE MANAGEMENT" title={`${labels.recipe}s`} description={`${recipes.length} ${labels.recipe.toLowerCase()}s · ${inventory.length} ${labels.inventoryItem.toLowerCase()}s for ${activeRestaurant.name}`}><Button onClick={() => setOpen(true)}><Plus size={16} /> Add {labels.recipe.toLowerCase()}</Button></PageHeader>
    <Card>
      <div className="table-toolbar"><SearchBox value={query} onChange={setQuery} placeholder={`Search ${labels.recipe.toLowerCase()}s…`} /><Tabs items={categoryTabs} active={tab} onChange={setTab} /></div>
      <DataTable rows={filtered} columns={columns} onRowClick={setSelected} />
    </Card>

    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.productName} description="Recipe details & cost breakdown" size="lg">
      {selected && <div>
        <div className="stat-grid three" style={{ marginBottom: 16 }}>
          <StatCard label="Recipe cost" value={money(selected.totalCost)} icon={CircleDollarSign} />
          <StatCard label="Selling price" value={money(selected.sellingPrice)} icon={ShoppingCart} tone="blue" />
          <StatCard label="Margin" value={money(selected.sellingPrice - selected.totalCost)} icon={Percent} tone={selected.sellingPrice - selected.totalCost > 0 ? 'brand' : 'red'} />
        </div>
        <SectionHeader title="Ingredients" />
        <DataTable rows={selected.ingredients.map((ing, i) => ({ ...ing, id: i }))} columns={[
          { key: 'name', label: 'Item', render: r => <strong>{r.name}</strong> },
          { key: 'quantity', label: 'Qty per unit', render: r => r.quantity },
          { key: 'unit', label: 'Unit' },
          { key: 'stockAvailable', label: 'In stock', render: r => `${r.stockAvailable} ${r.unit}` },
          { key: 'costPerUnit', label: 'Cost/unit', render: r => money(r.costPerUnit) },
          { key: 'lineCost', label: 'Line cost', render: r => <strong>{money(r.lineCost)}</strong> },
        ]} />
      </div>}
    </Modal>

    <Modal open={open} onClose={() => setOpen(false)} title="Add recipe" description="Link a menu product to inventory ingredients." size="lg">
      <form onSubmit={save} className="form-grid">
        <Field label="Product" required className="span-2">
          <Select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}
          </Select>
        </Field>
        <div className="span-2">
          <SectionHeader title="Ingredients"><Button type="button" variant="outline" size="sm" onClick={addIngredientRow}><Plus size={14} /> Add row</Button></SectionHeader>
          {form.ingredients.map((ing, idx) => {
            const item = inventory.find(i => i.id === ing.inventoryId)
            return <div key={idx} className="ingredient-row" style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 8 }}>
              <Field label={idx === 0 ? 'Inventory item' : ''} style={{ flex: 2 }}>
                <Select value={ing.inventoryId} onChange={e => updateIngredient(idx, 'inventoryId', e.target.value)}>
                  <option value="">Select…</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit})</option>)}
                </Select>
              </Field>
              <Field label={idx === 0 ? 'Quantity' : ''} style={{ flex: 1 }}>
                <Input type="number" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} placeholder="0" />
              </Field>
              <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 40, paddingBottom: 8 }}>{item?.unit || ''}</span>
              <span style={{ fontSize: 11, minWidth: 70, paddingBottom: 8 }}>{item ? money(item.cost * (Number(ing.quantity) || 0)) : ''}</span>
              {form.ingredients.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredientRow(idx)}><Minus size={14} /></Button>}
            </div>
          })}
        </div>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save recipe</Button></div>
      </form>
    </Modal>
  </div>
}

// ─── 2. StockListPage ─────────────────────────────────────────────────────────

export function StockListPage() {
  const { data, updateCollection, activeRestaurant, notify, updateRestaurant } = useApp()
  const procurement = { autoGenerate: true, nearThresholdPercent: 0.2, notifications: 'email', ...(activeRestaurant.procurementSettings || {}) }
  const [tab, setTab] = useState('All')
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(procurement)
  const [form, setForm] = useState({ title: '', frequency: 'weekly', items: [] })

  const saveSettings = (changes) => {
    const next = { ...settings, ...changes }
    setSettings(next)
    updateRestaurant(activeRestaurant.id, { procurementSettings: next })
  }

  const inventory = (data.inventory || []).filter(i => i.restaurantId === activeRestaurant.id)
  const stockLists = (data.stockLists || []).filter(sl => sl.restaurantId === activeRestaurant.id)
  const autoPOs = (data.purchaseOrders || []).filter(po => po.restaurantId === activeRestaurant.id && po.autoGenerated && po.status === 'Draft')
  const lowStock = inventory.filter(i => i.stock <= i.minimum * (1 + (settings.nearThresholdPercent ?? 0.2)))

  const filtered = stockLists.filter(sl => tab === 'All' || sl.status === tab)

  const pendingCount = stockLists.filter(sl => sl.status === 'Pending').length
  const restockCost = lowStock.reduce((s, i) => s + (i.minimum - i.stock) * i.cost, 0)

  const columns = [
    { key: 'title', label: 'Title', render: r => <strong>{r.title}</strong> },
    { key: 'frequency', label: 'Frequency', render: r => <Badge tone="info">{r.frequency}</Badge> },
    { key: 'generatedAt', label: 'Last generated', render: r => r.generatedAt || '—' },
    { key: 'status', label: 'Status', render: r => <Badge tone={r.status === 'Completed' ? 'active' : r.status === 'Pending' ? 'warning' : 'info'}>{r.status}</Badge> },
    { key: 'itemCount', label: 'Items', render: r => (r.items || []).length },
    { key: 'total', label: 'Est. cost', render: r => money((r.items || []).reduce((s, i) => s + (i.cost || 0) * (i.requiredQty || 0), 0)) },
  ]

  const openCreate = () => {
    const items = lowStock.map(i => ({ inventoryId: i.id, name: i.name, currentStock: i.stock, minimum: i.minimum, deficit: i.minimum - i.stock, requiredQty: i.minimum - i.stock, cost: i.cost, unit: i.unit }))
    setForm({ title: `Stock List — ${new Date().toLocaleDateString()}`, frequency: 'weekly', items })
    setOpen(true)
  }

  const save = (e) => {
    e.preventDefault()
    const sl = { id: `sl${Date.now().toString(36)}`, restaurantId: activeRestaurant.id, ...form, status: 'Pending', generatedAt: new Date().toISOString().slice(0, 10) }
    updateCollection('stockLists', items => [sl, ...(items || [])])
    notify('Stock list created')
    setOpen(false)
  }

  const approvePO = () => {
    if (!selected) return
    updateCollection('stockLists', items => (items || []).map(sl => sl.id === selected.id ? { ...sl, status: 'Completed' } : sl))
    notify('Purchase order generated')
    setSelected(null)
  }

  return <div>
    <PageHeader eyebrow="PROCUREMENT" title="Stock Lists" description="Automated purchase lists based on inventory thresholds.">
      <Button variant="outline" onClick={() => window.location.href = `/restaurant/${activeRestaurant.id}/purchasing`}><ShoppingCart size={16} /> View auto POs ({autoPOs.length})</Button>
      <Button onClick={openCreate}><Plus size={16} /> Create stock list</Button>
    </PageHeader>

    <Card className="settings-inline" style={{ marginBottom: 16, padding: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Settings size={16} /> <strong style={{ fontSize: 12 }}>Auto-generate POs</strong></span>
      <label className="switch"><input type="checkbox" checked={settings.autoGenerate} onChange={() => saveSettings({ autoGenerate: !settings.autoGenerate })} /><i /></label>
      <Select value={settings.notifications} onChange={e => saveSettings({ notifications: e.target.value })} style={{ width: 130 }}><option value="email">Email</option><option value="push">Push</option><option value="none">None</option></Select>
      <Badge tone="info">{autoPOs.length} auto POs ready in Purchasing</Badge>
    </Card>

    <div className="stat-grid four">
      <StatCard label="Pending lists" value={pendingCount} icon={ClipboardList} />
      <StatCard label="Below threshold" value={lowStock.length} icon={AlertTriangle} tone="amber" />
      <StatCard label="Est. restock cost" value={money(restockCost)} icon={CircleDollarSign} tone="blue" />
      <StatCard label="Auto POs ready" value={autoPOs.length} icon={CalendarClock} tone="violet" />
    </div>

    <Card>
      <div className="table-toolbar"><Tabs items={['All', 'Pending', 'Generated', 'Completed']} active={tab} onChange={setTab} /></div>
      <DataTable rows={filtered} columns={columns} onRowClick={setSelected} />
    </Card>

    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} description={`Status: ${selected?.status}`} size="lg">
      {selected && <div>
        <DataTable rows={(selected.items || []).map((it, i) => ({ ...it, id: i }))} columns={[
          { key: 'name', label: 'Item', render: r => <strong>{r.name}</strong> },
          { key: 'currentStock', label: 'Current', render: r => `${r.currentStock} ${r.unit || ''}` },
          { key: 'minimum', label: 'Minimum', render: r => `${r.minimum} ${r.unit || ''}` },
          { key: 'deficit', label: 'Deficit', render: r => <Badge tone="warning">{r.deficit}</Badge> },
          { key: 'requiredQty', label: 'Order qty' },
          { key: 'cost', label: 'Est. cost', render: r => money((r.cost || 0) * (r.requiredQty || 0)) },
        ]} />
        {selected.status !== 'Completed' && <div className="form-actions" style={{ marginTop: 16 }}><Button onClick={approvePO}><CheckCircle2 size={16} /> Approve & Generate PO</Button></div>}
      </div>}
    </Modal>

    <Modal open={open} onClose={() => setOpen(false)} title="Create stock list" description="Auto-populated with items below minimum threshold." size="lg">
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Title" required><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Frequency"><Select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></Select></Field>
        </div>
        <SectionHeader title={`Items (${form.items.length})`} description="Adjust quantities as needed" />
        {form.items.map((item, idx) => <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <strong style={{ flex: 2, fontSize: 12 }}>{item.name}</strong>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Current: {item.currentStock} / Min: {item.minimum}</span>
          <Input type="number" style={{ width: 80 }} value={item.requiredQty} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, requiredQty: Number(e.target.value) } : it) }))} />
          <span style={{ fontSize: 11, minWidth: 70 }}>{money(item.cost * item.requiredQty)}</span>
        </div>)}
        <div className="form-actions" style={{ marginTop: 16 }}><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save stock list</Button></div>
      </form>
    </Modal>
  </div>
}

// ─── 3. LedgerPage ────────────────────────────────────────────────────────────

export function LedgerPage() {
  const { data, activeRestaurant } = useApp()
  const [tab, setTab] = useState('Daily Ledger')
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-08-19')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)

  const orders = data.orders.filter(o => o.restaurantId === activeRestaurant.id)
  const expenses = data.expenses || []

  const dayMap = {}
  orders.forEach(o => {
    const day = (o.createdAt || '').slice(0, 10)
    if (day < dateFrom || day > dateTo) return
    if (!dayMap[day]) dayMap[day] = { date: day, orders: [], totalSales: 0, totalExpenses: 0 }
    dayMap[day].orders.push(o)
    dayMap[day].totalSales += o.total || 0
  })
  expenses.forEach(ex => {
    const day = ex.date || ''
    if (dayMap[day]) dayMap[day].totalExpenses += ex.amount || 0
  })
  const days = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date))

  const weekMap = {}
  days.forEach(d => {
    const dt = new Date(d.date)
    const weekStart = new Date(dt); weekStart.setDate(dt.getDate() - dt.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    if (!weekMap[key]) weekMap[key] = { weekStart: key, days: [], totalRevenue: 0, totalExpenses: 0 }
    weekMap[key].days.push(d)
    weekMap[key].totalRevenue += d.totalSales
    weekMap[key].totalExpenses += d.totalExpenses
  })
  const weeks = Object.values(weekMap).sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  const monthMap = {}
  days.forEach(d => {
    const key = d.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { month: key, totalRevenue: 0, totalExpenses: 0, orders: 0, payments: {} }
    monthMap[key].totalRevenue += d.totalSales
    monthMap[key].totalExpenses += d.totalExpenses
    d.orders.forEach(o => {
      monthMap[key].orders++
      const pm = o.payment || 'Cash'
      monthMap[key].payments[pm] = (monthMap[key].payments[pm] || 0) + o.total
    })
  })
  const months = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month))

  const invoices = orders.map((o, i) => ({ ...o, invoiceNumber: `INV-${String(1001 + i).padStart(4, '0')}` }))

  let runningBalance = 0

  return <div>
    <PageHeader eyebrow="FINANCIAL RECORDS" title="Ledger & Invoices" description="Daily, weekly and monthly financial records."><Button variant="outline"><Download size={16} /> Export</Button></PageHeader>
    <div className="table-toolbar" style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
      <Tabs items={['Daily Ledger', 'Weekly Summary', 'Monthly Summary', 'Invoices']} active={tab} onChange={setTab} />
      <Field label="From"><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></Field>
      <Field label="To"><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></Field>
    </div>

    {tab === 'Daily Ledger' && <div>{days.length ? days.map(day => {
      runningBalance += day.totalSales - day.totalExpenses
      return <Card key={day.date} style={{ marginBottom: 12 }}>
        <SectionHeader title={day.date} description={`${day.orders.length} orders`}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span>Sales: <strong>{money(day.totalSales)}</strong></span>
            <span>Expenses: <strong>{money(day.totalExpenses)}</strong></span>
            <span>Net: <strong>{money(day.totalSales - day.totalExpenses)}</strong></span>
            <span>Balance: <strong>{money(runningBalance)}</strong></span>
          </div>
        </SectionHeader>
        <DataTable rows={day.orders} columns={[
          { key: 'number', label: 'Order', render: r => <strong>{r.number}</strong> },
          { key: 'customer', label: 'Customer' },
          { key: 'total', label: 'Amount', render: r => <strong>{money(r.total)}</strong> },
          { key: 'payment', label: 'Payment', render: r => <Badge tone="info">{r.payment}</Badge> },
          { key: 'createdAt', label: 'Time', render: r => (r.createdAt || '').slice(11, 16) },
        ]} />
      </Card>
    }) : <Card><p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No records for selected date range.</p></Card>}</div>}

    {tab === 'Weekly Summary' && <div>
      {weeks.map(week => <Card key={week.weekStart} style={{ marginBottom: 12 }} onClick={() => setSelectedWeek(selectedWeek === week.weekStart ? null : week.weekStart)}>
        <SectionHeader title={`Week of ${week.weekStart}`} description={`${week.days.length} days`}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span>Revenue: <strong>{money(week.totalRevenue)}</strong></span>
            <span>Expenses: <strong>{money(week.totalExpenses)}</strong></span>
            <Badge tone={week.totalRevenue - week.totalExpenses > 0 ? 'active' : 'warning'}>Net {money(week.totalRevenue - week.totalExpenses)}</Badge>
          </div>
        </SectionHeader>
        {selectedWeek === week.weekStart && <ResponsiveContainer width="100%" height={200}>
          <BarChart data={week.days.map(d => ({ day: d.date.slice(5), sales: d.totalSales, expenses: d.totalExpenses }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" />
            <YAxis hide />
            <Tooltip formatter={money} />
            <Bar dataKey="sales" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>}
      </Card>)}
    </div>}

    {tab === 'Monthly Summary' && <div>
      {months.map(m => {
        const paymentData = Object.entries(m.payments).map(([name, value]) => ({ name, value }))
        const colors = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#dc2626']
        return <Card key={m.month} style={{ marginBottom: 12 }}>
          <SectionHeader title={m.month} description={`${m.orders} orders`}>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span>Revenue: <strong>{money(m.totalRevenue)}</strong></span>
              <span>Expenses: <strong>{money(m.totalExpenses)}</strong></span>
              <Badge tone={m.totalRevenue - m.totalExpenses > 0 ? 'active' : 'warning'}>Net {money(m.totalRevenue - m.totalExpenses)}</Badge>
            </div>
          </SectionHeader>
          {paymentData.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart><Pie data={paymentData} innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">{paymentData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={money} /></PieChart>
            </ResponsiveContainer>
            <div className="legend-row" style={{ flexDirection: 'column', gap: 6 }}>{paymentData.map((p, i) => <span key={p.name}><i className="dot" style={{ background: colors[i % colors.length] }} />{p.name}: {money(p.value)}</span>)}</div>
          </div>}
        </Card>
      })}
    </div>}

    {tab === 'Invoices' && <Card>
      <DataTable rows={invoices} columns={[
        { key: 'invoiceNumber', label: 'Invoice #', render: r => <strong>{r.invoiceNumber}</strong> },
        { key: 'createdAt', label: 'Date', render: r => (r.createdAt || '').slice(0, 10) },
        { key: 'customer', label: 'Customer' },
        { key: 'items', label: 'Items', render: r => (r.items || []).length },
        { key: 'total', label: 'Amount', render: r => <strong>{money(r.total)}</strong> },
        { key: 'payment', label: 'Payment', render: r => <Badge tone="info">{r.payment}</Badge> },
        { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
      ]} onRowClick={setSelectedInvoice} />
    </Card>}

    <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice ${selectedInvoice?.invoiceNumber}`} description={selectedInvoice?.createdAt?.slice(0, 10)} size="lg">
      {selectedInvoice && <div className="order-detail">
        <div className="order-customer"><span><User size={18} /></span><div><strong>{selectedInvoice.customer}</strong><small>{selectedInvoice.payment} · {selectedInvoice.status}</small></div></div>
        <div className="receipt-lines">
          {(selectedInvoice.items || []).map(item => <div key={item.id}><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>)}
          <div><span>Tax</span><strong>{money(selectedInvoice.tax)}</strong></div>
          {selectedInvoice.discount > 0 && <div><span>Discount</span><strong>-{money(selectedInvoice.discount)}</strong></div>}
          <div className="total"><span>Total</span><strong>{money(selectedInvoice.total)}</strong></div>
        </div>
        <div className="form-actions"><Button variant="outline" onClick={() => window.print()}><Printer size={16} /> Print</Button><Button><Download size={16} /> Download</Button></div>
      </div>}
    </Modal>
  </div>
}

// ─── 4. BarcodeScanner ────────────────────────────────────────────────────────

export function BarcodeScanner({ onScan, products = [] }) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [flash, setFlash] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const lookup = (barcode) => {
    const trimmed = barcode.trim()
    if (!trimmed) return
    const found = products.find(p => p.sku === trimmed || p.barcode === trimmed || p.id === trimmed)
    if (found) {
      setResult({ found: true, product: found })
      setFlash('scan-found')
      onScan?.(found)
    } else {
      setResult({ found: false, code: trimmed })
      setFlash('scan-not-found')
    }
    setCode('')
    setTimeout(() => setFlash(''), 800)
  }

  const handleKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); lookup(code) } }

  return <Card className={`barcode-scanner ${flash}`} style={{ padding: 16 }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
      <ScanLine size={20} />
      <strong style={{ fontSize: 13 }}>Barcode Scanner</strong>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Input ref={inputRef} value={code} onChange={e => setCode(e.target.value)} onKeyDown={handleKey} placeholder="Scan or type barcode…" icon={Barcode} />
      <Button type="button" onClick={() => lookup(code)}>Lookup</Button>
    </div>
    {result && <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: result.found ? 'var(--green-bg, #dcfce7)' : 'var(--red-bg, #fee2e2)', fontSize: 12 }}>
      {result.found ? <span><CheckCircle2 size={14} style={{ verticalAlign: -2 }} /> <strong>{result.product.name}</strong> — {money(result.product.price)}</span>
        : <span><XCircle size={14} style={{ verticalAlign: -2 }} /> No product found for "{result.code}"</span>}
    </div>}
    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
      {result?.found ? `Last scanned: ${result.product.name}` : 'Ready to scan'}
    </div>
  </Card>
}

// ─── 5. AutoPrintPanel ────────────────────────────────────────────────────────

export function AutoPrintPanel({ order, restaurant, branch }) {
  const [destinations, setDestinations] = useState([
    { id: 'kitchen', label: 'Kitchen', autoPrint: true },
    { id: 'cashier', label: 'Cashier', autoPrint: true },
    { id: 'delivery', label: 'Delivery', autoPrint: false },
  ])
  const [printerSettings, setPrinterSettings] = useState({ printer: 'Default', paperSize: '80mm', includeLogo: true })

  const [queue] = useState(() => Array.from({ length: 10 }, (_, i) => ({
    id: `pj${i}`,
    orderNumber: `#${1030 + i}`,
    destination: ['Kitchen', 'Cashier', 'Delivery'][i % 3],
    time: `${12 + Math.floor(i / 3)}:${String((i * 7) % 60).padStart(2, '0')}`,
    status: i < 7 ? 'Printed' : i < 9 ? 'Pending' : 'Failed',
  })))

  const toggle = (id) => setDestinations(d => d.map(dest => dest.id === id ? { ...dest, autoPrint: !dest.autoPrint } : dest))

  return <Card style={{ padding: 16 }}>
    <SectionHeader title="Auto-Print Settings" description={restaurant?.name || 'Print management'} />

    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      {destinations.map(dest => <div key={dest.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
        <Printer size={16} />
        <strong>{dest.label}</strong>
        <label className="switch"><input type="checkbox" checked={dest.autoPrint} onChange={() => toggle(dest.id)} /><i /></label>
      </div>)}
    </div>

    <div className="form-grid" style={{ marginBottom: 16 }}>
      <Field label="Printer"><Select value={printerSettings.printer} onChange={e => setPrinterSettings(s => ({ ...s, printer: e.target.value }))}><option>Default</option><option>Epson TM-T20III</option><option>Star TSP143</option></Select></Field>
      <Field label="Paper size"><Select value={printerSettings.paperSize} onChange={e => setPrinterSettings(s => ({ ...s, paperSize: e.target.value }))}><option>80mm</option><option>58mm</option><option>A4</option></Select></Field>
      <Field label="Include logo"><label className="switch"><input type="checkbox" checked={printerSettings.includeLogo} onChange={() => setPrinterSettings(s => ({ ...s, includeLogo: !s.includeLogo }))} /><i /></label></Field>
    </div>

    <SectionHeader title="Print Queue" description="Recent print jobs"><Button size="sm" onClick={() => window.print()}><Printer size={14} /> Print now</Button></SectionHeader>
    <DataTable rows={queue} columns={[
      { key: 'orderNumber', label: 'Order', render: r => <strong>{r.orderNumber}</strong> },
      { key: 'destination', label: 'Destination', render: r => <Badge tone="info">{r.destination}</Badge> },
      { key: 'time', label: 'Time' },
      { key: 'status', label: 'Status', render: r => <Badge tone={r.status === 'Printed' ? 'active' : r.status === 'Pending' ? 'warning' : 'out-of-stock'}>{r.status}</Badge> },
    ]} />
  </Card>
}

// ─── 6. DeliveryManagementPage ────────────────────────────────────────────────

export function DeliveryManagementPage() {
  const { data, updateCollection, activeRestaurant, activeBranch, notify } = useApp()
  const [tab, setTab] = useState('Active Deliveries')
  const [assignModal, setAssignModal] = useState(null)
  const [selectedRider, setSelectedRider] = useState(null)
  const [routeModal, setRouteModal] = useState(false)
  const [routeForm, setRouteForm] = useState({ zone: '', areas: '', estimatedTime: 30, defaultRider: '' })
  const [settings, setSettings] = useState({ radius: 10, fee: 150, autoAssign: true, maxConcurrent: 3 })

  const riders = getBranchRiders(data, activeRestaurant.id, activeBranch?.id)
  const deliveryOrders = data.orders.filter(o => o.restaurantId === activeRestaurant.id && ['Delivery', 'Online'].includes(o.type))
  const routes = (data.routes || []).filter(r => r.restaurantId === activeRestaurant.id)

  const pendingPickup = deliveryOrders.filter(o => ['New', 'Confirmed', 'Ready'].includes(o.status))
  const inTransit = deliveryOrders.filter(o => o.status === 'Out for Delivery')
  const delivered = deliveryOrders.filter(o => o.status === 'Completed')

  const assignRider = (riderId) => {
    if (!assignModal) return
    updateCollection('orders', items => items.map(o => o.id === assignModal.id ? { ...o, riderId, status: 'Out for Delivery' } : o))
    notify('Rider assigned')
    setAssignModal(null)
  }

  const moveDeliveryOrder = (orderId, _fromColumn, toColumn) => {
    const nextStatus = statusForDeliveryColumn(toColumn)
    if (!nextStatus) return
    const order = deliveryOrders.find((o) => o.id === orderId)
    updateCollection('orders', (items) => items.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)))
    if (order) notify(`${order.number} moved to ${nextStatus}`)
  }

  const deliveryColumns = [
    { id: 'Pending Pickup', title: 'Pending Pickup', tone: 'ready', items: pendingPickup },
    { id: 'In Transit', title: 'In Transit', tone: 'out-for-delivery', items: inTransit },
    { id: 'Delivered', title: 'Delivered', tone: 'completed', items: delivered.slice(0, 10) },
  ]

  const saveRoute = (e) => {
    e.preventDefault()
    updateCollection('routes', items => [{ id: `rt${Date.now().toString(36)}`, restaurantId: activeRestaurant.id, ...routeForm }, ...(items || [])])
    notify('Route added')
    setRouteModal(false)
    setRouteForm({ zone: '', areas: '', estimatedTime: 30, defaultRider: '' })
  }

  const toggleRiderStatus = (rider) => {
    const statuses = ['Available', 'On Delivery', 'Off Duty']
    const next = statuses[(statuses.indexOf(rider.status) + 1) % statuses.length]
    updateCollection('riders', items => (items || []).map(r => r.id === rider.id ? { ...r, status: next } : r))
    notify(`${rider.name} marked ${next}`)
  }

  return <div>
    <PageHeader eyebrow="DELIVERY OPERATIONS" title="Delivery & Riders" description="Manage deliveries, riders and delivery zones." />
    <Tabs items={['Active Deliveries', 'Rider Dashboard', 'Routes', 'Settings']} active={tab} onChange={setTab} />

    {tab === 'Active Deliveries' && (
      <KanbanBoard
        className="delivery-kanban-board"
        style={{ marginTop: 16 }}
        emptyLabel="No deliveries"
        onMoveItem={moveDeliveryOrder}
        columns={deliveryColumns}
        renderCard={(order, column) => (
          <Card className="order-card">
            <div><strong>{order.number}</strong><Badge>{order.type}</Badge></div>
            <h4>{order.customer}</h4>
            {order.deliveryAddress && <small style={{ color: 'var(--muted)', fontSize: 10 }}><MapPin size={10} /> {order.deliveryAddress}</small>}
            {order.riderId && <small style={{ fontSize: 10 }}><User size={10} /> {riders.find(r => r.id === order.riderId)?.name || 'Assigned'}</small>}
            <footer>
              <strong>{money(order.total)}</strong>
              {column.id === 'Pending Pickup' && <Button size="sm" onClick={() => setAssignModal(order)}>Assign rider</Button>}
            </footer>
          </Card>
        )}
      />
    )}

    {tab === 'Rider Dashboard' && <div className="branch-grid" style={{ marginTop: 16 }}>
      {riders.length ? riders.map(rider => <Card key={rider.id} className="branch-card" onClick={() => setSelectedRider(rider)}>
        <header><span><User size={20} /></span><Badge tone={rider.status === 'Available' ? 'active' : rider.status === 'On Delivery' ? 'warning' : ''}>{rider.status}</Badge></header>
        <h2>{rider.name}</h2>
        <p>{rider.phone || ''}</p>
        <dl>
          <div><dt>Active orders</dt><dd>{deliveryOrders.filter(o => o.riderId === rider.id && o.status === 'Out for Delivery').length}</dd></div>
          <div><dt>Completed today</dt><dd>{rider.completedToday || 0}</dd></div>
          <div><dt>Rating</dt><dd><Star size={12} style={{ verticalAlign: -1 }} /> {rider.rating || '4.5'}</dd></div>
        </dl>
        <footer><Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); toggleRiderStatus(rider) }}>Toggle status</Button></footer>
      </Card>) : <Card><p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No riders configured. Add riders in settings.</p></Card>}
    </div>}

    {tab === 'Routes' && <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 12 }}><Button onClick={() => setRouteModal(true)}><Plus size={16} /> Add route</Button></div>
      <Card><DataTable rows={routes.map((r, i) => ({ ...r, id: r.id || i }))} columns={[
        { key: 'zone', label: 'Zone', render: r => <strong>{r.zone}</strong> },
        { key: 'areas', label: 'Areas covered' },
        { key: 'estimatedTime', label: 'Est. time', render: r => `${r.estimatedTime} min` },
        { key: 'defaultRider', label: 'Default rider', render: r => riders.find(rd => rd.id === r.defaultRider)?.name || '—' },
      ]} empty="No routes configured" /></Card>
    </div>}

    {tab === 'Settings' && <Card style={{ marginTop: 16, padding: 16 }}>
      <SectionHeader title="Delivery settings" />
      <div className="form-grid">
        <Field label="Delivery radius (km)"><Input type="number" value={settings.radius} onChange={e => setSettings(s => ({ ...s, radius: Number(e.target.value) }))} /></Field>
        <Field label="Delivery fee (PKR)"><Input type="number" value={settings.fee} onChange={e => setSettings(s => ({ ...s, fee: Number(e.target.value) }))} /></Field>
        <Field label="Auto-assignment"><label className="switch"><input type="checkbox" checked={settings.autoAssign} onChange={() => setSettings(s => ({ ...s, autoAssign: !s.autoAssign }))} /><i /></label></Field>
        <Field label="Max concurrent per rider"><Input type="number" value={settings.maxConcurrent} onChange={e => setSettings(s => ({ ...s, maxConcurrent: Number(e.target.value) }))} /></Field>
      </div>
      <div className="form-actions"><Button>Save settings</Button></div>
    </Card>}

    <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign rider for ${assignModal?.number}`}>
      {riders.filter(r => r.status === 'Available').length ? riders.filter(r => r.status === 'Available').map(rider => <div key={rider.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <div><strong>{rider.name}</strong><br /><small style={{ color: 'var(--muted)' }}>{rider.phone}</small></div>
        <Button size="sm" onClick={() => assignRider(rider.id)}>Assign</Button>
      </div>) : <p style={{ padding: 16, color: 'var(--muted)', textAlign: 'center' }}>No available riders</p>}
    </Modal>

    <Modal open={!!selectedRider} onClose={() => setSelectedRider(null)} title={selectedRider?.name} description={`Status: ${selectedRider?.status}`}>
      {selectedRider && <div>
        <p style={{ fontSize: 12, marginBottom: 12 }}>Active deliveries for this rider:</p>
        <DataTable rows={deliveryOrders.filter(o => o.riderId === selectedRider.id && o.status === 'Out for Delivery')} columns={[
          { key: 'number', label: 'Order', render: r => <strong>{r.number}</strong> },
          { key: 'customer', label: 'Customer' },
          { key: 'total', label: 'Amount', render: r => money(r.total) },
        ]} empty="No active deliveries" />
      </div>}
    </Modal>

    <Modal open={routeModal} onClose={() => setRouteModal(false)} title="Add delivery route">
      <form onSubmit={saveRoute} className="form-grid">
        <Field label="Zone name" required><Input required value={routeForm.zone} onChange={e => setRouteForm({ ...routeForm, zone: e.target.value })} /></Field>
        <Field label="Areas covered"><Input value={routeForm.areas} onChange={e => setRouteForm({ ...routeForm, areas: e.target.value })} placeholder="e.g. DHA Phase 5, Model Town" /></Field>
        <Field label="Est. delivery time (min)"><Input type="number" value={routeForm.estimatedTime} onChange={e => setRouteForm({ ...routeForm, estimatedTime: Number(e.target.value) })} /></Field>
        <Field label="Default rider"><Select value={routeForm.defaultRider} onChange={e => setRouteForm({ ...routeForm, defaultRider: e.target.value })}><option value="">None</option>{riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setRouteModal(false)}>Cancel</Button><Button type="submit">Save route</Button></div>
      </form>
    </Modal>
  </div>
}

// ─── 7. RiderDashboardPage ───────────────────────────────────────────────────

export function RiderDashboardPage() {
  const { data, updateCollection, activeRestaurant, activeBranch, notify, session } = useApp()
  const [tab, setTab] = useState('My Deliveries')
  const [detailOrder, setDetailOrder] = useState(null)

  const riders = getBranchRiders(data, activeRestaurant.id, activeBranch?.id)
  const sessionUser = (data.users || []).find((u) => u.email === session?.email || u.name === session?.name)
  const currentRider = riders.find((r) => r.userId === sessionUser?.id || r.name === session?.name) || riders[0]
  const routes = (data.routes || []).filter(r => r.restaurantId === activeRestaurant.id)

  const allDeliveryOrders = data.orders.filter(o => o.restaurantId === activeRestaurant.id && ['Delivery', 'Online'].includes(o.type))
  const myOrders = allDeliveryOrders.filter(o => o.riderId === currentRider?.id)
  const readyForPickup = allDeliveryOrders.filter(o => o.status === 'Ready' && (!o.riderId || o.riderId === currentRider?.id))
  const inTransit = myOrders.filter(o => o.status === 'Out for Delivery')
  const completed = myOrders.filter(o => o.status === 'Completed')
  const earnings = completed.reduce((s, o) => s + (o.deliveryFee || 50), 0)
  const avgTime = completed.length ? Math.round(completed.reduce((s, o) => s + (o.deliveryMinutes || 28), 0) / completed.length) : 0

  const acceptOrder = (order) => {
    updateCollection('orders', items => items.map(o => o.id === order.id ? { ...o, riderId: currentRider?.id, status: 'Out for Delivery', pickedAt: new Date().toISOString() } : o))
    notify('Order accepted & picked up!', 'success')
  }
  const markDelivered = (order) => {
    updateCollection('orders', items => items.map(o => o.id === order.id ? { ...o, status: 'Completed', deliveredAt: new Date().toISOString(), deliveryMinutes: Math.round((Date.now() - new Date(o.pickedAt || o.createdAt).getTime()) / 60000) || 25 } : o))
    if (currentRider) updateCollection('riders', items => items.map(r => r.id === currentRider.id ? { ...r, completedToday: (r.completedToday || 0) + 1, activeOrders: Math.max(0, (r.activeOrders || 1) - 1) } : r))
    notify('Order delivered successfully!', 'success')
  }
  const toggleMyStatus = () => {
    if (!currentRider) return
    const statuses = ['Available', 'On Delivery', 'Off Duty']
    const next = statuses[(statuses.indexOf(currentRider.status) + 1) % statuses.length]
    updateCollection('riders', items => items.map(r => r.id === currentRider.id ? { ...r, status: next } : r))
    notify(`Status changed to ${next}`)
  }

  const statusColor = (s) => s === 'Available' ? '#21a172' : s === 'On Delivery' ? '#e5a321' : '#96a3a0'

  if (!currentRider) return <div>
    <PageHeader eyebrow="RIDER PORTAL" title="No Rider Profile" description="No rider account found for this business. Contact your manager to set up your rider profile." />
  </div>

  return <div className="rider-portal">
    <div className="rider-hero">
      <div className="rider-hero-left">
        <span className="rider-avatar" style={{ background: 'var(--accent)' }}>{currentRider.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
        <div>
          <h1>{currentRider.name}</h1>
          <p>{currentRider.vehicle} · {currentRider.zone} zone</p>
          <div className="rider-hero-status">
            <span className="rider-status" style={{ background: statusColor(currentRider.status) }} />
            <span>{currentRider.status}</span>
            <button className="rider-status-btn" onClick={toggleMyStatus}>Change</button>
          </div>
        </div>
      </div>
      <div className="rider-hero-stats">
        <div className="rider-hero-stat"><span className="rider-hero-stat-val">{inTransit.length}</span><span>Active</span></div>
        <div className="rider-hero-stat"><span className="rider-hero-stat-val">{readyForPickup.length}</span><span>Ready</span></div>
        <div className="rider-hero-stat"><span className="rider-hero-stat-val">{completed.length}</span><span>Done</span></div>
        <div className="rider-hero-stat"><span className="rider-hero-stat-val">{money(earnings)}</span><span>Earned</span></div>
      </div>
    </div>

    <div className="rider-kpi-bar">
      <StatCard label="Active Deliveries" value={inTransit.length} icon={Truck} />
      <StatCard label="Ready for Pickup" value={readyForPickup.length} icon={Package} tone="warning" />
      <StatCard label="Completed Today" value={completed.length} icon={CheckCircle2} tone="blue" />
      <StatCard label="Today's Earnings" value={money(earnings)} icon={CircleDollarSign} tone="violet" />
      <StatCard label="Avg Delivery Time" value={`${avgTime}m`} icon={Clock3} tone="active" />
      <StatCard label="Rating" value={`${currentRider.rating || 0} ★`} icon={Star} tone="warning" />
    </div>

    <Tabs items={['My Deliveries', 'Available Orders', 'History', 'My Route']} active={tab} onChange={setTab} />

    {tab === 'My Deliveries' && <div style={{ marginTop: 16 }}>
      {inTransit.length === 0 && readyForPickup.length === 0 ? <Card><div className="rider-empty"><Truck size={40} /><h3>No Active Deliveries</h3><p>Orders ready for pickup will appear here. Switch to "Available Orders" to accept new deliveries.</p></div></Card> : <>
        {inTransit.length > 0 && <><SectionHeader title="In Transit" /><div className="rider-delivery-grid">{inTransit.map(order => <Card key={order.id} className="rider-order-card transit">
          <div className="rider-order-top">
            <div className="rider-order-num"><strong>{order.number}</strong><Badge tone="info">In Transit</Badge></div>
            <span className="rider-order-time"><Clock3 size={11} /> {(order.pickedAt || order.createdAt || '').slice(11, 16)}</span>
          </div>
          <div className="rider-order-customer"><User size={14} /><div><strong>{order.customer}</strong>{order.phone && <small>{order.phone}</small>}</div></div>
          {order.address && <div className="rider-order-addr"><MapPin size={13} /><span>{order.address}</span></div>}
          <div className="rider-order-meta">
            <div><span>Amount</span><strong>{money(order.total)}</strong></div>
            <div><span>Payment</span><strong>{order.payment}</strong></div>
            <div><span>Items</span><strong>{(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)}</strong></div>
          </div>
          <div className="rider-order-items">{(order.items || []).slice(0, 3).map((item, i) => <span key={i}>{item.quantity}× {item.name}</span>)}{(order.items || []).length > 3 && <span className="more">+{order.items.length - 3} more</span>}</div>
          <div className="rider-order-actions">
            <Button size="sm" onClick={() => markDelivered(order)}><CheckCircle2 size={14} /> Mark Delivered</Button>
            <Button variant="outline" size="sm" onClick={() => setDetailOrder(order)}>Details</Button>
          </div>
        </Card>)}</div></>}

        {readyForPickup.filter(o => o.riderId === currentRider?.id).length > 0 && <><SectionHeader title="Assigned to You – Pick Up" /><div className="rider-delivery-grid">{readyForPickup.filter(o => o.riderId === currentRider?.id).map(order => <Card key={order.id} className="rider-order-card ready">
          <div className="rider-order-top">
            <div className="rider-order-num"><strong>{order.number}</strong><Badge tone="warning">Ready</Badge></div>
          </div>
          <div className="rider-order-customer"><User size={14} /><div><strong>{order.customer}</strong></div></div>
          {order.address && <div className="rider-order-addr"><MapPin size={13} /><span>{order.address}</span></div>}
          <div className="rider-order-meta">
            <div><span>Amount</span><strong>{money(order.total)}</strong></div>
            <div><span>Payment</span><strong>{order.payment}</strong></div>
          </div>
          <div className="rider-order-actions">
            <Button size="sm" onClick={() => acceptOrder(order)}><Truck size={14} /> Pick Up Now</Button>
          </div>
        </Card>)}</div></>}
      </>}
    </div>}

    {tab === 'Available Orders' && <div style={{ marginTop: 16 }}>
      <SectionHeader title="Ready for Pickup" />
      {readyForPickup.length ? <div className="rider-delivery-grid">{readyForPickup.map(order => <Card key={order.id} className="rider-order-card available">
        <div className="rider-order-top">
          <div className="rider-order-num"><strong>{order.number}</strong><Badge tone="active">Ready</Badge></div>
          <span className="rider-order-time"><Clock3 size={11} /> {(order.createdAt || '').slice(11, 16)}</span>
        </div>
        <div className="rider-order-customer"><User size={14} /><div><strong>{order.customer}</strong></div></div>
        {order.address && <div className="rider-order-addr"><MapPin size={13} /><span>{order.address}</span></div>}
        <div className="rider-order-meta">
          <div><span>Amount</span><strong>{money(order.total)}</strong></div>
          <div><span>Payment</span><strong>{order.payment}</strong></div>
          <div><span>Items</span><strong>{(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)}</strong></div>
        </div>
        <div className="rider-order-actions">
          <Button size="sm" onClick={() => acceptOrder(order)}><Truck size={14} /> Accept & Pick Up</Button>
          <Button variant="outline" size="sm" onClick={() => setDetailOrder(order)}>View Details</Button>
        </div>
      </Card>)}</div> : <Card><div className="rider-empty"><Package size={40} /><h3>No Orders Available</h3><p>When kitchen marks delivery orders as ready, they'll appear here for you to accept.</p></div></Card>}
    </div>}

    {tab === 'History' && <div style={{ marginTop: 16 }}>
      <div className="rider-history-summary">
        <Card className="rider-history-card"><CircleDollarSign size={20} /><div><strong>{money(earnings)}</strong><span>Total Earnings</span></div></Card>
        <Card className="rider-history-card"><CheckCircle2 size={20} /><div><strong>{completed.length}</strong><span>Deliveries</span></div></Card>
        <Card className="rider-history-card"><Clock3 size={20} /><div><strong>{avgTime}m</strong><span>Avg Time</span></div></Card>
        <Card className="rider-history-card"><Star size={20} /><div><strong>{currentRider.rating}</strong><span>Rating</span></div></Card>
      </div>
      <Card style={{ marginTop: 16 }}>
        <DataTable rows={completed} columns={[
          { key: 'number', label: 'Order', render: r => <strong>{r.number}</strong> },
          { key: 'customer', label: 'Customer' },
          { key: 'address', label: 'Address', render: r => <span style={{ fontSize: 11 }}>{r.address || '—'}</span> },
          { key: 'total', label: 'Amount', render: r => money(r.total) },
          { key: 'payment', label: 'Payment' },
          { key: 'deliveryFee', label: 'Fee', render: r => money(r.deliveryFee || 50) },
          { key: 'deliveryMinutes', label: 'Time', render: r => `${r.deliveryMinutes || '—'}m` },
          { key: 'createdAt', label: 'Order Time', render: r => (r.createdAt || '').slice(11, 16) },
          { key: 'status', label: 'Status', render: () => <Badge tone="active">Delivered</Badge> },
        ]} empty="No delivery history yet. Complete deliveries to see them here." />
      </Card>
    </div>}

    {tab === 'My Route' && <div style={{ marginTop: 16 }}>
      <Card className="rider-route-card">
        <div className="rider-route-header"><MapPin size={20} /><div><h3>Assigned Route</h3><p>{currentRider.route || 'No route assigned'}</p></div></div>
        <div className="rider-route-info">
          <div><span>Zone</span><strong>{currentRider.zone || '—'}</strong></div>
          <div><span>Vehicle</span><strong>{currentRider.vehicle || '—'}</strong></div>
          <div><span>Phone</span><strong>{currentRider.phone || '—'}</strong></div>
        </div>
      </Card>
      {routes.length > 0 && <><SectionHeader title="All Routes" style={{ marginTop: 16 }} />
      <Card><DataTable rows={routes} columns={[
        { key: 'zone', label: 'Zone', render: r => <strong>{r.zone}</strong> },
        { key: 'areas', label: 'Areas' },
        { key: 'estimatedTime', label: 'Est. Time', render: r => `${r.estimatedTime || 30}m` },
        { key: 'defaultRider', label: 'Default Rider', render: r => { const rd = riders.find(ri => ri.id === r.defaultRider); return rd ? rd.name : '—' } },
      ]} empty="No routes configured yet." /></Card></>}
    </div>}

    <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={`Order ${detailOrder?.number || ''}`} description={`${detailOrder?.customer || ''} · ${detailOrder?.type || ''}`}>
      {detailOrder && <div className="rider-detail-modal">
        <div className="rider-detail-section">
          <h4>Customer</h4>
          <p><User size={14} /> {detailOrder.customer}</p>
          {detailOrder.address && <p><MapPin size={14} /> {detailOrder.address}</p>}
          {detailOrder.phone && <p>📞 {detailOrder.phone}</p>}
        </div>
        <div className="rider-detail-section">
          <h4>Order Items</h4>
          <div className="rider-detail-items">{(detailOrder.items || []).map((item, i) => <div key={i} className="rider-detail-item"><span>{item.quantity}× {item.name}</span><span>{money((item.price || 0) * (item.quantity || 1))}</span></div>)}</div>
        </div>
        <div className="rider-detail-totals">
          <div><span>Subtotal</span><strong>{money(detailOrder.total - (detailOrder.tax || 0) + (detailOrder.discount || 0))}</strong></div>
          {detailOrder.tax > 0 && <div><span>Tax</span><strong>{money(detailOrder.tax)}</strong></div>}
          {detailOrder.discount > 0 && <div><span>Discount</span><strong>-{money(detailOrder.discount)}</strong></div>}
          <div className="rider-detail-total"><span>Total</span><strong>{money(detailOrder.total)}</strong></div>
        </div>
        <div className="rider-detail-footer">
          <Badge tone={detailOrder.payment === 'Cash' ? 'warning' : 'info'}>{detailOrder.payment}</Badge>
          <Badge tone={detailOrder.status === 'Completed' ? 'active' : detailOrder.status === 'Out for Delivery' ? 'info' : 'warning'}>{detailOrder.status}</Badge>
        </div>
        {detailOrder.status === 'Ready' && <Button style={{ width: '100%', marginTop: 12 }} onClick={() => { acceptOrder(detailOrder); setDetailOrder(null) }}><Truck size={14} /> Accept & Pick Up</Button>}
        {detailOrder.status === 'Out for Delivery' && <Button style={{ width: '100%', marginTop: 12 }} onClick={() => { markDelivered(detailOrder); setDetailOrder(null) }}><CheckCircle2 size={14} /> Mark Delivered</Button>}
      </div>}
    </Modal>
  </div>
}

// ─── 8. WaiterPage ────────────────────────────────────────────────────────────

export function WaiterPage() {
  const { data, createOrder, activeRestaurant, activeBranch, notify } = useApp()
  const [selectedTable, setSelectedTable] = useState(null)
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [instructions, setInstructions] = useState({})
  const [sent, setSent] = useState(false)

  const tables = (data.tables || []).filter(t => t.branchId === activeBranch?.id)
  const products = data.products.filter(p => p.restaurantId === activeRestaurant.id && p.available)
  const categories = ['All', ...[...new Set(products.map(p => p.category))]]
  const filteredProducts = products.filter(p => category === 'All' || p.category === category)

  const activeOrders = data.orders.filter(o => o.restaurantId === activeRestaurant.id && ['New', 'Preparing'].includes(o.status))

  const addToCart = (product) => {
    setCart(c => {
      const existing = c.find(i => i.id === product.id)
      if (existing) return c.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...c, { ...product, quantity: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(c => c.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax = Math.round(subtotal * 0.16)

  const sendToKitchen = () => {
    if (!selectedTable || !cart.length) return
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, instructions: instructions[i.id] || '' }))
    createOrder({ customer: `Table ${selectedTable.name}`, type: 'Dine-in', payment: 'Cash', items, subtotal, tax, discount: 0, total: subtotal + tax, status: 'New', tableId: selectedTable.id })
    setCart([])
    setInstructions({})
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return <div>
    <PageHeader eyebrow="WAITER TERMINAL" title="Order Punch" description={selectedTable ? `Table: ${selectedTable.name}` : 'Select a table to begin'} />

    {sent && <Card style={{ background: 'var(--green-bg, #dcfce7)', padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <CheckCircle2 size={18} /> Order sent to <strong>Kitchen</strong> and <strong>Cashier</strong> printers.
    </Card>}

    {!selectedTable ? <div>
      <SectionHeader title="Select a table" />
      <Card className="floor-plan">
        {tables.map(table => <button key={table.id} className={`floor-table status-${table.status.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setSelectedTable(table)}>
          <UtensilsCrossed size={22} />
          <strong>{table.name}</strong>
          <span>{table.seats} seats</span>
          <Badge>{table.status}</Badge>
        </button>)}
      </Card>

      <SectionHeader title="Active Tables" style={{ marginTop: 24 }} />
      <Card>
        <DataTable rows={activeOrders.slice(0, 10)} columns={[
          { key: 'number', label: 'Order', render: r => <strong>{r.number}</strong> },
          { key: 'customer', label: 'Table/Customer' },
          { key: 'status', label: 'Status', render: r => <Badge>{r.status}</Badge> },
          { key: 'total', label: 'Total', render: r => money(r.total) },
        ]} empty="No active orders" />
      </Card>
    </div> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
      <div>
        <div className="table-toolbar" style={{ marginBottom: 12 }}>
          <Tabs items={categories} active={category} onChange={setCategory} />
        </div>
        <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
          {filteredProducts.map(p => <Card key={p.id} onClick={() => addToCart(p)} style={{ cursor: 'pointer', padding: 10, textAlign: 'center' }}>
            <img src={p.image} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
            <strong style={{ fontSize: 12, display: 'block' }}>{p.name}</strong>
            <small>{money(p.price)}</small>
          </Card>)}
        </div>
      </div>

      <Card style={{ padding: 12, alignSelf: 'start', position: 'sticky', top: 16 }}>
        <SectionHeader title={`Table ${selectedTable.name}`}><Button variant="ghost" size="sm" onClick={() => { setSelectedTable(null); setCart([]); setInstructions({}) }}>Change table</Button></SectionHeader>
        {cart.length ? <>
          {cart.map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
            <div style={{ flex: 1 }}>
              <strong>{item.name}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Button variant="outline" size="sm" onClick={() => updateQty(item.id, -1)} style={{ padding: '0 6px' }}><Minus size={12} /></Button>
                <span>{item.quantity}</span>
                <Button variant="outline" size="sm" onClick={() => updateQty(item.id, 1)} style={{ padding: '0 6px' }}><Plus size={12} /></Button>
              </div>
              <Input style={{ marginTop: 4, fontSize: 10 }} placeholder="Special instructions…" value={instructions[item.id] || ''} onChange={e => setInstructions(ins => ({ ...ins, [item.id]: e.target.value }))} />
            </div>
            <strong>{money(item.price * item.quantity)}</strong>
          </div>)}
          <div style={{ padding: '12px 0', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax (16%)</span><span>{money(tax)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6, fontSize: 14 }}><span>Total</span><span>{money(subtotal + tax)}</span></div>
          </div>
          <Button onClick={sendToKitchen} className="full-width" style={{ width: '100%' }}><Send size={16} /> Send to Kitchen</Button>
        </> : <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Tap menu items to add to order</p>}
      </Card>
    </div>}
  </div>
}
