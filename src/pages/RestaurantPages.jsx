import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Boxes, Building2, ChefHat, CircleDollarSign, ClipboardList, Clock3, Copy, Download, Edit3, ExternalLink, List, Minus, Package, Percent, Plus, Printer, ShoppingBag, Table2, Tag, Trash2, TrendingUp, Truck, Upload, Users, Zap } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { DEFAULT_CATEGORY_PREP } from '../utils/orderEta'
import { calcMaxServings } from '../utils/inventoryRecipe'
import { calculateProductAvailability, getProductStockStatus } from '../utils/inventoryAvailability'
import { getProductRecipe, PRODUCT_TYPES } from '../utils/productInventoryResolver'
import { getUnitInfo, PURCHASE_UNITS, getPurchaseUnitLabel } from '../utils/inventoryUnits'
import { getBusinessLabels, getDefaultInventoryCategory, getInventoryCategories, getMenuCategories, getWasteReasons } from '../utils/businessConfig'
import ProductBuilder, { buildEmptyProductForm, productToForm } from '../components/ProductBuilder'
import { ACTIVE_ORDER_STATUSES, ORDER_STATUSES, TERMINAL_ORDER_STATUSES, UNIFIED_QUEUE_COLUMNS, filterOrdersByDate, filterKitchenQueue, getNextOrderStatus, getOrderActionLabel, getOrderStatusTone, isOnlineChannelOrder, ordersInColumn, ordersInKitchenColumn, KITCHEN_KDS_COLUMNS, sortOrdersForListing, statusForKitchenColumn, statusForOrderQueueColumn, todayDateKey } from '../utils/orderWorkflow'
import { Badge, Button, Card, DataTable, Field, Input, Modal, OrderStatusBadge, OrderTypeBadge, PageHeader, SearchBox, SectionHeader, Select, StatCard, Tabs, money } from '../components/ui'
import { KanbanBoard } from '../components/KanbanBoard'
import { FEATURE_MODULES } from '../data/seed'
import { DEDUCTION_TIMING, getDefaultInventorySettings } from '../utils/inventoryEngine'
import { calcPOTotal, downloadInventoryUploadTemplate } from '../utils/purchaseOrderEngine'

const salesTrend = [
  { day: 'Mon', sales: 284000, orders: 98 }, { day: 'Tue', sales: 328000, orders: 114 },
  { day: 'Wed', sales: 306000, orders: 106 }, { day: 'Thu', sales: 402000, orders: 142 },
  { day: 'Fri', sales: 518000, orders: 178 }, { day: 'Sat', sales: 642000, orders: 218 }, { day: 'Sun', sales: 573000, orders: 194 },
]

export function RestaurantDashboard() {
  const { data, activeRestaurant, activeBranch } = useApp()
  const orders = data.orders.filter((item) => item.restaurantId === activeRestaurant.id)
  const today = orders.filter((item) => item.createdAt.includes('2026-08-16'))
  const completed = today.filter((item) => item.status === 'Completed')
  const sales = completed.reduce((sum, item) => sum + item.total, 0) || 486240
  const lowStock = data.inventory.filter((item) => item.restaurantId === activeRestaurant.id && item.stock <= item.minimum)
  return <div><PageHeader eyebrow={`${activeBranch?.name?.toUpperCase()} · LIVE OVERVIEW`} title={`Good evening, ${activeRestaurant.name}`} description="Track service, sales and operations in real time."><Button onClick={() => window.location.assign(`/restaurant/${activeRestaurant.id}/pos`)}><ShoppingBag size={16}/> Open POS</Button></PageHeader>
    <div className="stat-grid four"><StatCard label="Today's sales" value={money(sales)} change="+14.2% vs last Sunday" icon={TrendingUp}/><StatCard label="Today's orders" value={today.length || 184} change="+8.6% vs last Sunday" icon={ShoppingBag} tone="blue"/><StatCard label="Average order value" value={money(Math.round(sales/(today.length||184)))} change="+5.1%" icon={CircleDollarSign} tone="violet"/><StatCard label="Guests served" value="428" change="62 currently seated" icon={Users} tone="amber"/></div>
    <div className="dashboard-grid"><Card className="chart-card wide"><SectionHeader title="Sales performance" description="Net sales across the last seven days"><Tabs items={['7 days','30 days']} active="7 days" onChange={()=>{}}/></SectionHeader><div className="chart-value"><strong>{money(3053000)}</strong><Badge tone="active">↑ 11.8%</Badge></div><ResponsiveContainer width="100%" height={245}><AreaChart data={salesTrend}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={activeRestaurant.branding.primary} stopOpacity={.3}/><stop offset="100%" stopColor={activeRestaurant.branding.primary} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day"/><YAxis hide/><Tooltip formatter={(value)=>money(value)}/><Area dataKey="sales" type="monotone" stroke={activeRestaurant.branding.primary} strokeWidth={2.5} fill="url(#salesFill)"/></AreaChart></ResponsiveContainer></Card>
      <Card className="chart-card"><SectionHeader title="Payment mix" description="Today by tender type"/><ResponsiveContainer width="100%" height={205}><PieChart><Pie data={[{name:'Cash',value:46},{name:'Card',value:31},{name:'Raast',value:15},{name:'Wallets',value:8}]} innerRadius={55} outerRadius={77} paddingAngle={4} dataKey="value">{['#0f766e','#2563eb','#7c3aed','#f59e0b'].map((color)=><Cell key={color} fill={color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="legend-row"><span><i className="dot green"/>Cash 46%</span><span><i className="dot blue"/>Card 31%</span><span><i className="dot violet"/>Digital 23%</span></div></Card>
      <Card className="top-products"><SectionHeader title="Top products" description="By revenue today"/>{data.products.slice(0,5).map((product,index)=><div key={product.id}><span>{index+1}</span><img src={product.image} alt=""/><div><strong>{product.name}</strong><small>{18-index*2} orders</small></div><b>{money(product.price*(18-index*2))}</b></div>)}</Card>
      <Card className="operations-card"><SectionHeader title="Operations pulse" description="Live branch attention"/><div className="operation-metric"><span className="tone-red"><AlertTriangle size={18}/></span><div><strong>{lowStock.length} stock alerts</strong><small>{lowStock.slice(0,2).map(i=>i.name).join(', ')}</small></div><ArrowRight size={16}/></div><div className="operation-metric"><span className="tone-amber"><ChefHat size={18}/></span><div><strong>6 kitchen orders active</strong><small>Average prep time 14m 28s</small></div><ArrowRight size={16}/></div><div className="operation-metric"><span className="tone-blue"><Truck size={18}/></span><div><strong>4 deliveries in progress</strong><small>2 riders currently available</small></div><ArrowRight size={16}/></div></Card>
    </div>
  </div>
}

export function BranchesPage() {
  const { restaurantBranches, activeRestaurant, setData, notify } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name:'',city:'Lahore',address:'',manager:'',phone:'',terminals:2,tables:12 })
  const save = (event) => { event.preventDefault(); setData((state)=>({...state,branches:[...state.branches,{...form,id:`b${Date.now()}`,restaurantId:activeRestaurant.id,status:'Active'}]})); notify('Branch added successfully'); setOpen(false) }
  return <div><PageHeader eyebrow="ORGANIZATION" title="Branches" description="Manage locations, managers and operating capacity."><Button onClick={()=>setOpen(true)}><Plus size={16}/> Add branch</Button></PageHeader>
    <div className="branch-grid">{restaurantBranches.map((branch)=><Card key={branch.id} className="branch-card"><header><span><Building2 size={20}/></span><Badge>{branch.status}</Badge></header><h2>{branch.name}</h2><p>{branch.address}, {branch.city}</p><dl><div><dt>Manager</dt><dd>{branch.manager}</dd></div><div><dt>Phone</dt><dd>{branch.phone}</dd></div><div><dt>POS terminals</dt><dd>{branch.terminals}</dd></div><div><dt>Tables</dt><dd>{branch.tables}</dd></div></dl><footer><Button variant="outline" size="sm"><Edit3 size={14}/> Edit</Button><Button variant="ghost" size="sm">Manage <ArrowRight size={14}/></Button></footer></Card>)}</div>
    <Modal open={open} onClose={()=>setOpen(false)} title="Add branch" description="Create a new operating location."><form onSubmit={save} className="form-grid">{['name','address','manager','phone'].map((key)=><Field key={key} label={key[0].toUpperCase()+key.slice(1)} required><Input required value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})}/></Field>)}<Field label="City"><Select value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}>{['Lahore','Islamabad','Karachi','Rawalpindi','Faisalabad','Multan'].map(c=><option key={c}>{c}</option>)}</Select></Field><Field label="Tables"><Input type="number" value={form.tables} onChange={(e)=>setForm({...form,tables:Number(e.target.value)})}/></Field><div className="form-actions span-2"><Button type="button" variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit">Add branch</Button></div></form></Modal>
  </div>
}

export function MenuPage() {
  const { data, saveProductWithRecipe, addInventory, updateCollection, activeRestaurant } = useApp()
  const businessType = activeRestaurant.type || 'restaurant'
  const labels = getBusinessLabels(businessType)
  const menuCategories = getMenuCategories(data.categories, businessType)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(() => buildEmptyProductForm(menuCategories, businessType))

  const restaurantProducts = data.products.filter((p) => p.restaurantId === activeRestaurant.id)
  const restaurantAddons = (data.addons || []).filter((addon) => addon.restaurantId === activeRestaurant.id && addon.active !== false)
  const restaurantInventory = (data.inventory || []).filter((item) => item.restaurantId === activeRestaurant.id)
  const recipes = data.recipes || []
  const filtered = restaurantProducts.filter((p) => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()))
  const inventoryCtx = { products: restaurantProducts, recipes, inventory: restaurantInventory }

  const openCreate = () => {
    setEditing(null)
    setForm(buildEmptyProductForm(menuCategories, businessType))
    setOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm(productToForm(product, recipes))
    setOpen(true)
  }

  const save = () => {
    const payload = {
      ...form,
      price: Number(form.price),
      cost: Number(form.cost) || 0,
      prepMinutes: Number(form.prepMinutes) || DEFAULT_CATEGORY_PREP[form.category] || 15,
      image: form.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=70',
      addonIds: form.addonIds,
      available: !form.manuallyDisabled,
    }
    saveProductWithRecipe({
      product: payload,
      ingredients: form.productType === PRODUCT_TYPES.RECIPE ? form.ingredients : [],
      comboItems: form.productType === PRODUCT_TYPES.COMBO ? form.comboItems : [],
      productId: editing?.id,
    })
    setOpen(false)
    setEditing(null)
    setForm(buildEmptyProductForm(menuCategories, businessType))
  }

  const typeLabel = (product) => {
    const type = product.productType || (getProductRecipe(product.id, recipes) ? PRODUCT_TYPES.RECIPE : PRODUCT_TYPES.DIRECT_STOCK)
    return { [PRODUCT_TYPES.SERVICE]: 'Service', [PRODUCT_TYPES.DIRECT_STOCK]: 'Direct stock', [PRODUCT_TYPES.RECIPE]: 'Recipe', [PRODUCT_TYPES.COMBO]: 'Combo' }[type] || 'Product'
  }

  const columns = [
    { key: 'name', label: labels.product, render: (r) => <div className="product-cell"><img src={r.image} alt=""/><div><strong>{r.name}</strong><small>{r.sku}</small></div></div> },
    { key: 'category', label: labels.category },
    { key: 'type', label: 'Type', render: (r) => <Badge tone="info">{typeLabel(r)}</Badge> },
    { key: 'addons', label: 'Add-ons', render: (r) => <Badge tone={r.addonIds?.length ? 'info' : ''}>{r.addonIds?.length || 0} linked</Badge> },
    { key: 'prepMinutes', label: 'Prep time', render: (r) => <span>{r.prepMinutes || DEFAULT_CATEGORY_PREP[r.category] || 15} min</span> },
    { key: 'price', label: 'Selling price', render: (r) => <strong>{money(r.price)}</strong> },
    { key: 'stock', label: 'Available', render: (r) => {
      const available = calculateProductAvailability(r, inventoryCtx)
      const status = getProductStockStatus(r, inventoryCtx)
      const tone = status === 'OUT_OF_STOCK' ? 'out-of-stock' : status === 'LOW_STOCK' ? 'warning' : 'active'
      return <Badge tone={tone}>{available === Infinity ? 'Unlimited' : `${available} units`}</Badge>
    }},
    { key: 'available', label: 'On menu', render: (r) => <label className="switch"><input type="checkbox" checked={r.available} onChange={() => updateCollection('products', (items) => items.map((p) => p.id === r.id ? { ...p, available: !p.available, manuallyDisabled: p.available } : p))}/><i/></label> },
    { key: 'actions', label: '', render: (r) => <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Edit3 size={14}/> Edit</Button> },
  ]

  return <div>
    <PageHeader eyebrow="MENU MANAGEMENT" title={labels.products} description={`${restaurantProducts.length} ${labels.productPlural} — configure recipes and ingredients in the builder`}>
      <Button onClick={openCreate}><Plus size={16}/> Add {labels.product.toLowerCase()}</Button>
    </PageHeader>
    <Card>
      <div className="table-toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder={`Search ${labels.productPlural}…`}/>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}><option>All</option>{menuCategories.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
      </div>
      <DataTable rows={filtered} columns={columns}/>
    </Card>
    <ProductBuilder
      open={open}
      editing={editing}
      form={form}
      setForm={setForm}
      onClose={() => { setOpen(false); setEditing(null) }}
      onSave={save}
      categories={menuCategories}
      businessType={businessType}
      restaurantInventory={restaurantInventory}
      restaurantAddons={restaurantAddons}
      restaurantProducts={restaurantProducts}
      addInventory={addInventory}
    />
  </div>
}

export function AddonsPage() {
  const { data, activeRestaurant, addAddon, updateAddon, deleteAddon } = useApp()
  const businessType = activeRestaurant.type || 'restaurant'
  const labels = getBusinessLabels(businessType)
  const menuCategories = getMenuCategories(data.categories, businessType)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', category: menuCategories[0]?.name || 'Burgers', active: true, inventoryTracking: false, inventoryItemId: '', quantityPerAddon: 1, unit: 'pcs' })
  const restaurantAddons = (data.addons || []).filter((addon) => addon.restaurantId === activeRestaurant.id)
  const restaurantInventory = (data.inventory || []).filter((item) => item.restaurantId === activeRestaurant.id)
  const filtered = restaurantAddons.filter((addon) => (category === 'All' || addon.category === category) && addon.name.toLowerCase().includes(query.toLowerCase()))

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', price: '', category: menuCategories[0]?.name || 'Burgers', active: true, inventoryTracking: false, inventoryItemId: '', quantityPerAddon: 1, unit: 'pcs' })
    setOpen(true)
  }

  const openEdit = (addon) => {
    setEditing(addon)
    setForm({
      name: addon.name,
      price: addon.price,
      category: addon.category,
      active: addon.active !== false,
      inventoryTracking: addon.inventoryTracking ?? false,
      inventoryItemId: addon.inventoryItemId || '',
      quantityPerAddon: addon.quantityPerAddon || 1,
      unit: addon.unit || 'pcs',
    })
    setOpen(true)
  }

  const save = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price),
      quantityPerAddon: Number(form.quantityPerAddon) || 1,
      inventoryItemId: form.inventoryTracking ? form.inventoryItemId : null,
    }
    if (editing) updateAddon(editing.id, payload)
    else addAddon(payload)
    setOpen(false)
    setEditing(null)
  }

  const columns = [
    { key: 'name', label: 'Add-on', render: (r) => <div><strong>{r.name}</strong><small className="block">{r.category}</small></div> },
    { key: 'category', label: 'Item type' },
    { key: 'price', label: 'Price', render: (r) => <strong>{money(r.price)}</strong> },
    { key: 'inventory', label: 'Inventory', render: (r) => r.inventoryTracking ? <Badge tone="info">Tracked</Badge> : <Badge>None</Badge> },
    { key: 'active', label: 'Status', render: (r) => <label className="switch"><input type="checkbox" checked={r.active !== false} onChange={() => updateAddon(r.id, { active: r.active === false })}/><i/></label> },
    { key: 'actions', label: '', render: (r) => <div style={{ display: 'flex', gap: 6 }}><Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Edit3 size={14}/></Button><Button variant="ghost" size="sm" onClick={() => deleteAddon(r.id)}><Trash2 size={14}/></Button></div> },
  ]

  return <div>
    <PageHeader eyebrow="MENU CUSTOMIZATION" title="Add-ons" description="Manage extras by item type — burgers, pizza, BBQ and more.">
      <Button onClick={openCreate}><Plus size={16}/> Add add-on</Button>
    </PageHeader>
    <Card>
      <div className="table-toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search add-ons…"/>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}><option>All</option>{menuCategories.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
      </div>
      <DataTable rows={filtered} columns={columns} empty="No add-ons yet — create extras for burgers, pizza and other categories."/>
    </Card>
    <Modal open={open} onClose={() => { setOpen(false); setEditing(null) }} title={editing ? 'Edit add-on' : 'Add add-on'} description="Add-ons are grouped by menu category so each item type has its own extras.">
      <form onSubmit={save} className="form-grid">
        <Field label="Add-on name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Extra Cheese, Stuffed Crust"/></Field>
        <Field label="Price (PKR)" required><Input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></Field>
        <Field label="Applies to" hint={`Only ${labels.productPlural} in this category can use this add-on.`}><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{menuCategories.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Track inventory"><label className="switch"><input type="checkbox" checked={form.inventoryTracking} onChange={(e) => setForm({ ...form, inventoryTracking: e.target.checked })}/><i/></label></Field>
        {form.inventoryTracking && <>
          <Field label="Inventory item"><Select value={form.inventoryItemId} onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })}><option value="">Select item…</option>{restaurantInventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Quantity per add-on"><Input type="number" min="0.01" step="0.01" value={form.quantityPerAddon} onChange={(e) => setForm({ ...form, quantityPerAddon: e.target.value })}/></Field>
        </>}
        <Field label="Active"><label className="switch"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}/><i/></label></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => { setOpen(false); setEditing(null) }}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Create add-on'}</Button></div>
      </form>
    </Modal>
  </div>
}

export function OffersPage() {
  const { data, activeRestaurant, addOffer, updateOffer, deleteOffer } = useApp()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('All')
  const [form, setForm] = useState({ type: 'deal', title: '', description: '', image: '', badge: '', dealPrice: '', originalPrice: '', discountType: 'percentage', discountValue: '', category: 'All', minOrder: '', validFrom: '', validUntil: '' })
  const offers = (data.offers || []).filter((o) => o.restaurantId === activeRestaurant.id && (tab === 'All' || (tab === 'Active' && o.active) || (tab === 'Deals' && o.type === 'deal') || (tab === 'Discounts' && o.type === 'discount') || (tab === 'Expired' && !o.active)))
  const handleImage = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result })); reader.readAsDataURL(file) }
  const save = (e) => {
    e.preventDefault()
    const offer = { ...form, dealPrice: Number(form.dealPrice) || 0, originalPrice: Number(form.originalPrice) || 0, discountValue: Number(form.discountValue) || 0, minOrder: Number(form.minOrder) || 0 }
    if (!offer.image) offer.image = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=70'
    addOffer(offer)
    setOpen(false)
    setForm({ type: 'deal', title: '', description: '', image: '', badge: '', dealPrice: '', originalPrice: '', discountType: 'percentage', discountValue: '', category: 'All', minOrder: '', validFrom: '', validUntil: '' })
  }
  return <div>
    <PageHeader eyebrow="PROMOTIONS" title="Offers & deals" description={`${offers.length} promotions for ${activeRestaurant.name}`}><Button onClick={() => setOpen(true)}><Plus size={16} /> Create offer</Button></PageHeader>
    <div style={{ marginBottom: 14 }}><Tabs items={['All', 'Active', 'Deals', 'Discounts', 'Expired']} active={tab} onChange={setTab} /></div>
    {offers.length ? <div className="offers-grid">{offers.map((offer) => <Card key={offer.id} className="offer-card">
      <div className="offer-card-image"><img src={offer.image} alt={offer.title} />{offer.badge && <span className="offer-badge">{offer.badge}</span>}<span className={`offer-type-tag ${offer.type}`}>{offer.type === 'deal' ? <Zap size={11} /> : <Percent size={11} />}{offer.type === 'deal' ? 'Deal' : 'Discount'}</span></div>
      <div className="offer-card-body">
        <div className="offer-card-header"><h3>{offer.title}</h3><label className="switch"><input type="checkbox" checked={offer.active} onChange={() => updateOffer(offer.id, { active: !offer.active })} /><i /></label></div>
        <p>{offer.description}</p>
        {offer.type === 'deal' && <div className="offer-pricing"><span className="original-price">{money(offer.originalPrice)}</span><strong className="deal-price">{money(offer.dealPrice)}</strong><Badge tone="active">Save {money(offer.originalPrice - offer.dealPrice)}</Badge></div>}
        {offer.type === 'discount' && <div className="offer-pricing"><Badge tone="info">{offer.discountType === 'percentage' ? `${offer.discountValue}% off` : offer.discountType === 'freeDelivery' ? 'Free delivery' : `PKR ${offer.discountValue} off`}{offer.category && offer.category !== 'All' ? ` · ${offer.category}` : ''}</Badge>{offer.minOrder > 0 && <small>Min. order {money(offer.minOrder)}</small>}</div>}
        <div className="offer-meta"><small>{offer.validFrom} → {offer.validUntil}</small><div className="offer-actions"><Button variant="ghost" size="sm" onClick={() => deleteOffer(offer.id)}><Trash2 size={13} /></Button></div></div>
      </div>
    </Card>)}</div> : <Card className="center"><Tag size={28} style={{ color: 'var(--muted)', marginBottom: 12 }} /><h3>No offers yet</h3><p style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 16px' }}>Create deals and discounts to attract more customers to your online store.</p><Button onClick={() => setOpen(true)}><Plus size={16} /> Create your first offer</Button></Card>}
    <Modal open={open} onClose={() => setOpen(false)} title="Create offer" description="Set up a deal or discount for your customers." size="lg">
      <form onSubmit={save} className="form-grid">
        <Field label="Offer type" className="span-2"><div className="offer-type-picker"><label className={form.type === 'deal' ? 'active' : ''}><input type="radio" name="offerType" value="deal" checked={form.type === 'deal'} onChange={() => setForm({ ...form, type: 'deal' })} /><Zap size={18} /><span><strong>Combo Deal</strong><small>Bundle products at a special price</small></span></label><label className={form.type === 'discount' ? 'active' : ''}><input type="radio" name="offerType" value="discount" checked={form.type === 'discount'} onChange={() => setForm({ ...form, type: 'discount' })} /><Percent size={18} /><span><strong>Discount</strong><small>Percentage, flat, or free delivery</small></span></label></div></Field>
        <Field label="Offer image" className="span-2"><div className="image-upload-field"><input type="file" accept="image/*" onChange={handleImage} />{form.image && <img src={form.image} alt="Preview" className="image-preview" />}</div></Field>
        <Field label="Title" required><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Family Feast Box" /></Field>
        <Field label="Badge label"><Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. Best Value, Popular" /></Field>
        <Field label="Description" className="span-2"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what's included" /></Field>
        {form.type === 'deal' && <><Field label="Original price (PKR)" required><Input type="number" required value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} /></Field><Field label="Deal price (PKR)" required><Input type="number" required value={form.dealPrice} onChange={(e) => setForm({ ...form, dealPrice: e.target.value })} /></Field></>}
        {form.type === 'discount' && <><Field label="Discount type"><Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}><option value="percentage">Percentage off</option><option value="flat">Flat amount off</option><option value="freeDelivery">Free delivery</option></Select></Field>{form.discountType !== 'freeDelivery' && <Field label={form.discountType === 'percentage' ? 'Discount (%)' : 'Amount (PKR)'}><Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></Field>}<Field label="Apply to category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>All</option>{data.categories.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field><Field label="Min. order amount (PKR)"><Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="0" /></Field></>}
        <Field label="Valid from"><Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></Field>
        <Field label="Valid until"><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create offer</Button></div>
      </form>
    </Modal>
  </div>
}

function OrderColorLegend() {
  return (
    <div className="order-legend">
      <div className="order-legend-group">
        <span className="order-legend-label">Order type</span>
        {['Dine-in', 'Takeaway', 'Delivery', 'Online'].map((type) => <OrderTypeBadge key={type} type={type} />)}
      </div>
      <div className="order-legend-group">
        <span className="order-legend-label">Status</span>
        {['Pending Confirmation', 'New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed'].map((status) => (
          <OrderStatusBadge key={status} status={status} />
        ))}
      </div>
    </div>
  )
}

function OrderQueueCard({ order, column, onOpen, onProgress }) {
  const actionLabel = getOrderActionLabel(order)
  const showStatusBadge = column === 'New' ? order.status !== 'New' : order.status !== column
  return (
    <Card key={order.id} className={`order-card${order.isNew ? ' order-card-new' : ''}`} onClick={() => onOpen(order)}>
      <div>
        <strong>{order.number}</strong>
        {order.isNew && <span className="order-new-pill">New</span>}
        <OrderTypeBadge type={order.type} />
        {showStatusBadge && <OrderStatusBadge status={order.status} />}
      </div>
      <h4>{order.customer}</h4>
      {order.phone && <small className="order-card-phone">{order.phone}</small>}
      <p>{order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
      <footer>
        <strong>{money(order.total)}</strong>
        {column === 'Pending Confirmation' ? (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onProgress(order) }}>{actionLabel || 'Confirm'}</Button>
        ) : actionLabel ? (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onProgress(order) }}>{actionLabel}</Button>
        ) : null}
      </footer>
    </Card>
  )
}

export function OrdersPage() {
  const { data, updateOrder, activeRestaurant, notify } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('queue')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [listDate, setListDate] = useState(todayDateKey)
  const [showAllDates, setShowAllDates] = useState(false)

  const restaurantOrders = data.orders.filter((o) => o.restaurantId === activeRestaurant.id)
  const matchesSearch = (o) => `${o.number} ${o.customer}`.toLowerCase().includes(query.toLowerCase())
  const matchesType = (o) => {
    if (typeFilter === 'Online store') return isOnlineChannelOrder(o)
    return typeFilter === 'All types' || o.type === typeFilter
  }
  const activeQueue = restaurantOrders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status) && matchesSearch(o) && matchesType(o))
  const listOrders = useMemo(() => {
    const filtered = restaurantOrders.filter((o) =>
      (status === 'All' || o.status === status)
      && matchesSearch(o)
      && matchesType(o)
    )
    const dated = showAllDates ? filtered : filterOrdersByDate(filtered, listDate)
    return sortOrdersForListing(dated)
  }, [restaurantOrders, status, query, typeFilter, listDate, showAllDates])
  const listActionCount = listOrders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length

  const markOrderSeen = (order) => { if (order.isNew) updateOrder(order.id, { isNew: false }) }
  const openOrder = (order) => { markOrderSeen(order); setSelectedId(order.id) }
  const selected = selectedId ? data.orders.find((o) => o.id === selectedId) ?? null : null
  const advanceOrder = (order) => {
    const next = getNextOrderStatus(order)
    if (!next) return
    updateOrder(order.id, { status: next, isNew: false })
    notify(`${order.number} moved to ${next}`)
  }

  const moveOrderToColumn = (orderId, _fromColumn, toColumn) => {
    const order = data.orders.find((o) => o.id === orderId)
    if (!order) return
    const nextStatus = statusForOrderQueueColumn(toColumn)
    if (order.status === nextStatus) return
    updateOrder(orderId, { status: nextStatus, isNew: false })
    notify(`${order.number} moved to ${nextStatus}`)
  }

  const orderTypes = ['All types', 'Online store', 'Dine-in', 'Takeaway', 'Delivery', 'Online']
  const activeCount = restaurantOrders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length
  const onlineOrderCount = restaurantOrders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status) && isOnlineChannelOrder(o)).length

  const columns = [
    { key: 'number', label: 'Order', render: (r) => <div className="order-number-cell"><strong>{r.number}</strong>{r.isNew && <span className="order-new-pill">New</span>}</div> },
    { key: 'createdAt', label: 'Date & time', render: (r) => r.createdAt.replace('T', ' ').slice(0, 16) },
    { key: 'customer', label: 'Customer' },
    { key: 'type', label: 'Type', render: (r) => <OrderTypeBadge type={r.type} /> },
    { key: 'payment', label: 'Payment' },
    { key: 'total', label: 'Total', render: (r) => <strong>{money(r.total)}</strong> },
    { key: 'status', label: 'Status', render: (r) => <OrderStatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Action',
      stopRowClick: true,
      render: (r) => {
        const label = getOrderActionLabel(r)
        if (!label) return <span className="muted">—</span>
        return <Button size="sm" onClick={() => advanceOrder(r)}>{label}</Button>
      },
    },
  ]

  const selectedAction = selected ? getOrderActionLabel(selected) : null
  const selectedNext = selected ? getNextOrderStatus(selected) : null

  return (
    <div>
      <PageHeader
        eyebrow="SERVICE OPERATIONS"
        title="Orders"
        description="Handle dine-in, takeaway, delivery and online orders (including pickup) from one screen."
      >
        <Button variant={view === 'queue' ? 'primary' : 'outline'} onClick={() => setView('queue')}>
          <ClipboardList size={16} /> Handle all orders{activeCount ? ` (${activeCount})` : ''}
        </Button>
        <Button variant={view === 'list' ? 'primary' : 'outline'} onClick={() => setView('list')}>
          <List size={16} /> Order history
        </Button>
        {activeRestaurant.features?.online && (
          <Button variant="outline" onClick={() => navigate(`/restaurant/${activeRestaurant.id}/store`)}>Preview store</Button>
        )}
        <Button variant="outline"><Download size={16} /> Export CSV</Button>
      </PageHeader>

      <OrderColorLegend />

      {view === 'queue' ? (
        <>
          <div className="table-toolbar order-queue-toolbar">
            <SearchBox value={query} onChange={setQuery} placeholder="Search order or customer…" />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {orderTypes.map((t) => <option key={t}>{t}</option>)}
            </Select>
            {onlineOrderCount > 0 && typeFilter === 'All types' && (
              <Button variant="outline" size="sm" onClick={() => setTypeFilter('Online store')}>
                <Truck size={14} /> {onlineOrderCount} from online store
              </Button>
            )}
          </div>
          <KanbanBoard
            className="unified-order-queue"
            emptyLabel="No orders"
            onMoveItem={moveOrderToColumn}
            columns={UNIFIED_QUEUE_COLUMNS.map((column) => ({
              id: column,
              title: column,
              tone: getOrderStatusTone(column),
              items: ordersInColumn(activeQueue, column),
            }))}
            renderCard={(order, column) => (
              <OrderQueueCard order={order} column={column.id} onOpen={openOrder} onProgress={advanceOrder} />
            )}
          />
        </>
      ) : (
        <Card>
          <div className="table-toolbar order-list-toolbar">
            <SearchBox value={query} onChange={setQuery} placeholder="Search order or customer…" />
            <div className="order-date-filter">
              <Input
                type="date"
                value={listDate}
                disabled={showAllDates}
                onChange={(e) => { setListDate(e.target.value); setShowAllDates(false) }}
              />
              <Button
                variant={!showAllDates && listDate === todayDateKey() ? 'primary' : 'outline'}
                size="sm"
                onClick={() => { setListDate(todayDateKey()); setShowAllDates(false) }}
              >
                Today
              </Button>
              <Button
                variant={showAllDates ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowAllDates(true)}
              >
                All history
              </Button>
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {orderTypes.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div className="order-list-summary">
            <span>
              {showAllDates
                ? `Showing all order history (${listOrders.length} orders)`
                : `Showing ${new Date(`${listDate}T12:00:00`).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${listOrders.length} orders`}
            </span>
            {listActionCount > 0 && <Badge tone="warning">{listActionCount} need action</Badge>}
            <small className="muted">Active orders listed first · completed & dispatched last</small>
          </div>
          <DataTable
            rows={listOrders}
            columns={columns}
            onRowClick={openOrder}
            rowClassName={(row) => row.isNew ? 'order-row-new' : ''}
            empty={showAllDates ? 'No orders found for the selected filters.' : 'No orders for this date. Use the date picker or All history to browse previous orders.'}
          />
        </Card>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={`Order ${selected?.number}`}
        description={`${selected?.type} · ${selected?.createdAt?.replace('T', ' ').slice(0, 16)}`}
        size="lg"
      >
        {selected && (
          <div className="order-detail">
            <div className="order-customer">
              <span><Users size={18} /></span>
              <div>
                <strong>{selected.customer}</strong>
                <small>{selected.payment} payment</small>
                <div className="order-customer-badges">
                  <OrderTypeBadge type={selected.type} />
                  <OrderStatusBadge status={selected.status} />
                </div>
              </div>
            </div>
            <div className="receipt-lines">
              {selected.items.map((item) => (
                <div key={item.id}><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>
              ))}
              <div><span>Tax</span><strong>{money(selected.tax)}</strong></div>
              <div className="total"><span>Total</span><strong>{money(selected.total)}</strong></div>
            </div>
            {selectedAction && selectedNext && !TERMINAL_ORDER_STATUSES.includes(selected.status) && (
              <div className="order-detail-actions">
                <Button onClick={() => advanceOrder(selected)}>{selectedAction}</Button>
                <small className="muted">Moves order to {selectedNext}</small>
              </div>
            )}
            <Field label="Update status">
              <Select
                value={selected.status}
                onChange={(e) => {
                  updateOrder(selected.id, { status: e.target.value, isNew: false })
                }}
              >
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function TablesPage() {
  const { data, activeBranch, updateCollection, notify }=useApp()
  const [section,setSection]=useState('All')
  const branchTables=data.tables.filter(t=>t.branchId===activeBranch?.id&&(section==='All'||t.section===section))
  const cycle=['Available','Occupied','Payment Pending','Cleaning','Reserved']
  const change=(table)=>{const next=cycle[(cycle.indexOf(table.status)+1)%cycle.length];updateCollection('tables',items=>items.map(t=>t.id===table.id?{...t,status:next}:t));notify(`${table.name} marked ${next}`)}
  return <div><PageHeader eyebrow="FLOOR MANAGEMENT" title="Tables" description="A live view of seating, service and turnover."><Button><Plus size={16}/> Add table</Button></PageHeader><div className="floor-toolbar"><Tabs items={['All','Main Hall','Terrace','VIP']} active={section} onChange={setSection}/><div className="table-legend">{['Available','Occupied','Reserved','Cleaning','Payment Pending'].map(s=><span key={s}><i className={`table-dot ${s.toLowerCase().replaceAll(' ','-')}`}/>{s}</span>)}</div></div><Card className="floor-plan">{branchTables.map(table=><button key={table.id} className={`floor-table status-${table.status.toLowerCase().replaceAll(' ','-')}`} onClick={()=>change(table)}><Table2 size={22}/><strong>{table.name}</strong><span>{table.seats} seats</span><Badge>{table.status}</Badge></button>)}</Card></div>
}

export function KitchenPage() {
  const { data, updateOrder, activeRestaurant, notify } = useApp()
  const [station, setStation] = useState('All stations')
  const kitchenQueue = useMemo(() => filterKitchenQueue(data.orders, activeRestaurant.id), [data.orders, activeRestaurant.id])

  const advanceKitchenOrder = (order) => {
    const next = getNextOrderStatus(order)
    if (!next) return
    updateOrder(order.id, { status: next, isNew: false })
    notify(`${order.number} moved to ${next}`)
  }

  const moveKitchenOrder = (orderId, _fromColumn, toColumn) => {
    const order = data.orders.find((o) => o.id === orderId)
    if (!order) return
    const nextStatus = statusForKitchenColumn(toColumn)
    if (order.status === nextStatus) return
    updateOrder(orderId, { status: nextStatus, isNew: false })
    notify(`${order.number} moved to ${nextStatus}`)
  }

  return (
    <div className="kds-page">
      <PageHeader eyebrow="KITCHEN DISPLAY SYSTEM" title="Kitchen service" description="Live tickets prioritized by preparation time — synced with the orders queue. Drag cards between columns to update status.">
        <Select value={station} onChange={(e) => setStation(e.target.value)}>
          {['All stations', 'Grill', 'Pizza', 'Drinks', 'Dessert', 'BBQ'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </PageHeader>
      <KanbanBoard
        className="kds-board"
        emptyLabel="No tickets"
        onMoveItem={moveKitchenOrder}
        columns={KITCHEN_KDS_COLUMNS.map((column) => ({
          id: column,
          title: column,
          tone: column === 'New' ? 'new' : column === 'Preparing' ? 'preparing' : 'ready',
          items: ordersInKitchenColumn(kitchenQueue, column),
        }))}
        renderCard={(order, column) => {
          const colIndex = column.items.indexOf(order)
          const actionLabel = getOrderActionLabel(order)
          return (
            <Card className={`kitchen-ticket ${colIndex === 0 ? 'priority' : ''}`}>
              <header>
                <strong>{order.number}</strong>
                <Badge>{order.type}</Badge>
                <span><Clock3 size={14} />{8 + colIndex * 3}m</span>
              </header>
              <div>{order.items.map((item) => (
                <div key={item.id}>
                  <b>{item.quantity}×</b>
                  <span>
                    <strong>{item.name}</strong>
                    {item.modifiers?.map((m) => <small key={m.name}>+ {m.name}</small>)}
                  </span>
                </div>
              ))}</div>
              <footer>
                <span>{order.type === 'Dine-in' ? 'Table T04' : order.customer}</span>
                {actionLabel && (
                  <Button size="sm" onClick={() => advanceKitchenOrder(order)}>{actionLabel}</Button>
                )}
              </footer>
            </Card>
          )
        }}
      />
    </div>
  )
}

export function InventoryPage() {
  const { data, activeRestaurant, addInventory, recordWaste, recordStockAdjustment, uploadInventoryStock } = useApp()
  const businessType = activeRestaurant.type || 'restaurant'
  const labels = getBusinessLabels(businessType)
  const inventoryCategories = getInventoryCategories(businessType)
  const wasteReasons = getWasteReasons(businessType)
  const defaultCategory = getDefaultInventoryCategory(businessType)
  const emptyForm = { name: '', sku: '', category: defaultCategory, unit: 'kg', stock: 0, minimum: 5, purchaseUnit: 'pack', packSize: 1, purchaseCost: '' }
  const [query, setQuery] = useState('')
  const [adjust, setAdjust] = useState(null)
  const [adjustMode, setAdjustMode] = useState('delta')
  const [amount, setAmount] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [open, setOpen] = useState(false)
  const [wasteOpen, setWasteOpen] = useState(false)
  const [wasteForm, setWasteForm] = useState({ inventoryItemId: '', quantity: '', reason: wasteReasons[0], notes: '' })
  const [form, setForm] = useState(emptyForm)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const uploadInputRef = useRef(null)

  const restaurantInventory = (data.inventory || []).filter((item) => item.restaurantId === activeRestaurant.id)
  const rows = restaurantInventory.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
  const value = restaurantInventory.reduce((sum, item) => sum + item.stock * item.cost, 0)
  const lowStock = restaurantInventory.filter((item) => item.stock <= item.minimum && item.stock > 0).length
  const outOfStock = restaurantInventory.filter((item) => item.stock === 0).length

  const columns = [
    { key: 'name', label: labels.inventoryItem, render: (r) => <div><strong>{r.name}</strong><small className="block">{r.sku}</small></div> },
    { key: 'category', label: labels.inventoryCategory },
    { key: 'stock', label: 'Current stock', render: (r) => <strong>{r.stock} {r.baseUnit || r.unit}</strong> },
    { key: 'minimum', label: 'Min. stock', render: (r) => `${r.minimum} ${r.baseUnit || r.unit}` },
    { key: 'purchase', label: 'Purchased as', render: (r) => {
      const label = getPurchaseUnitLabel(r.purchaseUnit || 'pack')
      const size = Number(r.packSize ?? r.conversionFactor ?? 1)
      const unit = r.unit || r.baseUnit || 'kg'
      if ((r.purchaseUnit || 'pack') !== unit && size > 1) return `${label} (${size} ${unit})`
      return label
    }},
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.stock === 0 ? 'out-of-stock' : r.stock <= r.minimum ? 'warning' : 'active'}>{r.stock === 0 ? 'Out of stock' : r.stock <= r.minimum ? 'Low stock' : 'In stock'}</Badge> },
  ]

  const saveAdjust = () => {
    recordStockAdjustment({
      inventoryItemId: adjust.id,
      mode: adjustMode === 'set' ? 'set' : 'delta',
      quantity: Number(amount),
      physicalCount: Number(amount),
      reason: adjustReason || (adjustMode === 'set' ? 'Physical count' : 'Manual adjustment'),
    })
    setAdjust(null)
    setAmount(0)
    setAdjustReason('')
    setAdjustMode('delta')
  }

  const saveWaste = (e) => {
    e.preventDefault()
    const item = restaurantInventory.find((i) => i.id === wasteForm.inventoryItemId)
    recordWaste({
      inventoryItemId: wasteForm.inventoryItemId,
      quantity: Number(wasteForm.quantity),
      unit: item?.baseUnit || item?.unit,
      reason: wasteForm.reason,
      notes: wasteForm.notes,
    })
    setWasteOpen(false)
    setWasteForm({ inventoryItemId: '', quantity: '', reason: wasteReasons[0], notes: '' })
  }

  const saveItem = (e) => {
    e.preventDefault()
    addInventory(form)
    setOpen(false)
    setForm(emptyForm)
  }

  const handleUpload = () => {
    const result = uploadInventoryStock(uploadText)
    setUploadResult(result)
    if (result?.updated?.length) {
      setUploadText('')
    }
  }

  const downloadTemplate = () => {
    downloadInventoryUploadTemplate(
      data.inventory || [],
      activeRestaurant.id,
      `stock-template-${activeRestaurant.slug || activeRestaurant.id}`,
    )
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadText(String(event.target?.result || ''))
      setUploadResult(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return <div>
    <PageHeader eyebrow="INVENTORY & SUPPLY" title={labels.inventory} description={`${restaurantInventory.length} ${labels.productPlural === 'menu items' ? 'ingredients' : 'items'} tracked for ${activeRestaurant.name}`}>
      <Button variant="outline" onClick={() => { setUploadOpen(true); setUploadResult(null) }}><Upload size={16}/> Upload stock list</Button>
      <Button variant="outline" onClick={() => setWasteOpen(true)}>Record waste</Button>
      <Button onClick={() => { setForm({ ...emptyForm, sku: `INV-${Date.now().toString(36).slice(-4).toUpperCase()}` }); setOpen(true) }}><Plus size={16}/> Add {labels.inventoryItem.toLowerCase()}</Button>
    </PageHeader>
    <div className="stat-grid four">
      <StatCard label="Total stock value" value={money(value)} icon={CircleDollarSign}/>
      <StatCard label="Low stock" value={lowStock} icon={AlertTriangle} tone="amber"/>
      <StatCard label="Out of stock" value={outOfStock} icon={Boxes} tone="red"/>
      <StatCard label="Items tracked" value={restaurantInventory.length} icon={Package} tone="blue"/>
    </div>
    <Card>
      <div className="table-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search inventory…"/></div>
      <DataTable rows={rows} columns={columns} onRowClick={setAdjust} empty={`No ${labels.inventoryItem.toLowerCase()}s yet — add ingredients to use in recipes.`}/>
    </Card>
    <Modal open={!!adjust} onClose={() => setAdjust(null)} title={`Adjust ${adjust?.name}`} description={`Current stock: ${adjust?.stock} ${adjust?.baseUnit || adjust?.unit}`}>
      <Field label="Adjustment type"><Select value={adjustMode} onChange={(e) => setAdjustMode(e.target.value)}><option value="delta">Increase / decrease</option><option value="set">Set physical count</option></Select></Field>
      <Field label={adjustMode === 'set' ? 'Physical count' : 'Adjustment quantity'} hint={adjustMode === 'set' ? 'System will calculate the difference automatically.' : 'Use negative numbers to remove stock.'}><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}/></Field>
      <Field label="Reason"><Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Stock count, spoilage correction"/></Field>
      <div className="form-actions"><Button variant="ghost" onClick={() => setAdjust(null)}>Cancel</Button><Button onClick={saveAdjust}>Save adjustment</Button></div>
    </Modal>
    <Modal open={wasteOpen} onClose={() => setWasteOpen(false)} title="Record waste" description="Creates a waste movement in the stock ledger.">
      <form onSubmit={saveWaste} className="form-grid">
        <Field label="Inventory item" required><Select required value={wasteForm.inventoryItemId} onChange={(e) => setWasteForm({ ...wasteForm, inventoryItemId: e.target.value })}><option value="">Select item…</option>{restaurantInventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <Field label="Quantity" required><Input type="number" required min="0.01" step="0.01" value={wasteForm.quantity} onChange={(e) => setWasteForm({ ...wasteForm, quantity: e.target.value })}/></Field>
        <Field label="Reason"><Select value={wasteForm.reason} onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}>{wasteReasons.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        <Field label="Notes" className="span-2"><Input value={wasteForm.notes} onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}/></Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setWasteOpen(false)}>Cancel</Button><Button type="submit">Record waste</Button></div>
      </form>
    </Modal>
    <Modal open={open} onClose={() => setOpen(false)} title={`Add ${labels.inventoryItem.toLowerCase()}`} description="Track stock in kg, liters or pieces. Enter purchase price per pack if you buy in packs (e.g. ketchup).">
      <form onSubmit={saveItem} className="form-grid">
        <Field label={`${labels.inventoryItem} name`} required hint="e.g. Ketchup, Chicken Breast"><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ketchup"/></Field>
        <Field label="SKU" required><Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}/></Field>
        <Field label={labels.inventoryCategory} hint={inventoryCategories.find((c) => c.value === form.category)?.hint}>
          <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {inventoryCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <div className="span-2 inventory-form-section">
          <p className="inventory-form-section-title">Stock on hand</p>
        </div>
        <Field label="Stock unit" required>
          <Select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
            {['kg', 'g', 'L', 'ml', 'pcs'].map((u) => {
              const info = getUnitInfo(u)
              return <option key={u} value={u}>{info.label}</option>
            })}
          </Select>
        </Field>
        <Field label={`Current stock (${form.unit})`} hint="Total you have now — e.g. 30 kg"><Input type="number" min="0" step="0.01" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}/></Field>
        <Field label={`Minimum stock (${form.unit})`}><Input type="number" min="0" step="0.01" value={form.minimum} onChange={(e) => setForm((f) => ({ ...f, minimum: e.target.value }))}/></Field>
        <div className="span-2 inventory-form-section">
          <p className="inventory-form-section-title">How you buy it</p>
          <p className="inventory-form-section-desc">e.g. Ketchup — 850 per pack, each pack is 5 kg</p>
        </div>
        <Field label="Purchased as">
          <Select value={form.purchaseUnit || 'pack'} onChange={(e) => setForm((f) => ({ ...f, purchaseUnit: e.target.value }))}>
            {PURCHASE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </Select>
        </Field>
        <Field label={`Quantity per ${getPurchaseUnitLabel(form.purchaseUnit || 'pack').toLowerCase()}`} hint={`How many ${form.unit} in one pack?`}>
          <Input type="number" min="0.001" step="0.001" value={form.packSize ?? 1} onChange={(e) => setForm((f) => ({ ...f, packSize: e.target.value }))}/>
        </Field>
        <Field label={`Cost per ${getPurchaseUnitLabel(form.purchaseUnit || 'pack').toLowerCase()}`} hint="Price for one pack, not per kg.">
          <Input type="number" min="0" placeholder="e.g. 850" value={form.purchaseCost} onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))}/>
        </Field>
        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add item</Button></div>
      </form>
    </Modal>
    <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload stock list" description="Download template, update existing stock or add new products at the bottom rows." size="lg">
      <div className="upload-template-bar">
        <Button variant="outline" onClick={downloadTemplate}><Download size={15}/> Download template (.csv)</Button>
        <Button variant="outline" onClick={() => uploadInputRef.current?.click()}><Upload size={15}/> Choose file</Button>
        <input ref={uploadInputRef} type="file" accept=".csv,text/csv" hidden onChange={handleFileSelect} />
      </div>
      <Field label="Preview / paste CSV" hint="Columns: SKU, Product Name, Unit, Current Stock, New Stock, Minimum, Category — new products: fill name + New Stock in blank rows">
        <textarea rows="10" value={uploadText} onChange={(e) => { setUploadText(e.target.value); setUploadResult(null) }} placeholder={'SKU,Product Name,Unit,Current Stock,New Stock,Minimum,Category\nNEW-001,"Olive Oil",L,0,12,5,General'} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 12 }}/>
      </Field>
      {uploadResult && (
        <div className="upload-result-summary">
          {uploadResult.updated?.length > 0 && <p className="success">{uploadResult.updated.length} item(s) stock updated</p>}
          {uploadResult.created?.length > 0 && <p className="success">{uploadResult.created.length} new product(s) added: {uploadResult.created.map((c) => c.name).join(', ')}</p>}
          {uploadResult.skipped?.length > 0 && <p className="muted">{uploadResult.skipped.length} row(s) skipped (empty New Stock)</p>}
          {uploadResult.notFound?.length > 0 && <p className="warning">{uploadResult.notFound.length} not found (missing name): {uploadResult.notFound.map((n) => n.identifier).join(', ')}</p>}
          {uploadResult.errors?.length > 0 && <p className="warning">{uploadResult.errors.length} error(s) — {uploadResult.errors.map((e) => e.reason).join('; ')}</p>}
        </div>
      )}
      <div className="form-actions"><Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button><Button onClick={handleUpload} disabled={!uploadText.trim()}><Upload size={15}/> Update stock</Button></div>
    </Modal>
  </div>
}

export function PurchasingPage() {
  const { data, activeRestaurant, updatePurchaseOrderItems, receivePurchaseOrder } = useApp()
  const [selected, setSelected] = useState(null)
  const [editItems, setEditItems] = useState([])
  const [tab, setTab] = useState('All')

  const purchaseOrders = (data.purchaseOrders || []).filter((po) => po.restaurantId === activeRestaurant.id)
  const filtered = purchaseOrders.filter((po) => tab === 'All' || po.frequency === tab.toLowerCase() || po.status === tab)

  const openPO = (po) => {
    setSelected(po)
    setEditItems((po.items || []).map((item) => ({ ...item })))
  }

  const updateItemQty = (idx, qty) => {
    setEditItems((items) => items.map((item, i) => i === idx ? { ...item, requiredQty: Number(qty) || 0 } : item))
  }

  const removeItem = (idx) => {
    setEditItems((items) => items.filter((_, i) => i !== idx))
  }

  const addItemFromInventory = (inventoryId) => {
    const inv = (data.inventory || []).find((i) => i.id === inventoryId)
    if (!inv || editItems.some((item) => item.inventoryId === inventoryId)) return
    const stock = inv.stock ?? inv.currentStock ?? 0
    const minimum = inv.minimum ?? inv.minimumStock ?? 0
    setEditItems((items) => [...items, {
      inventoryId: inv.id,
      name: inv.name,
      currentStock: stock,
      minimum,
      deficit: Math.max(0, minimum - stock),
      requiredQty: Math.max(minimum - stock, 1),
      unit: inv.unit || inv.baseUnit || 'kg',
      cost: inv.cost || 0,
    }])
  }

  const savePO = () => {
    if (!selected) return
    updatePurchaseOrderItems(selected.id, editItems)
    setSelected({ ...selected, items: editItems })
  }

  const receivePO = () => {
    if (!selected) return
    receivePurchaseOrder(selected.id)
    setSelected(null)
  }

  const columns = [
    { key: 'number', label: 'Purchase order', render: (r) => <div><strong>{r.number}</strong><small className="block">{r.title}</small></div> },
    { key: 'frequency', label: 'Frequency', render: (r) => <Badge tone="info">{r.frequency}</Badge> },
    { key: 'supplier', label: 'Supplier' },
    { key: 'generatedAt', label: 'Date' },
    { key: 'items', label: 'Items', render: (r) => (r.items || []).length },
    { key: 'total', label: 'Total', render: (r) => money(calcPOTotal(r)) },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Received' || r.status === 'Completed' ? 'active' : r.status === 'Draft' ? 'warning' : 'info'}>{r.status}</Badge> },
  ]

  const restaurantInventory = (data.inventory || []).filter((i) => i.restaurantId === activeRestaurant.id)
  const draftCount = purchaseOrders.filter((po) => po.status === 'Draft').length

  return <div>
    <PageHeader eyebrow="PROCUREMENT" title="Purchase Orders" description={`${draftCount} draft POs ready · Auto-generated daily, weekly & monthly from low stock.`}/>
    <div className="stat-grid three" style={{ marginBottom: 16 }}>
      <StatCard label="Daily POs" value={purchaseOrders.filter((po) => po.frequency === 'daily' && po.status !== 'Received').length} icon={ClipboardList}/>
      <StatCard label="Weekly POs" value={purchaseOrders.filter((po) => po.frequency === 'weekly' && po.status !== 'Received').length} icon={ClipboardList} tone="blue"/>
      <StatCard label="Monthly POs" value={purchaseOrders.filter((po) => po.frequency === 'monthly' && po.status !== 'Received').length} icon={ClipboardList} tone="violet"/>
    </div>
    <Card>
      <div className="table-toolbar"><Tabs items={['All', 'daily', 'weekly', 'monthly', 'Draft', 'Received']} active={tab} onChange={setTab}/></div>
      <DataTable rows={filtered} columns={columns} onRowClick={openPO} empty="No purchase orders yet — they auto-generate when stock is low."/>
    </Card>

    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.number} description={`${selected?.frequency} PO · ${selected?.status} · Changes sync to other POs in the group`} size="lg">
      {selected && <div>
        <DataTable rows={editItems.map((item, i) => ({ ...item, id: i }))} columns={[
          { key: 'name', label: 'Item', render: (r) => <strong>{r.name}</strong> },
          { key: 'currentStock', label: 'Stock', render: (r) => `${r.currentStock} ${r.unit || ''}` },
          { key: 'requiredQty', label: 'Order qty', render: (r) => <Input type="number" min="0" step="0.1" value={r.requiredQty} onChange={(e) => updateItemQty(r.id, e.target.value)} style={{ width: 80 }}/> },
          { key: 'cost', label: 'Est.', render: (r) => money((r.cost || 0) * (r.requiredQty || 0)) },
          { key: 'actions', label: '', render: (r) => <Button variant="ghost" size="sm" onClick={() => removeItem(r.id)}><Trash2 size={14}/></Button> },
        ]}/>
        {selected.status !== 'Received' && (
          <>
            <SectionHeader title="Add item from inventory"/>
            <Select value="" onChange={(e) => { addItemFromInventory(e.target.value); e.target.value = '' }}>
              <option value="">Select ingredient to add…</option>
              {restaurantInventory.filter((inv) => !editItems.some((item) => item.inventoryId === inv.id)).map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.name} ({inv.stock} {inv.unit})</option>
              ))}
            </Select>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <Button variant="outline" onClick={savePO}><Edit3 size={15}/> Save & sync POs</Button>
              <Button onClick={receivePO}><Package size={15}/> Receive PO (use stock)</Button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>Receiving this PO adds stock and removes these items from the other daily/weekly/monthly POs automatically.</p>
          </>
        )}
      </div>}
    </Modal>
  </div>
}

const moduleConfig={
  purchasing:{title:'Purchasing',eyebrow:'PROCUREMENT',desc:'Purchase orders, suppliers and outstanding balances.',icon:Package},
  customers:{title:'Customer CRM',eyebrow:'GUEST RELATIONSHIPS',desc:'Profiles, order history, spending and loyalty.',icon:Users},
  delivery:{title:'Delivery management',eyebrow:'LAST MILE',desc:'Riders, zones, assignments and delivery performance.',icon:Truck},
  loyalty:{title:'Loyalty & rewards',eyebrow:'RETENTION',desc:'Points, tiers, rewards and member engagement.',icon:TrendingUp},
  employees:{title:'Employees',eyebrow:'PEOPLE',desc:'Team members, roles, branches and current shifts.',icon:Users},
  shifts:{title:'Cashier shifts',eyebrow:'CASH CONTROL',desc:'Opening cash, expected balance and shift variance.',icon:CircleDollarSign},
  expenses:{title:'Expenses',eyebrow:'COST CONTROL',desc:'Track operational spending by category and branch.',icon:CircleDollarSign},
}

export function OperationsPage({type}) {
  const { data, addExpense, activeRestaurant }=useApp()
  const config=moduleConfig[type]
  const [open,setOpen]=useState(false)
  const [expense,setExpense]=useState({category:'Supplies',amount:'',description:''})
  let rows=[],columns=[]
  if(type==='customers'){rows=data.customers.filter(c=>c.restaurantId===activeRestaurant.id);const tierFor=(orders)=>orders>=10?'VIP':orders>=5?'Regular':orders>=2?'Returning':'New';columns=[{key:'name',label:'Customer',render:r=><div><strong>{r.name}</strong><small className="block">{r.phone}</small></div>},{key:'orders',label:'Orders',render:r=><strong>{r.orders}</strong>},{key:'tier',label:'Tier',render:r=>{const t=tierFor(r.orders);return <Badge tone={t==='VIP'?'active':t==='Regular'?'info':t==='Returning'?'warning':''}>{t}</Badge>}},{key:'spent',label:'Total spent',render:r=><strong>{money(r.spent)}</strong>},{key:'lastOrder',label:'Last order'},{key:'points',label:'Points',render:r=><Badge tone="info">{r.points} pts</Badge>},{key:'status',label:'Status',render:r=><Badge>{r.status}</Badge>}]}
  else if(type==='employees'){rows=data.employees.filter(e=>e.restaurantId===activeRestaurant.id);columns=[{key:'name',label:'Employee',render:r=><strong>{r.name}</strong>},{key:'role',label:'Role'},{key:'branchId',label:'Branch'},{key:'shift',label:'Shift'},{key:'lastActive',label:'Last active'},{key:'status',label:'Status',render:r=><Badge>{r.status}</Badge>}]}
  else if(type==='expenses'){rows=data.expenses;columns=[{key:'date',label:'Date'},{key:'category',label:'Category'},{key:'description',label:'Description'},{key:'amount',label:'Amount',render:r=><strong>{money(r.amount)}</strong>}]}
  else if(type==='shifts'){rows=[{id:'s1',name:'Morning · Gulberg',cashier:'Ahmed Raza',opening:25000,sales:184200,expected:204300,actual:204100,status:'Open'},{id:'s2',name:'Evening · DHA',cashier:'Fatima Khan',opening:20000,sales:242800,expected:262800,actual:262800,status:'Closed'}];columns=[{key:'name',label:'Shift'},{key:'cashier',label:'Cashier'},{key:'opening',label:'Opening cash',render:r=>money(r.opening)},{key:'sales',label:'Cash sales',render:r=>money(r.sales)},{key:'expected',label:'Expected',render:r=>money(r.expected)},{key:'status',label:'Status',render:r=><Badge>{r.status}</Badge>}]}
  else if(type==='purchasing'){return <PurchasingPage/>}
  else {rows=Array.from({length:8},(_,i)=>({id:`${type}${i}`,name:type==='delivery'?`Delivery #${1120+i}`:`Silver Member ${i+1}`,detail:type==='delivery'?['Ali Rider','Zain Rider'][i%2]:`${120+i*15} points`,value:money(950+i*280),status:['Pending','Assigned','Delivered'][i%3]}));columns=[{key:'name',label:type==='delivery'?'Delivery':'Member'},{key:'detail',label:type==='delivery'?'Rider':'Balance'},{key:'value',label:'Value'},{key:'status',label:'Status',render:r=><Badge>{r.status}</Badge>}]}
  const saveExpense=(e)=>{e.preventDefault();addExpense({...expense,amount:Number(expense.amount)});setOpen(false)}
  return <div><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.desc}><Button onClick={()=>setOpen(true)}><Plus size={16}/> {type==='expenses'?'Add expense':type==='employees'?'Add employee':type==='purchasing'?'Create PO':'New record'}</Button></PageHeader><Card><DataTable rows={rows} columns={columns} empty={`No ${config.title.toLowerCase()} yet`}/></Card>{type==='expenses'&&<Modal open={open} onClose={()=>setOpen(false)} title="Add expense" description="Record a branch operating expense."><form onSubmit={saveExpense}><Field label="Category"><Select value={expense.category} onChange={e=>setExpense({...expense,category:e.target.value})}>{['Rent','Electricity','Gas','Salaries','Supplies','Maintenance','Marketing','Delivery','Miscellaneous'].map(c=><option key={c}>{c}</option>)}</Select></Field><Field label="Amount" required><Input type="number" required value={expense.amount} onChange={e=>setExpense({...expense,amount:e.target.value})}/></Field><Field label="Description"><Input value={expense.description} onChange={e=>setExpense({...expense,description:e.target.value})}/></Field><div className="form-actions"><Button type="button" variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit">Save expense</Button></div></form></Modal>}</div>
}

export function ReportsPage() {
  const { data, activeRestaurant }=useApp()
  const gross=data.orders.filter((o)=>o.restaurantId===activeRestaurant.id).reduce((s,o)=>s+o.total,0)
  const discounts=data.orders.filter((o)=>o.restaurantId===activeRestaurant.id).reduce((s,o)=>s+o.discount,0)
  const tax=data.orders.filter((o)=>o.restaurantId===activeRestaurant.id).reduce((s,o)=>s+o.tax,0)
  const recipes=data.recipes||[]
  const inventory=data.inventory||[]
  const restaurantProducts=data.products.filter((p)=>p.restaurantId===activeRestaurant.id)
  const profitability=restaurantProducts
    .filter((p)=>recipes.some((r)=>r.productId===p.id))
    .map((p)=>{const margin=p.price-p.cost; const foodCost=p.price?((p.cost/p.price)*100):0; return {...p,margin,foodCost}})
    .sort((a,b)=>b.margin-a.margin)
  const topProfitable=profitability.slice(0,5)
  const lowestMargin=[...profitability].sort((a,b)=>a.margin-b.margin).slice(0,5)
  return <div><PageHeader eyebrow="BUSINESS INTELLIGENCE" title="Reports & analytics" description="Decision-ready sales, inventory and financial reporting."><Button variant="outline"><Printer size={16}/> Print</Button><Button><Download size={16}/> Export CSV</Button></PageHeader><div className="report-filters"><Field label="Date range"><Input type="date" defaultValue="2026-08-01"/></Field><Field label="To"><Input type="date" defaultValue="2026-08-16"/></Field><Field label="Branch"><Select><option>All branches</option><option>Gulberg</option></Select></Field><Button>Apply filters</Button></div><div className="stat-grid four"><StatCard label="Gross sales" value={money(gross)} icon={TrendingUp}/><StatCard label="Discounts" value={money(discounts)} icon={CircleDollarSign} tone="amber"/><StatCard label="Tax collected" value={money(tax)} icon={CircleDollarSign} tone="blue"/><StatCard label="Net sales" value={money(gross-discounts)} icon={CircleDollarSign} tone="violet"/></div><div className="dashboard-grid"><Card className="chart-card wide"><SectionHeader title="Revenue trend" description="Daily net sales"/><ResponsiveContainer width="100%" height={280}><BarChart data={salesTrend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day"/><YAxis hide/><Tooltip formatter={money}/><Bar dataKey="sales" fill="#0f766e" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></Card><Card><SectionHeader title="Financial summary"/><dl className="financial-list"><div><dt>Gross sales</dt><dd>{money(gross)}</dd></div><div><dt>Discounts</dt><dd>- {money(discounts)}</dd></div><div><dt>Estimated recipe COGS</dt><dd>- {money(restaurantProducts.reduce((s,p)=>s+(p.cost||0),0))}</dd></div><div><dt>Operating expenses</dt><dd>- {money(data.expenses.reduce((s,e)=>s+e.amount,0))}</dd></div><div className="total"><dt>Estimated net profit</dt><dd>{money(gross*.63-discounts)}</dd></div></dl></Card></div>{topProfitable.length>0&&<div className="dashboard-grid"><Card><SectionHeader title="Most profitable products" description="Estimated from current recipe costs"/><DataTable rows={topProfitable} columns={[{key:'name',label:'Product',render:r=><strong>{r.name}</strong>},{key:'cost',label:'Recipe cost',render:r=>money(r.cost)},{key:'price',label:'Price',render:r=>money(r.price)},{key:'margin',label:'Gross profit',render:r=>money(r.margin)},{key:'foodCost',label:'Food cost %',render:r=>`${r.foodCost.toFixed(1)}%`}]}/></Card><Card><SectionHeader title="Lowest margin products" description="Review pricing or recipe costs"/><DataTable rows={lowestMargin} columns={[{key:'name',label:'Product',render:r=><strong>{r.name}</strong>},{key:'cost',label:'Recipe cost',render:r=>money(r.cost)},{key:'price',label:'Price',render:r=>money(r.price)},{key:'margin',label:'Gross profit',render:r=>money(r.margin)},{key:'foodCost',label:'Food cost %',render:r=>`${r.foodCost.toFixed(1)}%`}]}/></Card></div>}</div>
}

export function SettingsPage() {
  const { activeRestaurant, updateRestaurant, resetDemo, notify }=useApp()
  const [tab,setTab]=useState('General')
  const tabs=['General','Branding','Online Ordering','Taxes','Payments','POS','Kitchen','Inventory','Delivery','Notifications','Users & Roles','Features','FBR'].filter(t=>!['Kitchen','Inventory','Delivery','FBR'].includes(t)||activeRestaurant.features[{Kitchen:'kds',Inventory:'inventory',Delivery:'delivery',FBR:'fbr'}[t]])
  const slug=activeRestaurant.slug||activeRestaurant.name.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
  const orderUrl=`${window.location.origin}/online-order/${slug}`
  const copyUrl=async()=>{await navigator.clipboard.writeText(orderUrl);notify('Customer ordering link copied')}
  const prep=activeRestaurant.prepSettings||{}
  const savePrep=(changes)=>updateRestaurant(activeRestaurant.id,{prepSettings:{...prep,...changes}})
  const inventorySettings={...getDefaultInventorySettings(),...(activeRestaurant.inventorySettings||{})}
  const saveInventorySettings=(changes)=>updateRestaurant(activeRestaurant.id,{inventorySettings:{...inventorySettings,...changes}})
  let content
  if(tab==='Inventory') content=<div className="settings-form">
    <SectionHeader title="Inventory deduction timing" description="Choose when stock is deducted for orders across POS, waiter terminal and online store."/>
    <div className="stock-mode-picker" style={{ gridTemplateColumns: '1fr', marginBottom: 16 }}>
      {[
        [DEDUCTION_TIMING.ON_ORDER_PLACED, 'When order is placed'],
        [DEDUCTION_TIMING.ON_ORDER_CONFIRMED, 'When order is confirmed'],
        [DEDUCTION_TIMING.ON_PAYMENT_COMPLETED, 'When payment is completed'],
        [DEDUCTION_TIMING.ON_ORDER_COMPLETED, 'When order is completed'],
      ].map(([value, label]) => (
        <label key={value} className={`stock-mode-option${inventorySettings.deductionTiming === value ? ' selected' : ''}`}>
          <input type="radio" name="deductionTiming" checked={inventorySettings.deductionTiming === value} onChange={() => saveInventorySettings({ deductionTiming: value })}/>
          <span><strong>{label}</strong></span>
        </label>
      ))}
    </div>
    <div className="cod-option"><span><Boxes size={18}/></span><div><strong>Allow selling when inventory is insufficient</strong><small>Only privileged users should use this in production.</small></div><label className="switch"><input type="checkbox" checked={!!inventorySettings.allowOversell} onChange={() => saveInventorySettings({ allowOversell: !inventorySettings.allowOversell })}/><i/></label></div>
    <Field label="Low stock threshold (servings)"><Input type="number" min="1" value={inventorySettings.lowStockThreshold ?? 10} onChange={(e) => saveInventorySettings({ lowStockThreshold: Number(e.target.value) })}/></Field>
  </div>
  else if(tab==='Online Ordering') content=<div className="settings-form"><div className="integration-status"><span><ShoppingBag size={18}/></span><div><strong>Public ordering page is live</strong><p>Share this address with customers. No staff login is required.</p></div><Badge tone={activeRestaurant.features.online?'active':'warning'}>{activeRestaurant.features.online?'Live':'Disabled'}</Badge></div><Field label="Customer ordering URL" hint="This link is unique to your restaurant."><div className="share-url"><Input value={orderUrl} readOnly/><Button variant="outline" onClick={copyUrl}><Copy size={15}/> Copy</Button><Button onClick={()=>window.open(orderUrl,'_blank')}><ExternalLink size={15}/> Open</Button></div></Field><Field label="URL name"><Input value={slug} onChange={e=>updateRestaurant(activeRestaurant.id,{slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}/></Field><SectionHeader title="Delivery time estimates" description="Controls how long customers see at checkout. Times adjust automatically based on cart items and kitchen load."/><div className="form-grid"><Field label="Base kitchen time (min)"><Input type="number" min="5" max="30" value={prep.baseMinutes??10} onChange={e=>savePrep({baseMinutes:Number(e.target.value)})}/></Field><Field label="Delivery rider time (min)"><Input type="number" min="5" max="45" value={prep.deliveryMinutes??15} onChange={e=>savePrep({deliveryMinutes:Number(e.target.value)})}/></Field><Field label="Estimate buffer (min)"><Input type="number" min="5" max="20" value={prep.rangeBuffer??10} onChange={e=>savePrep({rangeBuffer:Number(e.target.value)})}/></Field><Field label="Extra per duplicate item (min)"><Input type="number" min="0" max="10" value={prep.extraPerItemMinutes??3} onChange={e=>savePrep({extraPerItemMinutes:Number(e.target.value)})}/></Field></div><div className="cod-option"><span><Clock3 size={18}/></span><div><strong>Busy kitchen mode</strong><small>Adds {prep.busyExtraMinutes??15} min to every online order when enabled</small></div><label className="switch"><input type="checkbox" checked={!!prep.busyMode} onChange={()=>savePrep({busyMode:!prep.busyMode})}/><i/></label></div><div className="cod-option"><span><CheckCircleIcon/></span><div><strong>Cash on Delivery</strong><small>Customers pay when their food arrives</small></div><Badge tone="active">Default</Badge></div></div>
  else if(tab==='Features') content=<div className="fm-wizard-modules">{FEATURE_MODULES.map((mod)=><div key={mod.key} className="fm-wizard-mod"><h4>{mod.label}</h4><div className="feature-grid">{mod.features.map(([key,label])=><label key={key}><span><strong>{label}</strong><small>{activeRestaurant.features[key]?'Enabled':'Disabled'}</small></span><input type="checkbox" checked={activeRestaurant.features[key]} onChange={()=>updateRestaurant(activeRestaurant.id,{features:{...activeRestaurant.features,[key]:!activeRestaurant.features[key]}})}/></label>)}</div></div>)}</div>
  else if(tab==='FBR') content=<div className="settings-form"><div className="integration-status"><span><CheckCircleIcon/></span><div><strong>FBR frontend simulation</strong><p>No live API is connected. Invoice status and retry actions are simulated.</p></div><Badge tone="warning">Demo only</Badge></div><Field label="NTN"><Input defaultValue="1234567-8"/></Field><Field label="STRN"><Input defaultValue="3277876123456"/></Field><Field label="POS registration"><Select><option>Registered (simulated)</option><option>Pending</option></Select></Field><Button>Save FBR settings</Button></div>
  else content=<div className="settings-form"><Field label={`${tab} display name`}><Input defaultValue={tab==='General'?activeRestaurant.name:tab}/></Field><Field label="Configuration"><Select><option>Enabled</option><option>Disabled</option></Select></Field><Field label="Instructions"><textarea rows="4" placeholder="Add operational instructions…"/></Field><Button>Save changes</Button>{tab==='General'&&<div className="danger-zone"><div><strong>Reset demo data</strong><p>Restore all restaurants, orders and settings to their original state.</p></div><Button variant="danger" onClick={resetDemo}>Reset demo</Button></div>}</div>
  return <div><PageHeader eyebrow="CONFIGURATION" title="Restaurant settings" description="Manage how your team, locations and customer experience work."/><div className="settings-layout"><aside>{tabs.map(t=><button className={tab===t?'active':''} key={t} onClick={()=>setTab(t)}>{t}</button>)}</aside><Card><SectionHeader title={tab} description={`Configure ${tab.toLowerCase()} for ${activeRestaurant.name}.`}/>{content}</Card></div></div>
}

function CheckCircleIcon(){return <span aria-hidden="true">✓</span>}

export function FeatureGate({feature,children}){
  const {activeRestaurant}=useApp()
  const navigate=useNavigate()
  const {restaurantId}=useParams()
  if(!activeRestaurant?.features?.[feature])return <div className="feature-disabled"><span><AlertTriangle size={28}/></span><h1>Feature not enabled</h1><p>This module is not included in {activeRestaurant?.name}&apos;s current configuration.</p><Button onClick={()=>navigate(`/restaurant/${restaurantId}/settings`)}>Review feature settings</Button></div>
  return children
}
