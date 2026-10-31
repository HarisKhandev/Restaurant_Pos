import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, Bike, BookOpen, Boxes, ChefHat, Check, CircleDollarSign, ClipboardList, Copy, Eye, ExternalLink, FileText, Package, Pill, Plus, ShoppingBag, ShoppingCart, Store, Table2, Tag, Tags, TrendingUp, Truck, Users, UtensilsCrossed } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useForm } from 'react-hook-form'
import { useApp } from '../context/AppContext'
import { FEATURES, FEATURE_MODULES, BUSINESS_TYPE_FEATURES, BUSINESS_TYPE_NAV, BTYPE_COLORS, BTYPE_LABELS } from '../data/seed'
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, RowActionMenu, SearchBox, SectionHeader, Select, StatCard, Tabs, money } from '../components/ui'
import { FeatureToggleMatrix } from '../components/FeatureMatrix'

const trend = [
  { month: 'Mar', revenue: 14.2, orders: 18 }, { month: 'Apr', revenue: 16.8, orders: 21 },
  { month: 'May', revenue: 15.9, orders: 24 }, { month: 'Jun', revenue: 21.4, orders: 29 },
  { month: 'Jul', revenue: 25.7, orders: 34 }, { month: 'Aug', revenue: 29.2, orders: 39 },
]

export function SuperDashboard() {
  const { data } = useApp()
  const navigate = useNavigate()
  const active = data.restaurants.filter((item) => item.status === 'Active').length
  const revenue = data.restaurants.reduce((sum, item) => sum + item.monthlySales, 0)
  const todayOrders = data.orders.filter((item) => item.createdAt.includes('2026-08-16'))
  return <div>
    <PageHeader eyebrow="PLATFORM OVERVIEW" title="Good evening, Hamza" description="Here is what is happening across your business network today."><Button onClick={() => navigate('/super-admin/restaurants')}><Plus size={16} /> Add business</Button></PageHeader>
    <div className="stat-grid four">
      <StatCard label="Monthly platform volume" value={money(revenue)} change="+12.8% vs last month" icon={TrendingUp} />
      <StatCard label="Active restaurants" value={`${active} of ${data.restaurants.length}`} change="+1 this month" icon={Store} tone="blue" />
      <StatCard label="Orders today" value={todayOrders.length || 1842} change="+8.4% vs yesterday" icon={Activity} tone="violet" />
      <StatCard label="Active users" value="1,284" change="76 online now" icon={Users} tone="amber" />
    </div>
    <div className="dashboard-grid">
      <Card className="chart-card wide"><SectionHeader title="Platform revenue" description="Gross merchandise value across all restaurants"><Tabs items={['6 months', '12 months']} active="6 months" onChange={() => {}} /></SectionHeader>
        <div className="chart-value"><strong>PKR 29.2M</strong><Badge tone="active">↑ 13.6%</Badge></div>
        <ResponsiveContainer width="100%" height={250}><AreaChart data={trend}><defs><linearGradient id="superArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={.25}/><stop offset="100%" stopColor="#0f766e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis hide/><Tooltip formatter={(value) => [`PKR ${value}M`, 'Revenue']}/><Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2.5} fill="url(#superArea)"/></AreaChart></ResponsiveContainer>
      </Card>
      <Card className="chart-card"><SectionHeader title="Restaurant status" description="Current portfolio health" />
        <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[{ name: 'Active', value: active }, { name: 'Trial', value: 1 }, { name: 'Suspended', value: 1 }]} innerRadius={58} outerRadius={78} dataKey="value" paddingAngle={5}>{['#0f766e', '#f59e0b', '#ef4444'].map((color) => <Cell key={color} fill={color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        <div className="legend-row"><span><i className="dot green"/>Active {active}</span><span><i className="dot amber"/>Trial 1</span><span><i className="dot red"/>Suspended 1</span></div>
      </Card>
      <Card className="chart-card wide"><SectionHeader title="Orders over time" description="Daily order volume across channels" />
        <ResponsiveContainer width="100%" height={220}><BarChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis hide/><Tooltip/><Bar dataKey="orders" fill="#0f766e" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer>
      </Card>
      <Card className="alerts-card"><SectionHeader title="System attention" description="Items requiring review" />
        {[['3 subscriptions expiring', 'Within the next 14 days', 'warning'], ['2 failed transactions', 'PKR 18,450 total', 'danger'], ['5 FBR invoices pending', 'Salt & Ember · F-7', 'info']].map(([title, desc, tone]) => <button key={title}><span className={`alert-icon ${tone}`}><AlertTriangle size={17}/></span><span><strong>{title}</strong><small>{desc}</small></span><ArrowRight size={16}/></button>)}
      </Card>
    </div>
  </div>
}

function RestaurantWizard({ open, onClose }) {
  const { addRestaurant } = useApp()
  const [step, setStep] = useState(1)
  const [features, setFeatures] = useState(Object.fromEntries(FEATURES.map(([key]) => [key, true])))
  const [colors, setColors] = useState({ primary: '#0f766e', secondary: '#134e4a', accent: '#f59e0b' })
  const { register, handleSubmit, formState: { errors }, watch } = useForm({ defaultValues: { plan: 'Professional', currency: 'PKR', city: 'Lahore', type: 'restaurant' } })
  const typeVal = watch('type') || 'restaurant'
  const typeLabel = { restaurant: 'Restaurant', bakery: 'Bakery', pharmacy: 'Pharmacy', mart: 'Mart', retail: 'Retail' }[typeVal] || 'Business'
  const name = watch('name') || 'Your Restaurant'
  const submit = (values) => {
    if (step < 5) return setStep((value) => value + 1)
    addRestaurant({ ...values, branding: { ...colors, mark: name.split(' ').map((word) => word[0]).join('').slice(0, 3).toUpperCase() }, features })
    onClose()
    setStep(1)
  }
  return <Modal open={open} onClose={onClose} title={`Create ${typeLabel}`} description={`Step ${step} of 5 · ${['Basic information', 'Business information', 'Branding', 'Subscription', 'Features'][step - 1]}`} size="xl">
    <div className="stepper">{[1,2,3,4,5].map((item) => <span key={item} className={item <= step ? 'active' : ''}><i>{item < step ? <Check size={13}/> : item}</i></span>)}</div>
    <form onSubmit={handleSubmit(submit)}>
      {step === 1 && <div className="form-grid"><Field label="Business type" required className="span-2"><Select {...register('type')}><option value="restaurant">Restaurant</option><option value="bakery">Bakery</option><option value="pharmacy">Pharmacy</option><option value="mart">Mart / Grocery</option><option value="retail">Retail Store</option></Select></Field><Field label="Business name" required error={errors.name?.message}><Input {...register('name', { required: 'Business name is required' })} placeholder="e.g. Cedar Kitchen"/></Field><Field label="Legal name"><Input {...register('legalName')} placeholder="Registered business name"/></Field><Field label="Owner name" required error={errors.owner?.message}><Input {...register('owner', { required: 'Owner name is required' })}/></Field><Field label="City"><Select {...register('city')}>{['Lahore','Islamabad','Karachi','Rawalpindi','Faisalabad','Multan'].map((city) => <option key={city}>{city}</option>)}</Select></Field><Field label="Phone" required><Input {...register('phone', { required: true })} placeholder="03XX XXXXXXX"/></Field><Field label="Login email" required error={errors.email?.message}><Input type="email" {...register('email', { required: 'Login email is required' })} placeholder="owner@business.pk"/></Field><Field label="Login password" required error={errors.loginPassword?.message}><Input type="text" {...register('loginPassword', { required: 'Login password is required', minLength: { value: 6, message: 'At least 6 characters' } })} placeholder="Set owner login password"/></Field><Field label="Address" className="span-2"><Input {...register('address')} placeholder="Complete business address"/></Field></div>}
      {step === 2 && <div className="form-grid"><Field label="NTN"><Input {...register('ntn')} placeholder="1234567-8"/></Field><Field label="STRN"><Input {...register('strn')} placeholder="Optional"/></Field><Field label="Currency"><Select {...register('currency')}><option>PKR</option></Select></Field><Field label="Tax rate (%)"><Input type="number" {...register('taxRate')} defaultValue="16"/></Field><Field label="FBR status"><Select {...register('fbrStatus')}><option>Not configured</option><option>Registered</option><option>Pending verification</option></Select></Field></div>}
      {step === 3 && <div className="branding-editor"><div className="color-fields">{Object.keys(colors).map((key) => <Field key={key} label={`${key[0].toUpperCase()}${key.slice(1)} color`}><div className="color-input"><input type="color" value={colors[key]} onChange={(event) => setColors((value) => ({ ...value, [key]: event.target.value }))}/><Input value={colors[key]} onChange={(event) => setColors((value) => ({ ...value, [key]: event.target.value }))}/></div></Field>)}</div><div className="brand-preview" style={{ '--preview-primary': colors.primary, '--preview-secondary': colors.secondary, '--preview-accent': colors.accent }}><span>LIVE PREVIEW</span><div><i>{name.slice(0, 2).toUpperCase()}</i><strong>{name}</strong></div><button>Place order</button></div></div>}
      {step === 4 && <div className="plan-picker">{['Starter', 'Professional', 'Enterprise'].map((plan) => <label key={plan}><input type="radio" value={plan} {...register('plan')}/><span><strong>{plan}</strong><small>{plan === 'Starter' ? 'PKR 8,900 / month' : plan === 'Professional' ? 'PKR 18,900 / month' : 'Custom pricing'}</small><em>{plan === 'Starter' ? 'Core POS and reporting' : plan === 'Professional' ? 'Complete restaurant operations' : 'Scale without limits'}</em></span></label>)}</div>}
      {step === 5 && <div className="fm-wizard-modules">{FEATURE_MODULES.map((mod) => {
        const allowed = BUSINESS_TYPE_FEATURES[watch('type')] || BUSINESS_TYPE_FEATURES.restaurant
        const items = mod.features.filter(([key]) => allowed.includes(key))
        if (!items.length) return null
        return <div key={mod.key} className="fm-wizard-mod"><h4>{mod.label}</h4><div className="feature-grid">{items.map(([key, label]) => <label key={key}><span><strong>{label}</strong><small>{features[key] ? 'Enabled' : 'Disabled'}</small></span><input type="checkbox" checked={features[key]} onChange={() => setFeatures((value) => ({ ...value, [key]: !value[key] }))}/></label>)}</div></div>
      })}</div>}
      <div className="form-actions"><Button type="button" variant="ghost" onClick={step === 1 ? onClose : () => setStep((value) => value - 1)}>{step === 1 ? 'Cancel' : 'Back'}</Button><Button type="submit">{step === 5 ? 'Create business' : 'Continue'} <ArrowRight size={16}/></Button></div>
    </form>
  </Modal>
}

export function RestaurantsPage() {
  const { data, updateRestaurant, switchRestaurant } = useApp()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const filtered = data.restaurants.filter((item) => (status === 'All' || item.status === status) && `${item.name} ${item.owner} ${item.city}`.toLowerCase().includes(query.toLowerCase()))
  const columns = [
    { key: 'name', label: 'Restaurant', render: (row) => <div className="entity-cell"><span style={{ background: row.branding.primary }}>{row.branding.mark}</span><div><strong>{row.name}</strong><small>{row.owner} · {(row.type || 'restaurant').charAt(0).toUpperCase() + (row.type || 'restaurant').slice(1)}</small></div></div> },
    { key: 'type', label: 'Type', render: (row) => <Badge style={{ background: { restaurant:'#0f766e', bakery:'#b45309', pharmacy:'#059669', mart:'#2563eb', retail:'#7c3aed' }[row.type || 'restaurant'], color:'#fff' }}>{(row.type || 'restaurant').charAt(0).toUpperCase() + (row.type || 'restaurant').slice(1)}</Badge> },
    { key: 'city', label: 'City' }, { key: 'plan', label: 'Plan', render: (row) => <Badge tone="info">{row.plan}</Badge> },
    { key: 'branches', label: 'Branches', render: (row) => data.branches.filter((item) => item.restaurantId === row.id).length },
    { key: 'monthlySales', label: 'Monthly sales', render: (row) => <strong>{money(row.monthlySales)}</strong> },
    { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
    { key: 'action', label: '', stopRowClick: true, render: (row) => <RowActionMenu items={[
      { label: 'View details', icon: Eye, onClick: () => navigate(`/super-admin/restaurants/${row.id}`) },
      { label: 'Open restaurant', icon: ExternalLink, onClick: () => { switchRestaurant(row.id); navigate(`/restaurant/${row.id}/dashboard`) } },
      { label: row.status === 'Suspended' ? 'Activate business' : 'Suspend business', icon: row.status === 'Suspended' ? Check : AlertTriangle, danger: row.status !== 'Suspended', onClick: () => updateRestaurant(row.id, { status: row.status === 'Suspended' ? 'Active' : 'Suspended' }) },
    ]} /> },
  ]
  return <div><PageHeader eyebrow="BUSINESS MANAGEMENT" title="Businesses" description={`${data.restaurants.length} businesses across your platform`}><Button onClick={() => setCreateOpen(true)}><Plus size={16}/> Add business</Button></PageHeader>
    <Card><div className="table-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search businesses…"/><Tabs items={['All','Active','Trial','Suspended']} active={status} onChange={setStatus}/></div><DataTable rows={filtered} columns={columns} onRowClick={(row) => navigate(`/super-admin/restaurants/${row.id}`)}/></Card>
    <RestaurantWizard open={createOpen} onClose={() => setCreateOpen(false)}/>
  </div>
}

export function RestaurantDetail() {
  const { id } = useParams()
  const { data, updateRestaurant, switchRestaurant, notify } = useApp()
  const navigate = useNavigate()
  const restaurant = data.restaurants.find((item) => item.id === id)
  const [tab, setTab] = useState('Overview')
  if (!restaurant) return <Card>Restaurant not found.</Card>
  const branches = data.branches.filter((item) => item.restaurantId === id)
  const enabledCount = Object.values(restaurant.features).filter(Boolean).length
  const slug = restaurant.slug || restaurant.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const menuUrl = `${window.location.origin}/online-order/${slug}`
  const openRestaurant = () => { switchRestaurant(id); navigate(`/restaurant/${id}/dashboard`) }
  const openMenu = () => window.open(menuUrl, '_blank')
  const copyMenuUrl = async () => { await navigator.clipboard.writeText(menuUrl); notify('Menu link copied') }
  return <div><button className="back-link" onClick={() => navigate('/super-admin/restaurants')}>← Businesses</button>
    <Card className="profile-hero"><div className="profile-mark" style={{ background: restaurant.branding.primary }}>{restaurant.branding.mark}</div><div><div className="title-line"><h1>{restaurant.name}</h1><Badge>{restaurant.status}</Badge><Badge tone="info">{(restaurant.type || 'restaurant').charAt(0).toUpperCase() + (restaurant.type || 'restaurant').slice(1)}</Badge></div><p>{restaurant.legalName} · {restaurant.city}</p><span>Created {restaurant.createdAt} · {restaurant.plan} plan</span></div><div className="profile-actions"><Button variant="secondary" onClick={() => updateRestaurant(id, { status: restaurant.status === 'Suspended' ? 'Active' : 'Suspended' })}>{restaurant.status === 'Suspended' ? 'Activate' : 'Suspend'}</Button><Button variant="outline" onClick={openMenu}><UtensilsCrossed size={16}/> Open menu</Button><Button onClick={openRestaurant}><Eye size={16}/> Open restaurant</Button></div></Card>
    <Tabs items={['Overview','Branches','Features','Branding','Subscription','Activity','Users']} active={tab} onChange={setTab}/>
    <div className="tab-panel">
    {tab === 'Overview' && <div className="detail-grid"><Card><SectionHeader title="Business profile"/><dl className="detail-list"><div><dt>Owner</dt><dd>{restaurant.owner}</dd></div><div><dt>Email</dt><dd>{restaurant.email}</dd></div><div><dt>Phone</dt><dd>{restaurant.phone}</dd></div><div><dt>Address</dt><dd>{restaurant.address}</dd></div><div><dt>Type</dt><dd>{(restaurant.type || 'restaurant').charAt(0).toUpperCase() + (restaurant.type || 'restaurant').slice(1)}</dd></div></dl><Field label="Menu link" hint={`Public customer ordering page · /online-order/${slug}`}><div className="share-url"><Input value={menuUrl} readOnly/><Button variant="outline" onClick={copyMenuUrl}><Copy size={15}/> Copy</Button><Button onClick={openMenu}><ExternalLink size={15}/> Open</Button></div></Field></Card><Card><SectionHeader title="Platform usage"/><div className="mini-stats"><div><strong>{branches.length}</strong><span>Branches</span></div><div><strong>{restaurant.users}</strong><span>Active users</span></div><div><strong>{enabledCount}</strong><span>Features</span></div><div><strong>{money(restaurant.monthlySales)}</strong><span>Monthly sales</span></div></div></Card></div>}
    {tab === 'Branches' && <Card><SectionHeader title="Restaurant branches"/><DataTable rows={branches} columns={[{key:'name',label:'Branch'},{key:'city',label:'City'},{key:'manager',label:'Manager'},{key:'terminals',label:'Terminals'},{key:'tables',label:'Tables'},{key:'status',label:'Status',render:(row)=><Badge>{row.status}</Badge>}]}/></Card>}
    {tab === 'Features' && <Card><SectionHeader title="Enabled modules & features" description="Sell each POS module independently. Navigation updates immediately."/>{FEATURE_MODULES.map((mod) => <div key={mod.key} className="fm-wizard-mod"><h4>{mod.label}</h4><div className="feature-grid">{mod.features.map(([key,label])=><label key={key}><span><strong>{label}</strong><small>{restaurant.features[key]?'Available to restaurant':'Hidden and protected'}</small></span><input type="checkbox" checked={restaurant.features[key]} onChange={()=>updateRestaurant(id,{features:{...restaurant.features,[key]:!restaurant.features[key]}})}/></label>)}</div></div>)}</Card>}
    {tab === 'Branding' && <BrandingPanel restaurant={restaurant} onSave={(branding)=>updateRestaurant(id,{branding})}/>}
    {tab === 'Subscription' && <Plans compact current={restaurant.plan} onSelect={(plan)=>updateRestaurant(id,{plan})}/>}
    {tab === 'Activity' && <Card><SectionHeader title="Recent activity"/><div className="timeline">{['Restaurant settings updated','New branch manager invited','Professional plan renewed','FBR configuration reviewed'].map((item,index)=><div key={item}><i/><span><strong>{item}</strong><small>{index+1} day{index?'s':''} ago · Hamza Qureshi</small></span></div>)}</div></Card>}
    {tab === 'Users' && <Card><SectionHeader title="Business users"/><DataTable rows={data.users.filter(u => u.restaurantId === id)} columns={[{key:'name',label:'Name',render:(r)=><strong>{r.name}</strong>},{key:'email',label:'Email'},{key:'role',label:'Role',render:(r)=><Badge tone="info">{r.role}</Badge>},{key:'action',label:'',stopRowClick:true,render:(r)=><Button size="sm" variant="ghost" style={{color:'var(--error,#ef4444)'}} onClick={(e)=>{e.stopPropagation();updateRestaurant(id,{})}}>Remove</Button>}]}/></Card>}
    </div>
  </div>
}

function BrandingPanel({ restaurant, onSave }) {
  const [branding, setBranding] = useState(restaurant.branding)
  return <Card><SectionHeader title="Branding engine" description="Changes flow into the restaurant workspace and ordering experience."/><div className="branding-editor"><div className="color-fields">{['primary','secondary','accent'].map((key)=><Field key={key} label={`${key[0].toUpperCase()}${key.slice(1)} color`}><div className="color-input"><input type="color" value={branding[key]} onChange={(event)=>setBranding({...branding,[key]:event.target.value})}/><Input value={branding[key]} onChange={(event)=>setBranding({...branding,[key]:event.target.value})}/></div></Field>)}<Button onClick={()=>onSave(branding)}>Save branding</Button></div><div className="brand-preview" style={{'--preview-primary':branding.primary,'--preview-secondary':branding.secondary,'--preview-accent':branding.accent}}><span>LIVE PREVIEW</span><div><i>{branding.mark}</i><strong>{restaurant.name}</strong></div><p>Fresh food, delivered with care.</p><button>Start your order</button></div></div></Card>
}

export function Plans({ compact = false, current, onSelect }) {
  const plans = [
    { name:'Starter', price:'PKR 8,900', desc:'For single-location businesses', features:['Core POS & billing','Basic reports','2 POS terminals','Email support'] },
    { name:'Professional', price:'PKR 18,900', desc:'For growing business groups', features:['Everything in Starter','Inventory & purchasing','KDS & online ordering','CRM, loyalty & delivery'] },
    { name:'Enterprise', price:'Custom', desc:'For large multi-brand operators', features:['Unlimited branches','Advanced analytics','FBR & permissions','Custom branding & support'] },
  ]
  return <div><PageHeader eyebrow={compact?undefined:'COMMERCIALS'} title={compact?'Choose a subscription':'Plans & pricing'} description="Flexible plans that grow with your business."/><div className="pricing-grid">{plans.map((plan)=><Card key={plan.name} className={plan.name==='Professional'?'featured-plan':''}>{plan.name==='Professional'&&<span className="popular">MOST POPULAR</span>}<h2>{plan.name}</h2><p>{plan.desc}</p><strong>{plan.price}<small>{plan.price!=='Custom'?' / month':''}</small></strong><ul>{plan.features.map((feature)=><li key={feature}><Check size={16}/>{feature}</li>)}</ul><Button variant={current===plan.name?'secondary':plan.name==='Professional'?'primary':'outline'} onClick={()=>onSelect?.(plan.name)}>{current===plan.name?'Current plan':'Select plan'}</Button></Card>)}</div></div>
}

const BTYPE_CONFIG = {
  restaurant: { icon: UtensilsCrossed, color: '#0f766e', label: 'Restaurant', desc: 'Full-service dining with kitchen, tables, waiters, dine-in, takeaway and delivery.', features: BUSINESS_TYPE_FEATURES.restaurant, nav: BUSINESS_TYPE_NAV.restaurant },
  bakery: { icon: UtensilsCrossed, color: '#b45309', label: 'Bakery', desc: 'Bakery counter with recipes, production kitchen, dine-in and delivery.', features: BUSINESS_TYPE_FEATURES.bakery, nav: BUSINESS_TYPE_NAV.bakery },
  pharmacy: { icon: Pill, color: '#059669', label: 'Pharmacy', desc: 'Medicine dispensing with barcode POS, inventory tracking and delivery.', features: BUSINESS_TYPE_FEATURES.pharmacy, nav: BUSINESS_TYPE_NAV.pharmacy },
  mart: { icon: ShoppingCart, color: '#2563eb', label: 'Mart', desc: 'Grocery and general store with barcode scanning, stock management and delivery.', features: BUSINESS_TYPE_FEATURES.mart, nav: BUSINESS_TYPE_NAV.mart },
  retail: { icon: Tag, color: '#7c3aed', label: 'Retail', desc: 'Fashion and merchandise retail with barcode POS, inventory and purchasing.', features: BUSINESS_TYPE_FEATURES.retail, nav: BUSINESS_TYPE_NAV.retail },
}

const NAV_ICONS = { Dashboard: TrendingUp, POS: ShoppingBag, Orders: ClipboardList, Tables: Table2, Kitchen: ChefHat, 'Kitchen Progress': ChefHat, Menu: UtensilsCrossed, Offers: Tags, Recipes: BookOpen, Inventory: Boxes, 'Stock Lists': Package, Purchasing: Package, Customers: Users, Delivery: Truck, Loyalty: Tags, Employees: Users, Roles: Users, Shifts: CircleDollarSign, Expenses: CircleDollarSign, Ledger: FileText, Reports: TrendingUp, Settings: TrendingUp }

export function BusinessTypesPage() {
  const { data, updateRestaurant } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [detailTab, setDetailTab] = useState('Overview')
  const types = Object.entries(BTYPE_CONFIG)

  const bizByType = (type) => data.restaurants.filter((r) => r.type === type)
  const usersByType = (type) => (data.users || []).filter((u) => { const r = data.restaurants.find((x) => x.id === u.restaurantId); return r?.type === type })
  const ordersByType = (type) => data.orders.filter((o) => { const r = data.restaurants.find((x) => x.id === o.restaurantId); return r?.type === type })
  const revenueByType = (type) => bizByType(type).reduce((s, r) => s + r.monthlySales, 0)

  const totalBiz = data.restaurants.length
  const totalRevenue = data.restaurants.reduce((s, r) => s + r.monthlySales, 0)
  const totalUsers = (data.users || []).filter((u) => u.restaurantId).length
  const totalOrders = data.orders.length

  const cfg = selected ? BTYPE_CONFIG[selected] : null
  const selBiz = selected ? bizByType(selected) : []
  const selUsers = selected ? usersByType(selected) : []
  const selOrders = selected ? ordersByType(selected) : []
  const selRevenue = selected ? revenueByType(selected) : 0
  const selActive = selBiz.filter((r) => r.status === 'Active').length

  return <div>
    <PageHeader eyebrow="PLATFORM CONFIGURATION" title="Business Types" description="Manage, monitor and configure the five supported business verticals across your platform.">
      <Button onClick={() => navigate('/super-admin/restaurants')}><Plus size={16} /> Add Business</Button>
    </PageHeader>

    <div className="stat-grid four" style={{ marginBottom: 24 }}>
      <StatCard label="Total businesses" value={totalBiz} icon={Store} />
      <StatCard label="Platform revenue" value={money(totalRevenue)} icon={TrendingUp} tone="blue" />
      <StatCard label="Active users" value={totalUsers} icon={Users} tone="violet" />
      <StatCard label="Total orders" value={totalOrders} icon={ClipboardList} tone="amber" />
    </div>

    <div className="btype-grid">{types.map(([key, c]) => {
      const count = bizByType(key).length
      const rev = revenueByType(key)
      const users = usersByType(key).length
      const orders = ordersByType(key).length
      const activeCount = bizByType(key).filter((r) => r.status === 'Active').length
      const Icon = c.icon
      const isSelected = selected === key
      return <Card key={key} className={`btype-card-v2 ${isSelected ? 'btype-selected' : ''}`} onClick={() => { setSelected(key); setDetailTab('Overview') }} style={{ '--btype-accent': c.color }}>
        <div className="btype-v2-top">
          <div className="btype-v2-icon" style={{ background: `${c.color}14`, color: c.color }}><Icon size={22} /></div>
          <Badge tone={count ? 'active' : 'warning'}>{activeCount} active</Badge>
        </div>
        <h3>{c.label}</h3>
        <p>{c.desc}</p>
        <div className="btype-v2-stats">
          <div><strong>{count}</strong><small>Businesses</small></div>
          <div><strong>{money(rev, true)}</strong><small>Revenue</small></div>
          <div><strong>{users}</strong><small>Users</small></div>
          <div><strong>{orders}</strong><small>Orders</small></div>
        </div>
        <div className="btype-v2-bar">
          <div style={{ width: totalRevenue ? `${(rev / totalRevenue) * 100}%` : '0%' }} />
        </div>
        <small className="btype-v2-share">{totalRevenue ? ((rev / totalRevenue) * 100).toFixed(1) : 0}% of platform revenue</small>
      </Card>
    })}</div>

    {selected && cfg && <div className="btype-detail-v2">
      <div className="btype-detail-banner" style={{ '--bdc': cfg.color }}>
        <div className="btype-banner-icon" style={{ background: cfg.color }}>{(() => { const I = cfg.icon; return <I size={26} /> })()}</div>
        <div className="btype-banner-info">
          <h2>{cfg.label} Vertical</h2>
          <p>{cfg.desc}</p>
          <div className="btype-banner-chips">
            <span><Store size={13} /> {selBiz.length} businesses</span>
            <span><Users size={13} /> {selUsers.length} users</span>
            <span><ClipboardList size={13} /> {selOrders.length} orders</span>
            <span><TrendingUp size={13} /> {money(selRevenue)}</span>
          </div>
        </div>
        <div className="btype-banner-actions">
          <Button variant="outline" onClick={() => navigate('/super-admin/restaurants')}><Plus size={14} /> Add {cfg.label}</Button>
          <Button variant="outline" onClick={() => setDetailTab('Features')}><Tags size={14} /> Features</Button>
        </div>
      </div>

      <Tabs items={['Overview', 'Businesses', 'Features', 'Navigation', 'Users']} active={detailTab} onChange={setDetailTab} />

      {detailTab === 'Overview' && <div>
        <div className="stat-grid four">
          <StatCard label={`${cfg.label} businesses`} value={selBiz.length} icon={Store} />
          <StatCard label="Active" value={selActive} change={`${selBiz.length ? ((selActive / selBiz.length) * 100).toFixed(0) : 0}% active rate`} icon={Activity} tone="blue" />
          <StatCard label="Monthly revenue" value={money(selRevenue)} change={`${totalRevenue ? ((selRevenue / totalRevenue) * 100).toFixed(1) : 0}% of platform`} icon={TrendingUp} tone="violet" />
          <StatCard label="Team members" value={selUsers.length} icon={Users} tone="amber" />
        </div>

        <div className="dashboard-grid">
          <Card className="chart-card wide">
            <SectionHeader title={`${cfg.label} businesses`} description="Quick overview of all registered businesses in this vertical.">
              <Button size="sm" variant="outline" onClick={() => setDetailTab('Businesses')}>View all <ArrowRight size={14} /></Button>
            </SectionHeader>
            {selBiz.length ? <DataTable rows={selBiz.slice(0, 5)} columns={[
              { key: 'name', label: 'Business', render: (r) => <div className="entity-cell"><span style={{ background: r.branding?.primary || cfg.color }}>{r.branding?.mark || r.name.slice(0, 2).toUpperCase()}</span><div><strong>{r.name}</strong><small>{r.owner} · {r.city}</small></div></div> },
              { key: 'plan', label: 'Plan', render: (r) => <Badge tone="info">{r.plan}</Badge> },
              { key: 'monthlySales', label: 'Revenue', render: (r) => <strong>{money(r.monthlySales)}</strong> },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Active' ? 'active' : r.status === 'Trial' ? 'warning' : ''}>{r.status}</Badge> },
            ]} onRowClick={(r) => navigate(`/super-admin/restaurants/${r.id}`)} /> : <div className="btype-empty"><Store size={32} /><p>No {cfg.label.toLowerCase()} businesses registered yet.</p><Button onClick={() => navigate('/super-admin/restaurants')}><Plus size={14} /> Create {cfg.label}</Button></div>}
          </Card>
          <Card className="chart-card">
            <SectionHeader title="Capabilities" description="Features enabled for this type" />
            <div className="btype-cap-list">{cfg.features.slice(0, 8).map((fKey) => {
              const fLabel = FEATURES.find(([k]) => k === fKey)?.[1] || fKey
              return <div key={fKey} className="btype-cap-item"><span className="btype-cap-dot" style={{ background: cfg.color }} /><span>{fLabel}</span></div>
            })}{cfg.features.length > 8 && <div className="btype-cap-item muted">+{cfg.features.length - 8} more</div>}</div>
            <div style={{ marginTop: 14 }}>
              <SectionHeader title="Pages" description="Navigation items" />
              <div className="btype-cap-list">{cfg.nav.slice(0, 8).map((name) => {
                const Icon = NAV_ICONS[name] || ClipboardList
                return <div key={name} className="btype-cap-item"><Icon size={13} /><span>{name}</span></div>
              })}{cfg.nav.length > 8 && <div className="btype-cap-item muted">+{cfg.nav.length - 8} more pages</div>}</div>
            </div>
          </Card>
        </div>

        <Card>
          <SectionHeader title="Available roles" description={`Roles that can be created within ${cfg.label.toLowerCase()} businesses.`} />
          <div className="btype-roles-grid">
            {(selected === 'restaurant' || selected === 'bakery' ? ['Restaurant Owner', 'Branch Manager', 'Cashier', 'Kitchen Staff', 'Waiter', 'Delivery Rider'] : ['Restaurant Owner', 'Branch Manager', 'Cashier', 'Delivery Rider']).map((role) => {
              const roleIcon = { 'Restaurant Owner': Store, 'Branch Manager': Users, Cashier: ShoppingBag, 'Kitchen Staff': ChefHat, Waiter: ClipboardList, 'Delivery Rider': Bike }[role] || Users
              const RIcon = roleIcon
              const roleCount = selUsers.filter((u) => u.role === role).length
              return <div key={role} className="btype-role-chip">
                <span className="btype-role-icon" style={{ background: `${cfg.color}14`, color: cfg.color }}><RIcon size={16} /></span>
                <div><strong>{role === 'Restaurant Owner' ? 'Business Owner' : role}</strong><small>{roleCount} {roleCount === 1 ? 'user' : 'users'}</small></div>
              </div>
            })}
          </div>
        </Card>
      </div>}

      {detailTab === 'Businesses' && <Card className="btype-section">
        <SectionHeader title={`All ${cfg.label} Businesses`} description="Click a business to open its management panel.">
          <Button size="sm" onClick={() => navigate('/super-admin/restaurants')}><Plus size={14} /> Add {cfg.label}</Button>
        </SectionHeader>
        {selBiz.length ? <DataTable rows={selBiz} columns={[
          { key: 'name', label: 'Business', render: (r) => <div className="entity-cell"><span style={{ background: r.branding?.primary || cfg.color }}>{r.branding?.mark || r.name.slice(0, 2).toUpperCase()}</span><div><strong>{r.name}</strong><small>{r.owner}</small></div></div> },
          { key: 'city', label: 'City' },
          { key: 'branches', label: 'Branches', render: (r) => data.branches.filter((b) => b.restaurantId === r.id).length },
          { key: 'users', label: 'Users', render: (r) => (data.users || []).filter((u) => u.restaurantId === r.id).length },
          { key: 'plan', label: 'Plan', render: (r) => <Badge tone="info">{r.plan}</Badge> },
          { key: 'monthlySales', label: 'Revenue', render: (r) => <strong>{money(r.monthlySales)}</strong> },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Active' ? 'active' : ''}>{r.status}</Badge> },
        ]} onRowClick={(r) => navigate(`/super-admin/restaurants/${r.id}`)} /> : <div className="btype-empty"><Store size={32} /><p>No {cfg.label.toLowerCase()} businesses yet.</p><Button onClick={() => navigate('/super-admin/restaurants')}><Plus size={14} /> Create one</Button></div>}
      </Card>}

      {detailTab === 'Features' && <Card className="btype-section">
        <SectionHeader title={`${cfg.label} Feature Configuration`} description={`${cfg.features.length} of ${FEATURES.length} platform features are available for ${cfg.label.toLowerCase()} businesses. Grayed-out features are not applicable to this business type.`} />
        <div className="feature-grid">{FEATURES.map(([key, label]) => {
          const included = cfg.features.includes(key)
          return <label key={key} className={included ? '' : 'feature-excluded'}>
            <span><strong>{label}</strong><small>{included ? 'Enabled for all ' + cfg.label.toLowerCase() + ' businesses' : 'Not applicable to this type'}</small></span>
            <span className={`btype-feature-dot ${included ? 'on' : 'off'}`} />
          </label>
        })}</div>
      </Card>}

      {detailTab === 'Navigation' && <Card className="btype-section">
        <SectionHeader title={`${cfg.label} Sidebar Navigation`} description={`${cfg.nav.length} pages are visible to owners and managers of ${cfg.label.toLowerCase()} businesses. ${restaurantLinks_ALL.length - cfg.nav.length} pages are hidden.`} />
        <div className="btype-nav-list">{cfg.nav.map((name) => {
          const Icon = NAV_ICONS[name] || ClipboardList
          return <div key={name} className="btype-nav-item"><span className="btype-nav-icon" style={{ background: `${cfg.color}14`, color: cfg.color }}><Icon size={16} /></span><strong>{name}</strong></div>
        })}</div>
        {restaurantLinks_ALL.filter((name) => !cfg.nav.includes(name)).length > 0 && <div className="btype-excluded">
          <SectionHeader title="Hidden from this type" description="These pages only appear in other business types." />
          <div className="btype-nav-list muted">{restaurantLinks_ALL.filter((name) => !cfg.nav.includes(name)).map((name) => {
            const Icon = NAV_ICONS[name] || ClipboardList
            return <div key={name} className="btype-nav-item excluded"><span className="btype-nav-icon"><Icon size={16} /></span><strong>{name}</strong></div>
          })}</div>
        </div>}
      </Card>}

      {detailTab === 'Users' && <Card className="btype-section">
        <SectionHeader title={`${cfg.label} Users`} description={`All user accounts across ${cfg.label.toLowerCase()} businesses.`} />
        {selUsers.length ? <DataTable rows={selUsers} columns={[
          { key: 'name', label: 'User', render: (r) => <div><strong>{r.name}</strong><small className="block">{r.email}</small></div> },
          { key: 'role', label: 'Role', render: (r) => <Badge tone="info">{r.role}</Badge> },
          { key: 'business', label: 'Business', render: (r) => { const biz = data.restaurants.find((x) => x.id === r.restaurantId); return biz ? <strong>{biz.name}</strong> : '—' } },
          { key: 'branch', label: 'Branch', render: (r) => { const br = data.branches.find((b) => b.id === r.branchId); return br?.name || 'All' } },
        ]} /> : <div className="btype-empty"><Users size={32} /><p>No users in {cfg.label.toLowerCase()} businesses yet.</p></div>}
      </Card>}
    </div>}
  </div>
}

const restaurantLinks_ALL = ['Dashboard', 'POS', 'Orders', 'Tables', 'Kitchen', 'Kitchen Progress', 'Menu', 'Offers', 'Recipes', 'Inventory', 'Stock Lists', 'Purchasing', 'Customers', 'Delivery', 'Loyalty', 'Employees', 'Roles', 'Shifts', 'Expenses', 'Ledger', 'Reports', 'Settings']

export function SuperGeneric({ type }) {
  const { data } = useApp()
  const config = {
    subscriptions: ['Subscriptions','Manage billing, renewal dates and account standing.'],
    'audit-logs': ['Audit logs','A reliable record of important platform activity.'],
  }[type] || ['Page', '']
  const rows = type === 'audit-logs' ? data.restaurants.flatMap((r,index)=>[{id:`a${index}`,restaurant:r.name,action:['Settings updated','Subscription renewed','Feature enabled'][index%3],user:r.owner,time:`${index+1} hours ago`,ip:`192.168.1.${20+index}`}]) : data.restaurants
  return <div><PageHeader eyebrow="PLATFORM CONTROL" title={config[0]} description={config[1]}/><Card><DataTable rows={rows} columns={type==='audit-logs'?[{key:'action',label:'Activity'},{key:'restaurant',label:'Business'},{key:'user',label:'Actor'},{key:'time',label:'Time'},{key:'ip',label:'IP address'}]:[{key:'name',label:'Business'},{key:'plan',label:'Plan',render:r=><Badge tone="info">{r.plan}</Badge>},{key:'status',label:'Status',render:r=><Badge>{r.status}</Badge>},{key:'monthlySales',label:'Monthly volume',render:r=>money(r.monthlySales)},{key:'createdAt',label:'Since'}]}/></Card></div>
}

const FEATURE_ICONS = { pos: ShoppingBag, inventory: Boxes, kds: ChefHat, online: Truck, delivery: Bike, tables: Table2, reservations: ClipboardList, loyalty: Tags, crm: Users, reports: TrendingUp, accounting: CircleDollarSign, fbr: FileText, riders: Bike, expenses: CircleDollarSign, purchasing: Package }
const MODULE_ICONS = { sales: ShoppingBag, front_of_house: Table2, kitchen: ChefHat, online: Truck, delivery: Bike, inventory: Boxes, customers: Users, finance: CircleDollarSign }
const FEATURE_DESCRIPTIONS = { pos: 'Point of sale billing, checkout, barcode scanning and payment processing.', inventory: 'Stock tracking, ingredient management, low-stock alerts and auto-reorder triggers.', kds: 'Kitchen display system with live order tickets, station routing and prep timing.', online: 'Online ordering storefront with real-time menu sync and order confirmation.', delivery: 'Delivery management with rider assignment, route tracking and status updates.', tables: 'Table layout management, reservations, section mapping and occupancy tracking.', reservations: 'Advance booking system with time slots, party size and confirmation workflow.', loyalty: 'Customer loyalty points, rewards tiers, referral tracking and redemption.', crm: 'Customer relationship management with profiles, order history and segmentation.', reports: 'Advanced analytics, sales reports, trend analysis and exportable dashboards.', accounting: 'Financial accounting integration, P&L tracking and tax report generation.', fbr: 'FBR (Federal Board of Revenue) fiscal integration and invoice reporting.', riders: 'Rider fleet management, performance tracking, zone assignment and route optimization.', expenses: 'Expense recording, categorization, approval workflows and budget tracking.', purchasing: 'Purchase order generation, supplier management and automated stock list creation.' }

export function FeatureManagementPage() {
  const { data, updateRestaurant, notify } = useApp()
  const navigate = useNavigate()
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [matrixType, setMatrixType] = useState('All')
  const [viewMode, setViewMode] = useState('Features')

  const totalBiz = data.restaurants.length
  const featureAdoption = FEATURES.map(([key, label]) => {
    const enabled = data.restaurants.filter((r) => r.features?.[key]).length
    const byType = Object.keys(BUSINESS_TYPE_FEATURES).map((t) => ({ type: t, available: BUSINESS_TYPE_FEATURES[t].includes(key), enabled: data.restaurants.filter((r) => r.type === t && r.features?.[key]).length, total: data.restaurants.filter((r) => r.type === t).length }))
    return { key, label, enabled, total: totalBiz, pct: totalBiz ? Math.round((enabled / totalBiz) * 100) : 0, byType, icon: FEATURE_ICONS[key] || Tags, desc: FEATURE_DESCRIPTIONS[key] || '' }
  })

  const avgAdoption = featureAdoption.length ? Math.round(featureAdoption.reduce((s, f) => s + f.pct, 0) / featureAdoption.length) : 0
  const mostUsed = [...featureAdoption].sort((a, b) => b.enabled - a.enabled)[0]
  const leastUsed = [...featureAdoption].filter((f) => f.enabled > 0).sort((a, b) => a.enabled - b.enabled)[0]
  const fullyAdopted = featureAdoption.filter((f) => f.pct === 100).length

  const sel = selectedFeature ? featureAdoption.find((f) => f.key === selectedFeature) : null

  const toggleFeatureForBiz = (bizId, featureKey) => {
    const biz = data.restaurants.find((r) => r.id === bizId)
    if (!biz) return
    updateRestaurant(bizId, { features: { ...biz.features, [featureKey]: !biz.features?.[featureKey] } })
  }

  const enableForAll = (featureKey) => {
    data.restaurants.forEach((r) => {
      if (!r.features?.[featureKey]) updateRestaurant(r.id, { features: { ...r.features, [featureKey]: true } })
    })
    notify('Feature enabled for all businesses')
  }

  const disableForAll = (featureKey) => {
    data.restaurants.forEach((r) => {
      if (r.features?.[featureKey]) updateRestaurant(r.id, { features: { ...r.features, [featureKey]: false } })
    })
    notify('Feature disabled for all businesses')
  }

  const renderFeatureCard = (f) => {
    const Icon = f.icon
    const isSelected = selectedFeature === f.key
    return <Card key={f.key} className={`fm-card ${isSelected ? 'fm-selected' : ''}`} onClick={() => setSelectedFeature(isSelected ? null : f.key)}>
      <div className="fm-card-top">
        <div className="fm-card-icon"><Icon size={20} /></div>
        <div className="fm-adoption-ring" style={{ '--fm-pct': f.pct }}>
          <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray={`${f.pct} ${100 - f.pct}`} strokeDashoffset="25" strokeLinecap="round" /></svg>
          <span>{f.pct}%</span>
        </div>
      </div>
      <h3>{f.label}</h3>
      <p>{f.desc}</p>
      <div className="fm-card-meta">
        <span><strong>{f.enabled}</strong> of {f.total} businesses</span>
        <div className="fm-type-dots">{f.byType.map((t) => <span key={t.type} className={`fm-type-dot ${t.available ? '' : 'na'}`} style={{ background: t.available ? BTYPE_COLORS[t.type] : undefined }} title={`${BTYPE_LABELS[t.type]}: ${t.available ? (t.enabled + '/' + t.total + ' enabled') : 'N/A'}`} />)}</div>
      </div>
    </Card>
  }

  return <div>
    <PageHeader eyebrow="PLATFORM CONTROL" title="Feature Management" description={`Sell ${FEATURE_MODULES.length} POS modules and ${FEATURES.length} features across ${totalBiz} businesses.`}>
      <Button onClick={() => setMatrixOpen(true)}><Table2 size={16} /> Toggle Matrix</Button>
    </PageHeader>

    <div className="stat-grid four">
      <StatCard label="Sellable modules" value={FEATURE_MODULES.length} change={`${FEATURES.length} features`} icon={ShoppingBag} />
      <StatCard label="Avg adoption" value={`${avgAdoption}%`} change="Across all businesses" icon={TrendingUp} tone="blue" />
      <StatCard label="Most adopted" value={mostUsed?.label || '—'} change={`${mostUsed?.pct || 0}% of businesses`} icon={mostUsed?.icon || Tags} tone="violet" />
      <StatCard label="Fully adopted" value={fullyAdopted} change={`${FEATURES.length - fullyAdopted} partial`} icon={Check} tone="amber" />
    </div>

    <div style={{ marginBottom: 16 }}><Tabs items={['Features', 'By Business Type']} active={viewMode} onChange={setViewMode} /></div>

    {viewMode === 'Features' && FEATURE_MODULES.map((mod) => {
      const ModIcon = MODULE_ICONS[mod.key] || Tags
      const cards = featureAdoption.filter((f) => mod.features.some(([key]) => key === f.key))
      return <section key={mod.key} className="fm-module">
        <div className="fm-module-head">
          <span className="fm-module-icon"><ModIcon size={18} /></span>
          <div>
            <small>SELLABLE MODULE</small>
            <h2>{mod.label}</h2>
            <p>{mod.desc}</p>
          </div>
          <span className="fm-module-count">{mod.features.length} {mod.features.length === 1 ? 'feature' : 'features'}</span>
        </div>
        <div className="fm-grid">{cards.map(renderFeatureCard)}</div>
      </section>
    })}

    {viewMode === 'By Business Type' && <div>
      {Object.entries(BTYPE_CONFIG).map(([typeKey, typeCfg]) => {
        const typeBiz = data.restaurants.filter((r) => r.type === typeKey)
        const TypeIcon = typeCfg.icon
        return <Card key={typeKey} style={{ marginBottom: 16 }}>
          <div className="fm-type-header">
            <span className="fm-type-badge" style={{ background: typeCfg.color }}><TypeIcon size={16} /></span>
            <div><h3>{typeCfg.label}</h3><small>{typeBiz.length} businesses · {typeCfg.features.length} features available</small></div>
          </div>
          <div className="fm-type-features">{FEATURE_MODULES.map((mod) => (
            <div key={mod.key} className="fm-type-module">
              <div className="fm-type-mod">{mod.label}</div>
              {mod.features.map(([fKey, fLabel]) => {
                const available = typeCfg.features.includes(fKey)
                const enabled = typeBiz.filter((r) => r.features?.[fKey]).length
                const FIcon = FEATURE_ICONS[fKey] || Tags
                return <div key={fKey} className={`fm-type-row ${available ? '' : 'fm-na'}`}>
                  <FIcon size={15} />
                  <span className="fm-type-fname">{fLabel}</span>
                  {available ? <>
                    <div className="fm-mini-bar"><div style={{ width: typeBiz.length ? `${(enabled / typeBiz.length) * 100}%` : '0%', background: typeCfg.color }} /></div>
                    <span className="fm-type-count">{enabled}/{typeBiz.length}</span>
                  </> : <span className="fm-type-na">N/A</span>}
                </div>
              })}
            </div>
          ))}</div>
        </Card>
      })}
    </div>}

    {sel && <div className="fm-detail">
      <Card>
        <div className="fm-detail-header">
          <div className="fm-detail-icon"><sel.icon size={24} /></div>
          <div className="fm-detail-info">
            <small className="fm-detail-module">{FEATURE_MODULES.find((m) => m.features.some(([k]) => k === sel.key))?.label || 'Module'}</small>
            <h2>{sel.label}</h2>
            <p>{sel.desc}</p>
          </div>
          <div className="fm-detail-actions">
            <Button size="sm" variant="outline" onClick={() => enableForAll(sel.key)}>Enable all</Button>
            <Button size="sm" variant="ghost" onClick={() => disableForAll(sel.key)}>Disable all</Button>
          </div>
        </div>

        <div className="fm-detail-types">
          <SectionHeader title="Availability by business type" description="Which business types support this feature and current adoption." />
          <div className="fm-avail-grid">{sel.byType.map((t) => <div key={t.type} className={`fm-avail-card ${t.available ? '' : 'fm-avail-na'}`}>
            <span className="fm-avail-dot" style={{ background: t.available ? BTYPE_COLORS[t.type] : 'var(--line)' }} />
            <strong>{BTYPE_LABELS[t.type]}</strong>
            {t.available ? <><div className="fm-mini-bar"><div style={{ width: t.total ? `${(t.enabled / t.total) * 100}%` : '0%', background: BTYPE_COLORS[t.type] }} /></div><small>{t.enabled} of {t.total} enabled</small></> : <small>Not applicable</small>}
          </div>)}</div>
        </div>

        <SectionHeader title="Per-business control" description="Toggle this feature on or off for individual businesses." />
        <DataTable rows={data.restaurants} columns={[
          { key: 'name', label: 'Business', render: (r) => <div className="entity-cell"><span style={{ background: r.branding?.primary || '#0f766e' }}>{r.branding?.mark || r.name.slice(0, 2).toUpperCase()}</span><div><strong>{r.name}</strong><small>{(r.type || 'restaurant').charAt(0).toUpperCase() + (r.type || 'restaurant').slice(1)} · {r.city}</small></div></div> },
          { key: 'type', label: 'Type', render: (r) => <Badge style={{ background: `${BTYPE_COLORS[r.type] || '#0f766e'}18`, color: BTYPE_COLORS[r.type] || '#0f766e' }}>{BTYPE_LABELS[r.type] || 'Restaurant'}</Badge> },
          { key: 'available', label: 'Available', render: (r) => BUSINESS_TYPE_FEATURES[r.type]?.includes(sel.key) ? <Badge tone="active">Yes</Badge> : <Badge>N/A</Badge> },
          { key: 'enabled', label: 'Status', render: (r) => <Badge tone={r.features?.[sel.key] ? 'active' : ''}>{r.features?.[sel.key] ? 'Enabled' : 'Disabled'}</Badge> },
          { key: 'toggle', label: '', render: (r) => <label className="fm-toggle"><input type="checkbox" checked={!!r.features?.[sel.key]} onChange={() => toggleFeatureForBiz(r.id, sel.key)} /><span /></label> },
        ]} onRowClick={(r) => navigate(`/super-admin/restaurants/${r.id}`)} />
      </Card>
    </div>}

    <Modal open={matrixOpen} onClose={() => setMatrixOpen(false)} title="Feature Toggle Matrix" description="Enable or disable sellable modules and features per business." size="xxl">
      <FeatureToggleMatrix businesses={data.restaurants} typeFilter={matrixType} onTypeFilter={setMatrixType} onToggle={toggleFeatureForBiz} />
    </Modal>
  </div>
}
