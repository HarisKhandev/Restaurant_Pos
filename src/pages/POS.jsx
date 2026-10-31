import { useCallback, useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { Bike, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard, Globe, LogOut, MapPin, MessageCircle, Minus, Pause, Percent, Plus, Printer, QrCode, ReceiptText, Search, ShoppingBag, SlidersHorizontal, Smartphone, Tag, Trash2, User, Users, UtensilsCrossed, WalletCards, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ModifierModal from '../components/ModifierModal'
import { NotificationBell } from '../components/NotificationBell'
import { Badge, Button, Field, Modal, Select, money } from '../components/ui'
import { buildCartSignature } from '../utils/cartLines'
import { calculateProductAvailability } from '../utils/inventoryAvailability'
import { getProductStockStatus, STOCK_STATUSES } from '../utils/inventoryAvailability'
import { productHasModifiers, withResolvedModifiers } from '../utils/productModifiers'
import { getMenuCategories } from '../utils/businessConfig'
import { getBranchRiders, getBranchWaiters } from '../utils/staffResolver'

const initials = (name = '') => name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?'

const tableStatusTone = {
  Available: 'available',
  Occupied: 'occupied',
  Reserved: 'reserved',
  Cleaning: 'cleaning',
  'Payment Pending': 'payment-pending',
}

const ORDER_SOURCES = [
  { value: 'Website', icon: Globe, tone: 'web' },
  { value: 'Mobile App', icon: Smartphone, tone: 'app' },
  { value: 'FoodPanda', icon: ShoppingBag, tone: 'panda' },
  { value: 'Cheetay', icon: Bike, tone: 'cheetay' },
  { value: 'Instagram', icon: Tag, tone: 'social' },
  { value: 'WhatsApp', icon: MessageCircle, tone: 'whatsapp' },
]

const ORDER_TYPES = [
  { value: 'Dine-in', icon: UtensilsCrossed, label: 'Dine-in' },
  { value: 'Takeaway', icon: ShoppingBag, label: 'Takeaway' },
  { value: 'Delivery', icon: Bike, label: 'Delivery' },
  { value: 'Pickup', icon: MapPin, label: 'Pickup' },
]

function OrderTypeSelector({ value, onChange }) {
  return (
    <div className="order-type-selector" role="tablist" aria-label="Order type">
      {ORDER_TYPES.map(({ value: type, icon: Icon, label }) => (
        <button
          key={type}
          type="button"
          role="tab"
          aria-selected={value === type}
          className={value === type ? 'active' : ''}
          onClick={() => onChange(type)}
        >
          <Icon size={14} strokeWidth={2.1} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

const PickerContext = createContext(null)

function PickerProvider({ children }) {
  const [activeId, setActiveId] = useState(null)
  return <PickerContext.Provider value={{ activeId, openPicker: setActiveId, closePicker: () => setActiveId(null) }}>{children}</PickerContext.Provider>
}

function usePosPicker(id) {
  const context = useContext(PickerContext)
  const [query, setQuery] = useState('')
  const open = context?.activeId === id
  const openPicker = () => context?.openPicker(id)
  const closePicker = () => { context?.closePicker(); setQuery('') }
  const toggle = () => (open ? closePicker() : openPicker())

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') closePicker() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return { open, openPicker, closePicker, toggle, query, setQuery }
}

function PosPickerSheet({ open, title, meta, onClose, children }) {
  if (!open) return null
  return createPortal(
    <div className="pos-picker-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="pos-picker-sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="pos-picker-sheet-head">
          <div><strong>{title}</strong>{meta && <span>{meta}</span>}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={17}/></button>
        </header>
        <div className="pos-picker-sheet-body">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}

function PosPickerTrigger({ selected, placeholderIcon: PlaceholderIcon, placeholderTitle, placeholderHint, onClick, open }) {
  return <button type="button" className={`pos-picker-trigger${selected ? ' selected' : ''}${open ? ' open' : ''}`} onClick={onClick} aria-expanded={open}>
    {selected || <>
      <span className="pos-picker-placeholder-icon">{PlaceholderIcon && <PlaceholderIcon size={16}/>}</span>
      <span className="pos-picker-trigger-body"><strong>{placeholderTitle}</strong><small>{placeholderHint}</small></span>
    </>}
    <ChevronRight size={15} className="pos-picker-chevron"/>
  </button>
}

function PosPickerSearch({ value, onChange, placeholder }) {
  return <div className="pos-picker-search"><Search size={14}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/></div>
}

function TablePicker({ value, tables, onChange, openOrders = [], onSettle }) {
  const { open, closePicker, toggle, query, setQuery } = usePosPicker('table')
  const selected = tables.find((table) => table.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const orderForTable = (tableId) => openOrders.find((order) => order.tableId === tableId)

  const sections = tables.reduce((groups, table) => {
    if (normalizedQuery && !`${table.name} ${table.section} ${table.status}`.toLowerCase().includes(normalizedQuery)) return groups
    const section = table.section || 'Floor'
    if (!groups[section]) groups[section] = []
    groups[section].push(table)
    return groups
  }, {})

  const pick = (table) => {
    const pendingOrder = orderForTable(table.id)
    if (pendingOrder && onSettle) {
      onSettle(pendingOrder)
      closePicker()
      return
    }
    if (table.status !== 'Available' && table.id !== value) return
    onChange(table.id === value ? '' : table.id)
    closePicker()
  }

  return <>
    <PosPickerTrigger
      open={open}
      onClick={toggle}
      placeholderIcon={UtensilsCrossed}
      placeholderTitle="Select table"
      placeholderHint="Tap to view floor plan"
      selected={selected ? <>
        <span className={`pos-table-chip tone-${tableStatusTone[selected.status] || 'available'}`}>{selected.name.replace(/^T/, '')}</span>
        <span className="pos-picker-trigger-body"><strong>Table {selected.name}</strong><small>{selected.seats} seats · {selected.section}</small></span>
        <Badge tone={selected.status === 'Available' ? 'active' : 'warning'}>{selected.status}</Badge>
      </> : null}
    />
    <PosPickerSheet open={open} title="Select table" meta={`${tables.filter((table) => table.status === 'Available').length} available`} onClose={closePicker}>
      <PosPickerSearch value={query} onChange={setQuery} placeholder="Search table or section…"/>
      <div className="pos-picker-scroll">
        {Object.keys(sections).length ? Object.entries(sections).map(([section, sectionTables]) => (
          <section key={section} className="pos-picker-group">
            <header>{section}<span>{sectionTables.length}</span></header>
            <div className="pos-table-grid">
              {sectionTables.map((table) => {
                const disabled = table.status !== 'Available' && table.id !== value && !orderForTable(table.id)
                const tone = tableStatusTone[table.status] || 'available'
                const pendingOrder = orderForTable(table.id)
                return <button key={table.id} type="button" className={`pos-table-option tone-${tone}${value === table.id ? ' active' : ''}${disabled ? ' disabled' : ''}${pendingOrder ? ' has-dues' : ''}`} onClick={() => pick(table)} disabled={disabled}>
                  <span className="pos-table-option-mark">{table.name.replace(/^T/, '')}</span>
                  <strong>{table.name}</strong>
                  <small><Users size={11}/> {table.seats}</small>
                  <em>{pendingOrder ? `Due ${money(pendingOrder.total)}` : table.status}</em>
                  {value === table.id && <i><Check size={12}/></i>}
                </button>
              })}
            </div>
          </section>
        )) : <p className="pos-picker-empty">No tables match your search.</p>}
      </div>
    </PosPickerSheet>
  </>
}

function StaffPicker({ id, value, items, onChange, title, meta, placeholderTitle, placeholderHint, placeholderIcon: PlaceholderIcon, renderSelected, renderOption }) {
  const { open, closePicker, toggle, query, setQuery } = usePosPicker(id)
  const selected = items.find((item) => item.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = items.filter((item) => !normalizedQuery || item.searchText.toLowerCase().includes(normalizedQuery))

  return <>
    <PosPickerTrigger open={open} onClick={toggle} placeholderIcon={PlaceholderIcon} placeholderTitle={placeholderTitle} placeholderHint={placeholderHint} selected={selected ? renderSelected(selected) : null}/>
    <PosPickerSheet open={open} title={title} meta={meta} onClose={closePicker}>
      <PosPickerSearch value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}…`}/>
      <div className="pos-picker-scroll pos-picker-list">
        {filtered.length ? filtered.map((item) => (
          <button key={item.id} type="button" className={`pos-list-option${value === item.id ? ' active' : ''}${item.disabled ? ' disabled' : ''}`} onClick={() => { if (item.disabled) return; onChange(item.id === value ? '' : item.id); closePicker() }} disabled={item.disabled}>
            {renderOption(item, value === item.id)}
          </button>
        )) : <p className="pos-picker-empty">No results found.</p>}
      </div>
    </PosPickerSheet>
  </>
}

function WaiterPicker({ value, waiters, onChange }) {
  const items = waiters.map((waiter) => ({ ...waiter, searchText: `${waiter.name} ${waiter.shift}`, disabled: false }))
  return <StaffPicker
    id="waiter"
    value={value}
    items={items}
    onChange={onChange}
    title="Assign waiter"
    meta={`${waiters.length} on floor`}
    placeholderTitle="Assign waiter"
    placeholderHint="Select floor staff"
    placeholderIcon={User}
    renderSelected={(waiter) => <>
      <span className="pos-staff-avatar">{initials(waiter.name)}</span>
      <span className="pos-picker-trigger-body"><strong>{waiter.name}</strong><small>{waiter.shift} shift</small></span>
    </>}
    renderOption={(waiter, active) => <>
      <span className="pos-staff-avatar">{initials(waiter.name)}</span>
      <span className="pos-list-option-body"><strong>{waiter.name}</strong><small>{waiter.shift} shift · {waiter.lastActive}</small></span>
      <Badge tone="active">Available</Badge>
      {active && <i><Check size={14}/></i>}
    </>}
  />
}

function CustomerPicker({ value, customers, onChange, onClear }) {
  const { open, closePicker, toggle, query, setQuery } = usePosPicker('customer')
  const selected = customers.find((customer) => customer.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = customers.filter((customer) => !normalizedQuery || `${customer.name} ${customer.phone} ${customer.area}`.toLowerCase().includes(normalizedQuery))

  const pick = (customerId) => {
    if (!customerId || customerId === value) onClear()
    else onChange(customerId)
    closePicker()
  }

  return <>
    <PosPickerTrigger
      open={open}
      onClick={toggle}
      placeholderIcon={User}
      placeholderTitle="Select customer"
      placeholderHint="Walk-in or saved profile"
      selected={selected ? <>
        <span className="pos-staff-avatar">{initials(selected.name)}</span>
        <span className="pos-picker-trigger-body"><strong>{selected.name}</strong><small>{selected.phone}{selected.area ? ` · ${selected.area}` : ''}</small></span>
      </> : null}
    />
    <PosPickerSheet open={open} title="Select customer" meta={`${customers.length} profiles`} onClose={closePicker}>
      <PosPickerSearch value={query} onChange={setQuery} placeholder="Search name or phone…"/>
      <div className="pos-picker-scroll pos-picker-list">
        <button type="button" className={`pos-list-option walk-in${!value ? ' active' : ''}`} onClick={() => pick('')}>
          <span className="pos-picker-placeholder-icon"><User size={16}/></span>
          <span className="pos-list-option-body"><strong>Walk-in / New customer</strong><small>Enter details manually below</small></span>
          {!value && <i><Check size={14}/></i>}
        </button>
        {filtered.map((customer) => (
          <button key={customer.id} type="button" className={`pos-list-option${value === customer.id ? ' active' : ''}`} onClick={() => pick(customer.id)}>
            <span className="pos-staff-avatar">{initials(customer.name)}</span>
            <span className="pos-list-option-body"><strong>{customer.name}</strong><small>{customer.phone} · {customer.area || 'No area'} · {customer.points} pts</small></span>
            {value === customer.id && <i><Check size={14}/></i>}
          </button>
        ))}
      </div>
    </PosPickerSheet>
  </>
}

function RiderPicker({ value, riders, onChange, optional = false }) {
  const items = riders.map((rider) => ({
    ...rider,
    searchText: `${rider.name} ${rider.zone} ${rider.status}`,
    disabled: rider.status === 'Off Duty',
  }))
  return <StaffPicker
    id={optional ? 'rider-opt' : 'rider'}
    value={value}
    items={items}
    onChange={onChange}
    title={optional ? 'Assign rider (optional)' : 'Assign rider'}
    meta={`${riders.filter((rider) => rider.status === 'Available').length} available`}
    placeholderTitle={optional ? 'Assign rider' : 'Assign rider'}
    placeholderHint="Choose delivery partner"
    placeholderIcon={Bike}
    renderSelected={(rider) => <>
      <span className="pos-rider-avatar"><Bike size={15}/></span>
      <span className="pos-picker-trigger-body"><strong>{rider.name}</strong><small>{rider.zone} · {rider.status}</small></span>
    </>}
    renderOption={(rider, active) => <>
      <span className="pos-rider-avatar"><Bike size={15}/></span>
      <span className="pos-list-option-body"><strong>{rider.name}</strong><small>{rider.zone} · {rider.vehicle} · {rider.completedToday} trips today</small></span>
      <Badge tone={rider.status === 'Available' ? 'active' : 'warning'}>{rider.status}</Badge>
      {active && <i><Check size={14}/></i>}
    </>}
  />
}

function SourcePicker({ value, onChange }) {
  const { open, closePicker, toggle } = usePosPicker('source')
  const selected = ORDER_SOURCES.find((source) => source.value === value)
  const SelectedIcon = selected?.icon

  return <>
    <PosPickerTrigger
      open={open}
      onClick={toggle}
      placeholderIcon={Globe}
      placeholderTitle="Order source"
      placeholderHint="Where the order came from"
      selected={selected ? <>
        <span className={`pos-source-icon tone-${selected.tone}`}><SelectedIcon size={15}/></span>
        <span className="pos-picker-trigger-body"><strong>{selected.value}</strong><small>Online channel</small></span>
      </> : null}
    />
    <PosPickerSheet open={open} title="Order source" meta="Select channel" onClose={closePicker}>
      <div className="pos-source-grid">
        {ORDER_SOURCES.map((source) => {
          const Icon = source.icon
          return <button key={source.value} type="button" className={`pos-source-option tone-${source.tone}${value === source.value ? ' active' : ''}`} onClick={() => { onChange(source.value === value ? '' : source.value); closePicker() }}>
            <span className="pos-source-icon"><Icon size={18}/></span>
            <strong>{source.value}</strong>
            {value === source.value && <i><Check size={13}/></i>}
          </button>
        })}
      </div>
    </PosPickerSheet>
  </>
}

const emptyOrderDetails = () => ({
  customerId: '',
  customerName: '',
  customerPhone: '',
  tableId: '',
  waiterId: '',
  guestCount: '2',
  pickupTime: '',
  deliveryAddress: '',
  deliveryArea: '',
  deliveryNotes: '',
  riderId: '',
  orderSource: 'Website',
  onlineReference: '',
  vehicleInfo: '',
})

function OrderDetailsForm({ orderType, details, onChange, customers, tables, waiters, riders, openOrders = [], onSettle }) {
  const set = (key, value) => onChange({ ...details, [key]: value })

  const pickCustomer = (customerId) => {
    const customer = customers.find((item) => item.id === customerId)
    if (!customer) {
      onChange({ ...details, customerId: '', customerName: '', customerPhone: '', deliveryAddress: '', deliveryArea: '' })
      return
    }
    onChange({
      ...details,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.address || details.deliveryAddress,
      deliveryArea: customer.area || details.deliveryArea,
    })
  }

  const customerFields = <>
    <CustomerPicker value={details.customerId} customers={customers} onChange={pickCustomer} onClear={() => pickCustomer('')}/>
    <div className="order-details-grid compact">
      <input className="pos-field-input" value={details.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="Name"/>
      <input className="pos-field-input" value={details.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="Phone"/>
    </div>
  </>

  const wrap = (content) => <PickerProvider><div className="order-details-inner">{content}</div></PickerProvider>

  if (orderType === 'Dine-in') {
    return wrap(<>
      <div className="order-details-section">
        <span className="order-details-section-title">Service</span>
        <TablePicker value={details.tableId} tables={tables} onChange={(tableId) => set('tableId', tableId)} openOrders={openOrders} onSettle={onSettle}/>
        <WaiterPicker value={details.waiterId} waiters={waiters} onChange={(waiterId) => set('waiterId', waiterId)}/>
        <label className="order-inline-field"><span>Guests</span><input className="pos-field-input" type="number" min="1" value={details.guestCount} onChange={(e) => set('guestCount', e.target.value)} placeholder="2"/></label>
      </div>
      <div className="order-details-section">
        <span className="order-details-section-title">Customer</span>
        {customerFields}
      </div>
    </>)
  }

  if (orderType === 'Takeaway') {
    return wrap(<>
      <div className="order-details-section">
        <span className="order-details-section-title">Customer</span>
        {customerFields}
        <label className="order-inline-field"><span>Ready by</span><div className="pos-field-with-icon"><Clock size={14}/><input className="pos-field-input" type="time" value={details.pickupTime} onChange={(e) => set('pickupTime', e.target.value)}/></div></label>
      </div>
    </>)
  }

  if (orderType === 'Delivery') {
    return wrap(<>
      <div className="order-details-section">
        <span className="order-details-section-title">Customer</span>
        {customerFields}
      </div>
      <div className="order-details-section">
        <span className="order-details-section-title">Delivery</span>
        <label className="order-inline-field stack"><span>Address</span><textarea className="pos-field-textarea" rows={2} value={details.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} placeholder="House / street / landmark"/></label>
        <label className="order-inline-field"><span>Area</span><div className="pos-field-with-icon"><MapPin size={14}/><input className="pos-field-input" value={details.deliveryArea} onChange={(e) => set('deliveryArea', e.target.value)} placeholder="Gulberg, DHA…"/></div></label>
        <RiderPicker value={details.riderId} riders={riders} onChange={(riderId) => set('riderId', riderId)}/>
        <label className="order-inline-field"><span>Notes</span><input className="pos-field-input" value={details.deliveryNotes} onChange={(e) => set('deliveryNotes', e.target.value)} placeholder="Gate code, floor…"/></label>
      </div>
    </>)
  }

  if (orderType === 'Pickup') {
    return wrap(<>
      <div className="order-details-section">
        <span className="order-details-section-title">Customer</span>
        {customerFields}
        <label className="order-inline-field"><span>Pickup time</span><div className="pos-field-with-icon"><Clock size={14}/><input className="pos-field-input" type="time" value={details.pickupTime} onChange={(e) => set('pickupTime', e.target.value)}/></div></label>
        <label className="order-inline-field"><span>Vehicle</span><input className="pos-field-input" value={details.vehicleInfo} onChange={(e) => set('vehicleInfo', e.target.value)} placeholder="White Corolla · ABC-123"/></label>
      </div>
    </>)
  }

  return wrap(<>
    <div className="order-details-section">
      <span className="order-details-section-title">Customer</span>
      {customerFields}
    </div>
    <div className="order-details-section">
      <span className="order-details-section-title">Channel</span>
      <SourcePicker value={details.orderSource} onChange={(orderSource) => set('orderSource', orderSource)}/>
      <label className="order-inline-field"><span>Reference</span><input className="pos-field-input" value={details.onlineReference} onChange={(e) => set('onlineReference', e.target.value)} placeholder="ORD-12345"/></label>
      <label className="order-inline-field stack"><span>Address</span><textarea className="pos-field-textarea" rows={2} value={details.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} placeholder="If delivering this order"/></label>
      <RiderPicker value={details.riderId} riders={riders} onChange={(riderId) => set('riderId', riderId)} optional/>
    </div>
  </>)
}

function OrderMetaChips({ orderType, details, context }) {
  const chips = []
  if (orderType === 'Dine-in') {
    const table = context.tables.find((item) => item.id === details.tableId)
    const waiter = context.waiters.find((item) => item.id === details.waiterId)
    if (table) chips.push(table.name)
    if (waiter) chips.push(waiter.name)
    if (details.guestCount) chips.push(`${details.guestCount} guests`)
  }
  if (orderType === 'Delivery' || orderType === 'Online') {
    if (details.deliveryArea) chips.push(details.deliveryArea)
    const rider = context.riders.find((item) => item.id === details.riderId)
    if (rider) chips.push(rider.name)
  }
  if (orderType === 'Online' && details.orderSource) chips.push(details.orderSource)
  if (details.customerName) chips.push(details.customerName)
  if (orderType === 'Takeaway' || orderType === 'Pickup') {
    if (details.pickupTime) chips.push(`Ready ${details.pickupTime}`)
  }
  if (!chips.length) return null
  return <div className="order-meta-chips">{chips.slice(0, 4).map((chip, index) => <span key={`${chip}-${index}`}>{chip}</span>)}</div>
}

function CartLine({ item, onQuantity }) {
  return <article className="cart-line order-item-enter">
    <div className="cart-line-media">{item.image ? <img src={item.image} alt=""/> : <ShoppingBag size={16}/>}</div>
    <div className="cart-line-body">
      <div className="cart-line-top"><strong>{item.name}</strong><span>{money(item.lineTotal * item.quantity)}</span></div>
      {item.modifiers?.length > 0 && <div className="cart-line-mods">{item.modifiers.map((mod) => <span key={mod.name}>{mod.name}</span>)}</div>}
      <div className="cart-line-qty">
        <button type="button" aria-label="Decrease quantity" onClick={() => onQuantity(item.lineId, -1)}><Minus size={12}/></button>
        <span>{item.quantity}</span>
        <button type="button" aria-label="Increase quantity" onClick={() => onQuantity(item.lineId, 1)}><Plus size={12}/></button>
      </div>
    </div>
  </article>
}

function Receipt({ order, restaurant, branch, onNew, onClose, pendingPayment = false }) {
  if (!order) return null

  const orderDate = new Date(order.createdAt)
  const formattedDate = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const formattedTime = orderDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const changeDue = order.payment === 'Cash' && order.received > order.total ? order.received - order.total : 0

  return (
    <Modal open onClose={onClose} title={pendingPayment ? 'Order placed' : 'Payment successful'} description={`${order.number} · ${money(order.total)}`} size="lg">
      <div className="pos-receipt-layout">
        <div className="pos-receipt-success">
          <span className="pos-receipt-success-icon"><Check size={22} strokeWidth={2.5}/></span>
          <div>
            <strong>{pendingPayment ? 'Bill sent to kitchen' : 'Payment confirmed'}</strong>
            <p>{pendingPayment ? 'Collect payment when the table is cleared' : 'Order saved and ready for kitchen'}</p>
          </div>
          <div className="pos-receipt-success-total">{money(order.total)}</div>
        </div>

        <div className="pos-receipt-preview" id="receipt">
          <article className="pos-receipt-sheet">
            <header className="pos-receipt-brand">
              <div className="pos-receipt-logo" style={{ background: restaurant.branding.primary }}>{restaurant.branding.mark}</div>
              <h2>{restaurant.name}</h2>
              <p>{branch?.address}, {branch?.city}</p>
              <p>{restaurant.phone}</p>
            </header>

            <div className="pos-receipt-rule" aria-hidden="true"/>

            <dl className="pos-receipt-meta">
              <div><dt>Order</dt><dd>{order.number}</dd></div>
              <div><dt>Date</dt><dd>{formattedDate}</dd></div>
              <div><dt>Time</dt><dd>{formattedTime}</dd></div>
              <div><dt>Type</dt><dd>{order.type}</dd></div>
              {order.tableName && <div><dt>Table</dt><dd>{order.tableName}</dd></div>}
              <div><dt>Payment</dt><dd>{order.payment || (pendingPayment ? 'Pay later' : '—')}</dd></div>
            </dl>

            <div className="pos-receipt-rule" aria-hidden="true"/>

            <section className="pos-receipt-items">
              <header className="pos-receipt-items-head">
                <span>Item</span>
                <span>Amount</span>
              </header>
              {order.items.map((item) => (
                <div className="pos-receipt-line" key={item.lineId || item.id}>
                  <div className="pos-receipt-line-main">
                    <strong>{item.quantity} × {item.name}</strong>
                    {item.modifiers?.length > 0 && (
                      <ul className="pos-receipt-mods">
                        {item.modifiers.map((mod) => (
                          <li key={mod.name}>
                            <span>{mod.name}</span>
                            {mod.price > 0 && <em>+{money(mod.price)}</em>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <b>{money((item.lineTotal ?? item.price) * item.quantity)}</b>
                </div>
              ))}
            </section>

            <div className="pos-receipt-rule" aria-hidden="true"/>

            <section className="pos-receipt-totals">
              <div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>
              {order.discount > 0 && <div className="is-discount"><span>Discount</span><strong>- {money(order.discount)}</strong></div>}
              {order.tax > 0 && <div><span>Tax{order.taxRate ? ` (${order.taxRate}%)` : ''}</span><strong>{money(order.tax)}</strong></div>}
              {order.serviceCharge > 0 && <div><span>Service charge</span><strong>{money(order.serviceCharge)}</strong></div>}
              {order.deliveryCharge > 0 && <div><span>Delivery</span><strong>{money(order.deliveryCharge)}</strong></div>}
              {order.payment === 'Cash' && order.received > 0 && (
                <>
                  <div><span>Cash received</span><strong>{money(order.received)}</strong></div>
                  {changeDue > 0 && <div><span>Change</span><strong>{money(changeDue)}</strong></div>}
                </>
              )}
              <div className="pos-receipt-grand-total"><span>Total paid</span><strong>{money(order.total)}</strong></div>
            </section>

            <div className="pos-receipt-fbr">
              <div className="pos-receipt-qr" aria-hidden="true"/>
              <div>
                <strong>FBR Invoice</strong>
                <small>Demo mode · #{order.id.toUpperCase()}</small>
              </div>
            </div>

            <footer className="pos-receipt-footer">
              <p>Thank you for dining with us.</p>
              <small>Powered by Orbit POS</small>
            </footer>
          </article>
        </div>

        <div className="pos-receipt-actions">
          <Button variant="outline" onClick={() => window.print()}><Printer size={16}/> Print receipt</Button>
          <Button variant="outline"><ReceiptText size={16}/> Download</Button>
          <Button onClick={onNew}>New order</Button>
        </div>
      </div>
    </Modal>
  )
}

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash', icon: Banknote },
  { id: 'Card', label: 'Card', icon: CreditCard },
  { id: 'Bank Transfer', label: 'Bank Transfer', icon: WalletCards },
  { id: 'QR', label: 'QR Pay', icon: QrCode },
  { id: 'Raast', label: 'Raast', icon: Smartphone },
  { id: 'JazzCash', label: 'JazzCash', icon: Smartphone },
  { id: 'Easypaisa', label: 'Easypaisa', icon: Smartphone },
  { id: 'Online Payment', label: 'Online', icon: Globe },
  { id: 'Split Payment', label: 'Split', icon: SlidersHorizontal },
]

function PaymentMethodIcon({ method }) {
  const config = PAYMENT_METHODS.find((item) => item.id === method)
  const Icon = config?.icon || WalletCards
  return <Icon size={20} strokeWidth={2}/>
}

function PaymentModal({ cart, customerName, orderType, subtotal, serviceCharge, deliveryCharge, open, onClose, onPay, onPayLater, settleMode = false }) {
  const [method, setMethod] = useState('Cash')
  const [received, setReceived] = useState('')
  const [paymentTiming, setPaymentTiming] = useState('now')
  const [applyTax, setApplyTax] = useState(true)
  const [taxRate, setTaxRate] = useState('16')
  const [applyDiscount, setApplyDiscount] = useState(false)
  const [discountType, setDiscountType] = useState('amount')
  const [discountValue, setDiscountValue] = useState('')
  const [applyServiceCharge, setApplyServiceCharge] = useState(false)
  const [serviceRate, setServiceRate] = useState('5')
  const serviceChargeEligible = serviceCharge > 0
  const isDineIn = orderType === 'Dine-in'
  const showPayLater = isDineIn && !settleMode && onPayLater

  useEffect(() => {
    if (!open) return
    setMethod('Cash')
    setReceived('')
    setPaymentTiming(settleMode ? 'now' : 'now')
    setApplyTax(true)
    setTaxRate('16')
    setApplyDiscount(false)
    setDiscountType('amount')
    setDiscountValue('')
    setApplyServiceCharge(serviceCharge > 0)
    setServiceRate('5')
  }, [open, serviceCharge, settleMode])

  const discountAmount = applyDiscount
    ? Math.min(subtotal, discountType === 'percent'
      ? Math.round(subtotal * (Math.max(0, Number(discountValue) || 0) / 100))
      : Math.max(0, Number(discountValue) || 0))
    : 0
  const taxableBase = Math.max(0, subtotal - discountAmount)
  const tax = applyTax ? Math.round(taxableBase * (Math.max(0, Number(taxRate) || 0) / 100)) : 0
  const appliedServiceCharge = applyServiceCharge && serviceChargeEligible
    ? Math.round(subtotal * (Math.max(0, Number(serviceRate) || 0) / 100))
    : 0
  const total = taxableBase + tax + appliedServiceCharge + deliveryCharge
  const change = Math.max(0, Number(received || 0) - total)
  const quickCash = [total, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000].filter((value, index, list) => list.indexOf(value) === index)

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const adjustments = {
    discount: discountAmount,
    tax,
    taxRate: applyTax ? Number(taxRate) || 0 : 0,
    serviceCharge: appliedServiceCharge,
    total,
  }

  return (
    <Modal open={open} onClose={onClose} title={settleMode ? 'Settle table bill' : 'Take payment'} description={settleMode ? 'Collect payment and clear the table.' : 'Select a method, adjust charges, and complete the sale.'} size="xl">
      <div className="pos-payment-layout">
        <section className="pos-payment-methods-panel">
          {showPayLater && (
            <div className="pos-payment-timing">
              <button type="button" className={paymentTiming === 'now' ? 'active' : ''} onClick={() => setPaymentTiming('now')}>
                <Banknote size={16}/> Pay now
              </button>
              <button type="button" className={paymentTiming === 'later' ? 'active' : ''} onClick={() => setPaymentTiming('later')}>
                <Clock size={16}/> Pay later
              </button>
            </div>
          )}
          {paymentTiming === 'later' && (
            <p className="pos-payment-later-note">Order will go to kitchen. Collect payment when the guest finishes and the table is cleared.</p>
          )}
          <header className="pos-payment-section-head">
            <small>{paymentTiming === 'later' ? 'Payment timing' : 'Payment method'}</small>
            <strong>{paymentTiming === 'later' ? 'Bill after dining' : 'How is the customer paying?'}</strong>
          </header>
          {paymentTiming === 'now' && (
          <div className="pos-payment-methods-grid">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`pos-payment-method${method === id ? ' active' : ''}`}
                onClick={() => setMethod(id)}
              >
                <span className="pos-payment-method-icon"><Icon size={20} strokeWidth={2}/></span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          )}

          <div className="pos-payment-order">
            <header className="pos-payment-order-head">
              <div>
                <small>Order summary</small>
                <strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong>
              </div>
              <div className="pos-payment-order-meta">
                {customerName && <span>{customerName}</span>}
                {orderType && <span>{orderType}</span>}
              </div>
            </header>
            <div className="pos-payment-order-list">
              {cart.map((item) => (
                <article key={item.lineId} className="pos-payment-order-line">
                  <div className="pos-payment-order-line-main">
                    <span className="pos-payment-order-qty">{item.quantity}×</span>
                    <div>
                      <strong>{item.name}</strong>
                      {item.modifiers?.length > 0 && (
                        <ul className="pos-payment-order-mods">
                          {item.modifiers.map((mod) => (
                            <li key={mod.name}>{mod.name}{mod.price > 0 ? ` · +${money(mod.price)}` : ''}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <b>{money((item.lineTotal ?? item.price) * item.quantity)}</b>
                </article>
              ))}
            </div>
            <footer className="pos-payment-order-foot">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </footer>
          </div>
        </section>

        <section className="pos-payment-checkout-panel">
          <div className="pos-payment-due-card">
            <div>
              <small>Amount due</small>
              <strong>{money(total)}</strong>
            </div>
            <div className="pos-payment-due-meta">
              <span>Subtotal {money(subtotal)}</span>
              {deliveryCharge > 0 && <span>+ Delivery {money(deliveryCharge)}</span>}
            </div>
          </div>

          <div className="pos-payment-adjustments">
            <header className="pos-payment-section-head compact">
              <small>Adjustments</small>
              <strong>Tax, discount & service</strong>
            </header>

            <div className={`pos-payment-adjust-card${applyTax ? ' active' : ''}`}>
              <label className="pos-payment-adjust-toggle">
                <input type="checkbox" checked={applyTax} onChange={(e) => setApplyTax(e.target.checked)}/>
                <span className="pos-payment-adjust-icon tone-tax"><Percent size={15}/></span>
                <span className="pos-payment-adjust-copy"><strong>Tax</strong><small>Apply sales tax</small></span>
                <i className="pos-payment-switch" aria-hidden="true"/>
              </label>
              {applyTax && (
                <div className="pos-payment-adjust-field">
                  <span>Rate</span>
                  <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}/>
                  <em>%</em>
                </div>
              )}
            </div>

            <div className={`pos-payment-adjust-card${applyDiscount ? ' active' : ''}`}>
              <label className="pos-payment-adjust-toggle">
                <input type="checkbox" checked={applyDiscount} onChange={(e) => setApplyDiscount(e.target.checked)}/>
                <span className="pos-payment-adjust-icon tone-discount"><Tag size={15}/></span>
                <span className="pos-payment-adjust-copy"><strong>Discount</strong><small>Flat or percentage off</small></span>
                <i className="pos-payment-switch" aria-hidden="true"/>
              </label>
              {applyDiscount && (
                <div className="pos-payment-adjust-field wide">
                  <Select size="sm" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="amount">PKR</option>
                    <option value="percent">%</option>
                  </Select>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percent' ? '10' : '500'}
                  />
                </div>
              )}
            </div>

            {serviceChargeEligible && (
              <div className={`pos-payment-adjust-card${applyServiceCharge ? ' active' : ''}`}>
                <label className="pos-payment-adjust-toggle">
                  <input type="checkbox" checked={applyServiceCharge} onChange={(e) => setApplyServiceCharge(e.target.checked)}/>
                  <span className="pos-payment-adjust-icon tone-service"><UtensilsCrossed size={15}/></span>
                  <span className="pos-payment-adjust-copy"><strong>Service charge</strong><small>Dine-in service fee</small></span>
                  <i className="pos-payment-switch" aria-hidden="true"/>
                </label>
                {applyServiceCharge && (
                  <div className="pos-payment-adjust-field">
                    <span>Rate</span>
                    <input type="number" min="0" max="100" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)}/>
                    <em>%</em>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pos-payment-breakdown">
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            {applyDiscount && discountAmount > 0 && <div className="is-negative"><span>Discount</span><strong>- {money(discountAmount)}</strong></div>}
            {applyTax && tax > 0 && <div><span>Tax ({taxRate}%)</span><strong>{money(tax)}</strong></div>}
            {appliedServiceCharge > 0 && <div><span>Service ({serviceRate}%)</span><strong>{money(appliedServiceCharge)}</strong></div>}
            {deliveryCharge > 0 && <div><span>Delivery</span><strong>{money(deliveryCharge)}</strong></div>}
            <div className="pos-payment-breakdown-total"><span>Total</span><strong>{money(total)}</strong></div>
          </div>

          {paymentTiming === 'now' ? (
            method === 'Cash' ? (
            <div className="pos-payment-cash">
              <label className="pos-payment-cash-label">Cash received</label>
              <div className="pos-payment-cash-input">
                <span>PKR</span>
                <input autoFocus type="number" value={received} onChange={(e) => setReceived(e.target.value)} placeholder="0"/>
              </div>
              <div className="pos-payment-quick-cash">
                {quickCash.map((value) => (
                  <button key={value} type="button" onClick={() => setReceived(String(value))}>{money(value)}</button>
                ))}
              </div>
              <div className="pos-payment-change">
                <span>Change due</span>
                <strong>{money(change)}</strong>
              </div>
            </div>
          ) : (
            <div className="pos-payment-terminal">
              <span className="pos-payment-terminal-icon"><PaymentMethodIcon method={method}/></span>
              <div>
                <strong>Ready for {method}</strong>
                <p>Simulated terminal — no live transaction will be created.</p>
              </div>
            </div>
          )
          ) : (
            <div className="pos-payment-terminal">
              <span className="pos-payment-terminal-icon"><UtensilsCrossed size={20}/></span>
              <div>
                <strong>Pay after dining</strong>
                <p>Table will stay occupied until payment is collected.</p>
              </div>
            </div>
          )}

          {paymentTiming === 'later' ? (
            <Button
              className="pos-payment-confirm"
              onClick={() => onPayLater(adjustments)}
            >
              Place order · pay {money(total)} later
            </Button>
          ) : (
          <Button
            className="pos-payment-confirm"
            disabled={method === 'Cash' && Number(received) < total}
            onClick={() => onPay(method, Number(received), adjustments)}
          >
            {settleMode ? `Collect ${money(total)} & clear table` : `Confirm ${money(total)} payment`}
          </Button>
          )}
        </section>
      </div>
    </Modal>
  )
}

function FlyToCart({ item, origin, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 650)
    return () => clearTimeout(timer)
  }, [onDone])
  if (!item || !origin) return null
  return <div className="fly-to-cart" style={{ left: origin.x, top: origin.y }} aria-hidden="true">
    <img src={item.image} alt=""/>
    <span>+1</span>
  </div>
}

export default function POS() {
  const { data, activeRestaurant, activeBranch, createOrder, completeOrderPayment, validateOrderStock, updateCollection, notify, logout } = useApp()
  const [orderType, setOrderType] = useState('Dine-in')
  const [activeCategory, setActiveCategory] = useState('Popular')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [modifierProduct, setModifierProduct] = useState(null)
  const [orderDetails, setOrderDetails] = useState(emptyOrderDetails)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [settleOrder, setSettleOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [receiptPendingPayment, setReceiptPendingPayment] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [addedProductId, setAddedProductId] = useState(null)
  const [flyItem, setFlyItem] = useState(null)
  const [flyOrigin, setFlyOrigin] = useState(null)
  const [cartPulse, setCartPulse] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const catalogRef = useRef(null)
  const sectionRefs = useRef({})
  const scrollingRef = useRef(false)
  const navigate = useNavigate()

  const restaurantProducts = data.products.filter((p) => p.available && p.restaurantId === activeRestaurant.id)
  const recipes = data.recipes || []
  const inventory = data.inventory || []
  const inventoryCtx = { products: restaurantProducts, recipes, inventory, addons: data.addons || [] }
  const productStock = (product) => {
    const available = calculateProductAvailability(product, inventoryCtx)
    return available === Infinity ? 999999 : available
  }
  const productStockLabel = (product) => {
    const status = getProductStockStatus(product, inventoryCtx)
    const available = calculateProductAvailability(product, inventoryCtx)
    if (status === STOCK_STATUSES.OUT_OF_STOCK || status === STOCK_STATUSES.MANUALLY_DISABLED) return 'OUT OF STOCK'
    if (available !== Infinity && available < 10) return `Only ${available}`
    if (available !== Infinity) return `Available: ${available}`
    return null
  }
  const restaurantCategories = getMenuCategories(data.categories, activeRestaurant.type || 'restaurant')
  const branchTables = data.tables.filter((table) => table.restaurantId === activeRestaurant.id && (!activeBranch?.id || table.branchId === activeBranch.id))
  const restaurantCustomers = data.customers.filter((customer) => customer.restaurantId === activeRestaurant.id)
  const branchWaiters = getBranchWaiters(data, activeRestaurant.id, activeBranch?.id)
  const branchRiders = getBranchRiders(data, activeRestaurant.id, activeBranch?.id)
  const orderContext = { tables: branchTables, waiters: branchWaiters, riders: branchRiders }
  const openDineInOrders = useMemo(() => (data.orders || []).filter((order) => (
    order.restaurantId === activeRestaurant.id
    && order.type === 'Dine-in'
    && order.paymentStatus === 'Pending'
    && order.status !== 'Cancelled'
  )), [data.orders, activeRestaurant.id])
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const normalizedQuery = query.trim().toLowerCase()

  const productsByCategory = restaurantCategories.reduce((groups, category) => {
    const items = restaurantProducts.filter((product) => {
      if (product.category !== category.name) return false
      if (!normalizedQuery) return true
      return product.name.toLowerCase().includes(normalizedQuery)
    })
    if (items.length) groups.push({ category: category.name, products: items })
    return groups
  }, [])

  const triggerAddAnimation = useCallback((product, event) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.()
    if (rect) {
      setFlyOrigin({ x: rect.left + rect.width / 2 - 26, y: rect.top + rect.height / 2 - 26 })
      setFlyItem(product)
    }
    setAddedProductId(product.id)
    setCartPulse(true)
    window.setTimeout(() => setAddedProductId(null), 500)
    window.setTimeout(() => setCartPulse(false), 600)
  }, [])

  const add = (product, modifiers = [], event) => {
    const available = productStock(product)
    const inCart = cart.filter((item) => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0)
    if (available <= inCart) {
      notify('Not enough stock — check recipe ingredients', 'warning')
      return
    }
    const modTotal = modifiers.reduce((s, m) => s + m.price, 0)
    const signature = buildCartSignature(product.id, modifiers)
    setCart(current => {
      const existing = current.find(i => i.signature === signature)
      return existing ? current.map(i => i.signature === signature ? { ...i, quantity: i.quantity + 1 } : i) : [...current, { ...product, lineId: `line-${Date.now()}`, signature, quantity: 1, modifiers, lineTotal: product.price + modTotal }]
    })
    setModifierProduct(null)
    setDetailsOpen(false)
    triggerAddAnimation(product, event)
  }

  const chooseProduct = (product, event) => {
    const resolved = withResolvedModifiers(product, data.addons || [])
    if (productHasModifiers(product, data.addons || [])) {
      setModifierProduct(resolved)
      return
    }
    add(product, [], event)
  }
  const quantity = (lineId, delta) => {
    setCart((items) => items.map((item) => {
      if (item.lineId !== lineId) return item
      const nextQty = item.quantity + delta
      if (delta > 0) {
        const available = productStock(item)
        const othersInCart = items.filter((entry) => entry.id === item.id && entry.lineId !== lineId).reduce((sum, entry) => sum + entry.quantity, 0)
        if (nextQty + othersInCart > available) {
          notify('Not enough stock — check recipe ingredients', 'warning')
          return item
        }
      }
      return { ...item, quantity: nextQty }
    }).filter((item) => item.quantity > 0))
  }

  const subtotal = settleOrder
    ? settleOrder.subtotal
    : cart.reduce((s, i) => s + i.lineTotal * i.quantity, 0)
  const serviceCharge = orderType === 'Dine-in' ? Math.round(subtotal * .05) : 0
  const deliveryCharge = orderType === 'Delivery' ? 250 : 0
  const estimatedTotal = subtotal + deliveryCharge

  const buildOrderPayload = (overrides = {}) => {
    const table = branchTables.find((item) => item.id === (overrides.tableId ?? orderDetails.tableId))
    const waiter = branchWaiters.find((item) => item.id === orderDetails.waiterId)
    const rider = branchRiders.find((item) => item.id === orderDetails.riderId)
    const discount = overrides.discount ?? 0
    const tax = overrides.tax ?? 0
    const appliedServiceCharge = overrides.serviceCharge ?? 0
    const total = overrides.total ?? (subtotal - discount + tax + appliedServiceCharge + deliveryCharge)
    return {
      type: settleOrder?.type || orderType,
      customer: settleOrder?.customer || orderDetails.customerName || 'Walk-in Customer',
      customerId: settleOrder?.customerId || orderDetails.customerId || null,
      phone: settleOrder?.phone || orderDetails.customerPhone || null,
      tableId: overrides.tableId ?? settleOrder?.tableId ?? orderDetails.tableId ?? null,
      tableName: table?.name || settleOrder?.tableName || null,
      waiterId: settleOrder?.waiterId || orderDetails.waiterId || null,
      waiterName: waiter?.name || settleOrder?.waiterName || null,
      guestCount: Number(orderDetails.guestCount) || settleOrder?.guestCount || null,
      pickupTime: orderDetails.pickupTime || null,
      deliveryAddress: orderDetails.deliveryAddress || null,
      deliveryArea: orderDetails.deliveryArea || null,
      deliveryNotes: orderDetails.deliveryNotes || null,
      riderId: orderDetails.riderId || null,
      riderName: rider?.name || null,
      orderSource: orderDetails.orderSource || null,
      onlineReference: orderDetails.onlineReference || null,
      vehicleInfo: orderDetails.vehicleInfo || null,
      payment: overrides.payment ?? null,
      paymentStatus: overrides.paymentStatus ?? 'Paid',
      received: overrides.received ?? 0,
      items: settleOrder?.items || cart,
      subtotal: settleOrder?.subtotal ?? subtotal,
      discount,
      tax,
      taxRate: overrides.taxRate ?? 0,
      serviceCharge: appliedServiceCharge,
      deliveryCharge,
      total,
      status: overrides.status ?? 'Completed',
    }
  }

  const pay = (method, received, adjustments) => {
    if (settleOrder) {
      const result = completeOrderPayment(settleOrder.id, {
        payment: method,
        received,
        discount: adjustments.discount,
        tax: adjustments.tax,
        taxRate: adjustments.taxRate,
        serviceCharge: adjustments.serviceCharge,
        total: adjustments.total,
      })
      if (!result?.ok) return
      setPaymentOpen(false)
      setSettleOrder(null)
      setReceiptPendingPayment(false)
      setReceiptOrder(result.order)
      return
    }

    const orderPayload = buildOrderPayload({
      payment: method,
      paymentStatus: 'Paid',
      received,
      status: 'Completed',
      ...adjustments,
    })
    const validation = validateOrderStock(orderPayload)
    if (!validation.ok) {
      notify(`Insufficient inventory: ${validation.shortages.map((s) => s.name).join(', ')}`, 'warning')
      return
    }
    const result = createOrder(orderPayload)
    if (!result?.ok) return
    setPaymentOpen(false)
    setReceiptPendingPayment(false)
    setReceiptOrder(result.order)
    clearCart()
  }

  const placePayLater = (adjustments) => {
    if (orderType !== 'Dine-in') return
    if (!orderDetails.tableId) {
      notify('Select a table for dine-in pay later orders', 'warning')
      return
    }
    const orderPayload = buildOrderPayload({
      payment: null,
      paymentStatus: 'Pending',
      status: 'Confirmed',
      ...adjustments,
    })
    const validation = validateOrderStock(orderPayload)
    if (!validation.ok) {
      notify(`Insufficient inventory: ${validation.shortages.map((s) => s.name).join(', ')}`, 'warning')
      return
    }
    const result = createOrder(orderPayload)
    if (!result?.ok) return
    setPaymentOpen(false)
    setReceiptPendingPayment(true)
    setReceiptOrder(result.order)
    clearCart()
    notify(`${orderPayload.tableName} · bill placed — collect payment when table clears`)
  }

  const openSettle = (order) => {
    setSettleOrder(order)
    setPaymentOpen(true)
  }

  const closePayment = () => {
    setPaymentOpen(false)
    setSettleOrder(null)
  }

  const newOrder = () => { setCart([]); setOrderDetails(emptyOrderDetails()); setReceiptOrder(null); setReceiptPendingPayment(false) }
  const clearCart = () => { setCart([]); setOrderDetails(emptyOrderDetails()) }
  const hold = () => {
    if (!cart.length) return
    updateCollection('heldOrders', items => [...items, { id: `hold-${Date.now()}`, cart, orderType, orderDetails, time: new Date().toLocaleTimeString() }])
    newOrder()
    notify('Order held successfully')
  }
  const resume = (held) => {
    setCart(held.cart)
    setOrderType(held.orderType)
    setOrderDetails(held.orderDetails || emptyOrderDetails())
    updateCollection('heldOrders', items => items.filter(i => i.id !== held.id))
    setHeldOpen(false)
  }

  useEffect(() => {
    setOrderDetails((current) => ({
      ...emptyOrderDetails(),
      customerId: current.customerId,
      customerName: current.customerName,
      customerPhone: current.customerPhone,
    }))
  }, [orderType])

  useEffect(() => { setDetailsOpen(true) }, [orderType])

  const scrollToCategory = (categoryName) => {
    const section = sectionRefs.current[categoryName]
    const container = catalogRef.current
    if (!section || !container) return
    scrollingRef.current = true
    setActiveCategory(categoryName)
    container.scrollTo({ top: section.offsetTop - 8, behavior: 'smooth' })
    window.setTimeout(() => { scrollingRef.current = false }, 700)
  }

  useEffect(() => {
    const container = catalogRef.current
    if (!container || !productsByCategory.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.dataset?.category) setActiveCategory(visible.target.dataset.category)
      },
      { root: container, rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.35, 0.55] },
    )

    productsByCategory.forEach(({ category }) => {
      const section = sectionRefs.current[category]
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [productsByCategory])

  return <div className="pos-page">
    <FlyToCart item={flyItem} origin={flyOrigin} onDone={() => { setFlyItem(null); setFlyOrigin(null) }}/>
    <header className="pos-header">
      <button className="icon-btn" onClick={() => navigate(`/restaurant/${activeRestaurant.id}/dashboard`)}><ChevronLeft size={20}/></button>
      <div className="pos-brand" style={{ '--pos-brand': activeRestaurant.branding.primary }}>
        <span>{activeRestaurant.branding.mark}</span>
        <div><strong>{activeRestaurant.name}</strong><small>{activeBranch?.name} · Terminal 01</small></div>
      </div>
      <div className="pos-header-actions">
        <NotificationBell basePath={`/restaurant/${activeRestaurant.id}`} className="pos-notification-bell" />
        <Button variant="outline" size="sm" onClick={() => setHeldOpen(true)}><Pause size={15}/> Held <Badge tone="info">{data.heldOrders.length}</Badge></Button>
        <button className="icon-btn" title="Sign out" onClick={() => { logout(); navigate('/') }}><LogOut size={18}/></button>
      </div>
    </header>

    <div className="pos-workspace">
      <section className="catalog">
        <div className="catalog-toolbar">
          <div className="pos-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search menu or scan barcode…"/></div>
          <div className="category-strip">
            {productsByCategory.map(({ category }) => (
              <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => scrollToCategory(category)}>{category}</button>
            ))}
          </div>
        </div>

        <div className="catalog-sections" ref={catalogRef}>
          {productsByCategory.length ? productsByCategory.map(({ category, products }) => (
            <section
              key={category}
              className="catalog-section"
              data-category={category}
              ref={(el) => { sectionRefs.current[category] = el }}
            >
              <header className="catalog-section-header"><h3>{category}</h3><span>{products.length} items</span></header>
              <div className="product-grid">
                {products.map((product, index) => {
                  const available = productStock(product)
                  const outOfStock = getProductStockStatus(product, inventoryCtx) === STOCK_STATUSES.OUT_OF_STOCK || getProductStockStatus(product, inventoryCtx) === STOCK_STATUSES.MANUALLY_DISABLED
                  const stockLabel = productStockLabel(product)
                  return (
                  <button
                    key={product.id}
                    className={`pos-product${addedProductId === product.id ? ' pos-product-added' : ''}${outOfStock ? ' pos-product-out-of-stock' : ''}`}
                    style={{ '--item-delay': `${Math.min(index, 11) * 40}ms` }}
                    onClick={(event) => !outOfStock && chooseProduct(product, event)}
                    disabled={outOfStock}
                  >
                    <div><img src={product.image} alt=""/>{outOfStock ? <Badge tone="out-of-stock">Out of stock</Badge> : stockLabel && <Badge tone="warning">{stockLabel}</Badge>}{productHasModifiers(product, data.addons || []) && <Badge tone="info" className="pos-customizable-badge"><SlidersHorizontal size={10}/> Custom</Badge>}</div>
                    <span><strong>{product.name}</strong><small>{product.category}</small><b>{money(product.price)}</b></span>
                    <i><Plus size={17}/></i>
                    <span className="add-ripple" aria-hidden="true"/>
                  </button>
                )})}
              </div>
            </section>
          )) : (
            <div className="catalog-empty"><Search size={28}/><h3>No items found</h3><p>Try a different search term or clear the filter.</p></div>
          )}
        </div>
      </section>

      <aside className={`order-panel${cartPulse ? ' order-panel-pulse' : ''}`}>
        <div className="order-panel-head">
          <div className="order-panel-head-main">
            <div>
              <h2>Current order</h2>
              <p>{cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'} in cart` : 'Add items from the menu'}</p>
            </div>
          </div>
          <button className="icon-btn order-clear-btn" onClick={newOrder} aria-label="Clear order" disabled={!cart.length && !orderDetails.tableId && !orderDetails.customerName}><Trash2 size={17}/></button>
        </div>

        <OrderTypeSelector value={orderType} onChange={setOrderType} />

        <button type="button" className={`order-details-toggle${detailsOpen ? ' open' : ''}`} onClick={() => setDetailsOpen((value) => !value)}>
          <SlidersHorizontal size={15}/>
          <span>Order setup</span>
          {!detailsOpen && <OrderMetaChips orderType={orderType} details={orderDetails} context={orderContext}/>}
          <ChevronDown size={15} className="order-details-chevron"/>
        </button>

        {detailsOpen && <div className="order-details-form">
          <OrderDetailsForm
            orderType={orderType}
            details={orderDetails}
            onChange={setOrderDetails}
            customers={restaurantCustomers}
            tables={branchTables}
            waiters={branchWaiters}
            riders={branchRiders}
            openOrders={openDineInOrders}
            onSettle={openSettle}
          />
        </div>}

        {orderType === 'Dine-in' && openDineInOrders.length > 0 && (
          <div className="open-table-bills">
            <header><strong>Open table bills</strong><span>{openDineInOrders.length}</span></header>
            {openDineInOrders.map((order) => (
              <button key={order.id} type="button" className="open-table-bill-row" onClick={() => openSettle(order)}>
                <span><strong>{order.tableName || 'Table'}</strong><small>{order.number} · {order.status}</small></span>
                <b>{money(order.total)}</b>
              </button>
            ))}
          </div>
        )}

        <div className="order-panel-body">
          {cart.length ? <>
            <div className="order-items-head"><span>Line items</span><strong>{cart.length}</strong></div>
            <div className="order-items">{cart.map((item) => <CartLine key={item.lineId} item={item} onQuantity={quantity}/>)}</div>
          </> : <div className="empty-order">
            <span><ShoppingBag size={26}/></span>
            <h3>Cart is empty</h3>
            <p>Tap menu items to start building this order.</p>
          </div>}
        </div>

        <div className="order-panel-foot">
          <div className="order-totals-card">
            <div className="order-total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            {serviceCharge > 0 && <div className="order-total-row muted"><span>Service · 5% (optional)</span><strong>{money(serviceCharge)}</strong></div>}
            {deliveryCharge > 0 && <div className="order-total-row muted"><span>Delivery</span><strong>{money(deliveryCharge)}</strong></div>}
            <div className="order-total-row grand"><span>Total</span><strong>{money(estimatedTotal)}</strong></div>
          </div>
          <div className="order-panel-actions">
            <Button variant="outline" onClick={hold} disabled={!cart.length}><Pause size={16}/> Hold</Button>
            <Button className="order-pay-btn" onClick={() => { setSettleOrder(null); setPaymentOpen(true) }} disabled={!cart.length}>
              {orderType === 'Dine-in' ? `Checkout ${money(estimatedTotal)}` : `Pay ${money(estimatedTotal)}`}
            </Button>
          </div>
        </div>
      </aside>
    </div>

    {modifierProduct && <ModifierModal key={modifierProduct.id} product={modifierProduct} onClose={() => setModifierProduct(null)} onAdd={(product, modifiers) => add(product, modifiers)}/>}
    <PaymentModal
      open={paymentOpen}
      cart={settleOrder?.items || cart}
      customerName={settleOrder?.customer || orderDetails.customerName || 'Walk-in Customer'}
      orderType={settleOrder?.type || orderType}
      subtotal={subtotal}
      serviceCharge={serviceCharge}
      deliveryCharge={deliveryCharge}
      settleMode={!!settleOrder}
      onClose={closePayment}
      onPay={pay}
      onPayLater={placePayLater}
    />
    <Receipt order={receiptOrder} restaurant={activeRestaurant} branch={activeBranch} pendingPayment={receiptPendingPayment} onNew={newOrder} onClose={() => setReceiptOrder(null)}/>

    <Modal open={heldOpen} onClose={() => setHeldOpen(false)} title="Held orders" description="Resume an order saved at this terminal.">
      <div className="held-list">{data.heldOrders.length ? data.heldOrders.map(held => <button key={held.id} onClick={() => resume(held)}><span><strong>{held.orderType} · {held.cart.length} items</strong><small>{held.orderDetails?.customerName || held.customer?.name || 'Walk-in'} · {held.time}</small></span><b>{money(held.cart.reduce((s, i) => s + i.lineTotal * i.quantity, 0))}</b></button>) : <p className="muted center">No held orders at this terminal.</p>}</div>
    </Modal>
  </div>
}

