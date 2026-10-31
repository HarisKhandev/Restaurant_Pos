import { useEffect, useMemo, useState } from 'react'
import {
  Bike, Check, ChevronRight, CircleHelp, Clock3, Gift, Headphones, LogOut, Mail, MapPin, MessageCircle,
  Package, Phone, RotateCcw, Send, ShieldCheck, Star, Truck, User, X,
} from 'lucide-react'
import { Button, Input, Select, money } from './ui'
import { useApp } from '../context/AppContext'

import { estimateOrderEta } from '../utils/orderEta'
import { getOrderTimelineSteps, isPickupOrder } from '../utils/orderWorkflow'

const ORDER_STEPS = ['Pending Confirmation', 'New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed']
const TERMINAL = ['Cancelled', 'Refunded']

const FAQ = [
  { q: 'How long does delivery take?', a: 'Most delivery orders arrive within 25–45 minutes. Larger orders may take a bit longer, but delivery is always within 1 hour. Your cart shows a live estimate before checkout.' },
  { q: 'Can I pick up my order instead of delivery?', a: 'Yes — choose Pickup at checkout to collect your order from the restaurant. No delivery fee applies and you will be notified when it is ready.' },
  { q: 'What payment methods do you accept?', a: 'Cash on delivery, pay on pickup, JazzCash, EasyPaisa, and Raast are supported at checkout.' },
  { q: 'Can I track my order live?', a: 'Yes — open My Orders after placing your order to see real-time kitchen and rider updates.' },
  { q: 'How do loyalty points work?', a: 'Earn 1 point for every PKR 100 spent. Redeem 100 points for PKR 100 off your next order.' },
  { q: 'What if my order is wrong or late?', a: 'Use Help & Support to raise a ticket — our team responds within 30 minutes during business hours.' },
]

export function CustomerAuthModal({ open, onClose, restaurant, onSuccess, defaultMode = 'login' }) {
  const { requestCustomerOtp, verifyCustomerOtp } = useApp()
  const [mode, setMode] = useState(defaultMode)
  const [step, setStep] = useState('identify')
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setStep('identify'); setError(''); setOtp(''); setPending(null); setMode(defaultMode) }
  }, [open, defaultMode])

  if (!open) return null

  const sendOtp = (event) => {
    event.preventDefault()
    const result = requestCustomerOtp({ restaurantId: restaurant.id, identifier, name, mode })
    if (!result.ok) { setError(result.error); return }
    setPending(result.pending)
    setStep('otp')
    setError('')
  }

  const confirmOtp = (event) => {
    event.preventDefault()
    const result = verifyCustomerOtp({ ...pending, otp })
    if (!result.ok) { setError(result.error); return }
    onSuccess?.(result.customer)
    onClose()
  }

  return (
    <div className="customer-modal-overlay" onClick={onClose}>
      <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <div><small>{mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</small><h2>{step === 'otp' ? 'Verify your identity' : 'Continue with phone or email'}</h2></div>
          <button type="button" onClick={onClose}><X size={18}/></button>
        </header>
        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Log in</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>Sign up</button>
        </div>
        {step === 'identify' ? (
          <form className="customer-auth-form" onSubmit={sendOtp}>
            {mode === 'signup' && (
              <label>Full name<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"/></label>
            )}
            <label>{mode === 'signup' ? 'Phone or email' : 'Phone number or email'}<Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="03XX XXXXXXX or you@email.com"/></label>
            <p className="auth-hint"><ShieldCheck size={13}/> We only use this to verify your order and track deliveries — no password needed.</p>
            {error && <div className="checkout-error">{error}</div>}
            <Button type="submit">Send verification code</Button>
            <small className="auth-demo">Demo: use any existing customer phone from CRM, or sign up with a new number. OTP: <strong>1234</strong></small>
          </form>
        ) : (
          <form className="customer-auth-form" onSubmit={confirmOtp}>
            <p className="otp-sent">Code sent to <strong>{identifier}</strong></p>
            <label>4-digit code<Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" inputMode="numeric" maxLength={4}/></label>
            {error && <div className="checkout-error">{error}</div>}
            <Button type="submit">Verify & continue</Button>
            <button type="button" className="auth-back" onClick={() => { setStep('identify'); setError('') }}>Change phone or email</button>
          </form>
        )}
      </div>
    </div>
  )
}

export function CustomerAccountMenu({ restaurant, onOpenPanel, onAuth }) {
  const { customerSession, customerLogout } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="customer-account-wrap">
      <button type="button" className="customer-account-btn" onClick={() => setOpen(!open)}>
        <User size={16}/>
        <span>{customerSession ? customerSession.name.split(' ')[0] : 'Account'}</span>
        {customerSession?.points > 0 && <b className="points-pill"><Gift size={10}/>{customerSession.points}</b>}
      </button>
      {open && <>
        <div className="customer-menu-backdrop" onClick={() => setOpen(false)}/>
        <div className="customer-dropdown">
          {customerSession ? <>
            <div className="customer-dropdown-head"><strong>{customerSession.name}</strong><small>{customerSession.phone || customerSession.email}</small>{customerSession.points > 0 && <span><Gift size={12}/> {customerSession.points} loyalty points</span>}</div>
            <button type="button" onClick={() => { onOpenPanel('orders'); setOpen(false) }}><Package size={15}/> My Orders</button>
            <button type="button" onClick={() => { onOpenPanel('feedback'); setOpen(false) }}><Star size={15}/> Give Feedback</button>
            <button type="button" onClick={() => { onOpenPanel('help'); setOpen(false) }}><Headphones size={15}/> Help & Support</button>
            <button type="button" className="danger" onClick={() => { customerLogout(); setOpen(false) }}><LogOut size={15}/> Sign out</button>
          </> : <>
            <button type="button" onClick={() => { onAuth('login'); setOpen(false) }}><User size={15}/> Log in</button>
            <button type="button" onClick={() => { onAuth('signup'); setOpen(false) }}><Mail size={15}/> Sign up</button>
            <button type="button" onClick={() => { onOpenPanel('help'); setOpen(false) }}><CircleHelp size={15}/> Help & Support</button>
          </>}
        </div>
      </>}
    </div>
  )
}

function orderStatusClass(status) {
  if (['Completed'].includes(status)) return 'completed'
  if (TERMINAL.includes(status)) return 'cancelled'
  return 'active'
}

function formatOrderDate(value) {
  return new Date(value).toLocaleString([], { weekday: 'short', dateStyle: 'medium', timeStyle: 'short' })
}

function OrderItemList({ items }) {
  if (!items?.length) return null
  return (
    <ul className="order-item-list">
      {items.map((item) => (
        <li key={item.lineId || `${item.id}-${item.name}`}>
          <div className="order-item-main">
            <span className="order-item-qty">{item.quantity}×</span>
            <div className="order-item-copy">
              <strong>{item.name}</strong>
              {item.modifiers?.length > 0 && (
                <small>{item.modifiers.map((mod) => mod.name).join(', ')}</small>
              )}
            </div>
          </div>
          <span className="order-item-price">{money((item.lineTotal ?? item.price) * item.quantity)}</span>
        </li>
      ))}
    </ul>
  )
}

function OrderTotals({ order }) {
  const hasBreakdown = order.subtotal != null || order.deliveryCharge || order.discount || order.tax
  if (!hasBreakdown) {
    return (
      <div className="order-totals order-totals-simple">
        <div className="order-total-row grand"><span>Total paid</span><strong>{money(order.total)}</strong></div>
      </div>
    )
  }
  return (
    <div className="order-totals">
      {order.subtotal != null && <div className="order-total-row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>}
      {order.deliveryCharge > 0 && <div className="order-total-row"><span>Delivery</span><span>{money(order.deliveryCharge)}</span></div>}
      {order.discount > 0 && <div className="order-total-row discount"><span>Discount</span><span>-{money(order.discount)}</span></div>}
      {order.tax > 0 && <div className="order-total-row"><span>Tax</span><span>{money(order.tax)}</span></div>}
      <div className="order-total-row grand"><span>Total</span><strong>{money(order.total)}</strong></div>
    </div>
  )
}

function OrderMeta({ order }) {
  return (
    <div className="order-meta">
      <div className="order-meta-primary">
        <span className="order-meta-date">{formatOrderDate(order.createdAt)}</span>
        <span className="order-meta-number">{order.number}</span>
      </div>
      <div className="order-meta-tags">
        {order.type && <span className="order-meta-tag">{order.type}</span>}
        {order.payment && <span className="order-meta-tag">{order.payment}</span>}
        {order.items?.length > 0 && <span className="order-meta-tag">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>}
      </div>
      {order.deliveryAddress && (
        <p className="order-meta-address"><MapPin size={13}/><span>{isPickupOrder(order) ? `Pickup: ${order.deliveryAddress}` : order.deliveryAddress}</span></p>
      )}
      {order.instructions && <p className="order-meta-note">Note: {order.instructions}</p>}
    </div>
  )
}

function OrderTracker({ order, restaurant }) {
  const timelineSteps = getOrderTimelineSteps(order).slice(0, -1)
  const stepIndex = timelineSteps.indexOf(order.status)
  const isTerminal = TERMINAL.includes(order.status)
  const pickup = isPickupOrder(order)
  const rider = !pickup && order.status === 'Out for Delivery' ? 'Hassan R. · Honda CD 70' : null
  const eta = order.estimatedEta || (restaurant ? estimateOrderEta({ items: order.items || [], restaurant, orderType: order.type || 'Online' }) : null)

  return (
    <article className="order-track-card">
      <header>
        <OrderMeta order={order}/>
        <span className={`order-status-pill ${orderStatusClass(order.status)}`}>{order.status === 'Ready' && pickup ? 'Ready for pickup' : order.status}</span>
      </header>
      {eta && !isTerminal && (
        <div className="order-track-eta"><Clock3 size={14}/><span>{pickup ? 'Est. ready' : 'Est. delivery'} <strong>{eta.label}</strong>{eta.isLargeOrder ? ' · larger order' : ''}</span></div>
      )}
      {!isTerminal && (
        <div className="order-timeline">
          {timelineSteps.map((step, i) => (
            <div key={step} className={`timeline-step ${i <= stepIndex ? 'done' : ''} ${i === stepIndex ? 'current' : ''}`}>
              <span>{i <= stepIndex ? <Check size={12}/> : i + 1}</span>
              <small>{
                step === 'New' ? 'Accepted'
                  : step === 'Out for Delivery' ? 'On the way'
                    : step === 'Ready' && pickup ? 'Ready for pickup'
                      : step
              }</small>
            </div>
          ))}
        </div>
      )}
      {rider && <div className="rider-track"><Bike size={16}/><div><strong>Rider assigned</strong><small>{rider} · ETA 12 min</small></div></div>}
      <OrderItemList items={order.items}/>
      <OrderTotals order={order}/>
    </article>
  )
}

function OrderHistoryCard({ order, onReorder }) {
  const canReorder = order.status === 'Completed' && onReorder
  return (
    <article className="order-history-card">
      <header>
        <OrderMeta order={order}/>
        <span className={`order-status-pill ${orderStatusClass(order.status)}`}>{order.status}</span>
      </header>
      <OrderItemList items={order.items}/>
      <OrderTotals order={order}/>
      {canReorder && (
        <footer>
          <p>Re-order adds these items to your cart. A <strong>new order number</strong> is created when you checkout.</p>
          <button type="button" className="reorder-btn" onClick={() => onReorder(order)}><RotateCcw size={14}/> Re-order same items</button>
        </footer>
      )}
    </article>
  )
}

export function CustomerPanel({ panel, restaurant, onClose, onReorder, storeTheme = 'dark' }) {
  const { customerSession, getCustomerOrders, submitFeedback, createSupportTicket, data } = useApp()
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, category: 'Food Quality', message: '', orderId: '' })
  const [supportForm, setSupportForm] = useState({ subject: '', message: '', type: 'General' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const portalMenuClass = `portal-dropdown-menu store-theme-${storeTheme}`

  const orders = useMemo(() => {
    if (!customerSession || customerSession.restaurantId !== restaurant.id) return []
    return getCustomerOrders(restaurant.id, customerSession.customerId)
  }, [customerSession, getCustomerOrders, restaurant.id, data.orders])

  const activeOrders = orders.filter((o) => !['Completed', 'Cancelled', 'Refunded'].includes(o.status))
  const pastOrders = orders.filter((o) => ['Completed', 'Cancelled', 'Refunded'].includes(o.status))

  if (!panel) return null

  const handleFeedback = (event) => {
    event.preventDefault()
    if (!customerSession) return
    const result = submitFeedback({
      restaurantId: restaurant.id, customerId: customerSession.customerId, customerName: customerSession.name,
      orderId: feedbackForm.orderId || null, rating: feedbackForm.rating, category: feedbackForm.category, message: feedbackForm.message,
    })
    if (!result.ok) { setError(result.error); return }
    setSubmitted(true); setError('')
  }

  const handleSupport = (event) => {
    event.preventDefault()
    const result = createSupportTicket({
      restaurantId: restaurant.id,
      customerId: customerSession?.customerId || null,
      customerName: customerSession?.name || 'Guest',
      subject: supportForm.subject, message: supportForm.message, type: supportForm.type,
    })
    if (!result.ok) { setError(result.error); return }
    setSubmitted(true); setError('')
  }

  const whatsappUrl = `https://wa.me/${restaurant.phone.replace(/\D/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Hi ${restaurant.name}, I need help with my order.`)}`

  return (
    <div className="customer-panel-overlay" onClick={onClose}>
      <aside className="customer-panel" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <small>{panel === 'orders' ? 'ORDER TRACKER' : panel === 'feedback' ? 'YOUR FEEDBACK' : 'HELP CENTER'}</small>
            <h2>{panel === 'orders' ? 'My Orders' : panel === 'feedback' ? 'Rate your experience' : 'Help & Support'}</h2>
          </div>
          <button type="button" onClick={onClose}><X size={20}/></button>
        </header>
        <div className="customer-panel-body">
          {panel === 'orders' && (
            !customerSession ? <div className="panel-empty"><User size={28}/><h3>Sign in to track orders</h3><p>Log in with your phone or email to see live order status.</p></div>
            : <>
              {activeOrders.length > 0 && <>
                <h3 className="panel-section-title"><Truck size={16}/> Active orders</h3>
                {activeOrders.map((order) => <OrderTracker key={order.id} order={order} restaurant={restaurant}/>)}
              </>}
              {pastOrders.length > 0 && <>
                <h3 className="panel-section-title"><Clock3 size={16}/> Order history</h3>
                {pastOrders.map((order) => (
                  <OrderHistoryCard key={order.id} order={order} onReorder={onReorder}/>
                ))}
              </>}
              {!orders.length && <div className="panel-empty"><Package size={28}/><h3>No orders yet</h3><p>Your order history will appear here after your first purchase.</p></div>}
            </>
          )}

          {panel === 'feedback' && (
            submitted ? <div className="panel-success"><Check size={32}/><h3>Thank you!</h3><p>Your feedback helps us improve. We appreciate you taking the time.</p><Button onClick={onClose}>Done</Button></div>
            : <form className="feedback-form" onSubmit={handleFeedback}>
              <p className="panel-intro">Share your experience — food quality, delivery, website, or anything else.</p>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={feedbackForm.rating >= n ? 'active' : ''} onClick={() => setFeedbackForm({ ...feedbackForm, rating: n })}><Star size={22} fill={feedbackForm.rating >= n ? 'currentColor' : 'none'}/></button>
                ))}
              </div>
              <label>Category
                <Select menuClassName={portalMenuClass} value={feedbackForm.category} onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}>
                  {['Food Quality', 'Delivery', 'Website', 'Service', 'Pricing', 'General'].map((c) => <option key={c}>{c}</option>)}
                </Select>
              </label>
              {orders.length > 0 && (
                <label>Related order (optional)
                  <Select menuClassName={portalMenuClass} value={feedbackForm.orderId} onChange={(e) => setFeedbackForm({ ...feedbackForm, orderId: e.target.value })}>
                    <option value="">General feedback</option>
                    {orders.slice(0, 10).map((o) => <option key={o.id} value={o.id}>{o.number} · {money(o.total)}</option>)}
                  </Select>
                </label>
              )}
              <label>Your feedback<textarea value={feedbackForm.message} onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })} placeholder="Tell us what you loved or what we can improve…" rows={4}/></label>
              {error && <div className="checkout-error">{error}</div>}
              <Button type="submit"><Send size={15}/> Submit feedback</Button>
            </form>
          )}

          {panel === 'help' && (
            submitted ? <div className="panel-success"><Check size={32}/><h3>Request received</h3><p>Our support team will respond within 30 minutes during business hours.</p><Button onClick={onClose}>Done</Button></div>
            : <>
              <div className="help-quick-actions">
                <a href={`tel:${restaurant.phone.replace(/\s/g, '')}`} className="help-action"><Phone size={18}/><span><strong>Call us</strong><small>{restaurant.phone}</small></span><ChevronRight size={16}/></a>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="help-action whatsapp"><MessageCircle size={18}/><span><strong>WhatsApp</strong><small>Chat with support</small></span><ChevronRight size={16}/></a>
              </div>
              <h3 className="panel-section-title">Frequently asked</h3>
              <div className="faq-list">{FAQ.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
              <h3 className="panel-section-title">Submit a request</h3>
              <form className="support-form" onSubmit={handleSupport}>
                <label>Type<Select menuClassName={portalMenuClass} value={supportForm.type} onChange={(e) => setSupportForm({ ...supportForm, type: e.target.value })}>{['General', 'Order Issue', 'Payment', 'Delivery', 'Website'].map((t) => <option key={t}>{t}</option>)}</Select></label>
                <label>Subject<Input value={supportForm.subject} onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })} placeholder="Brief summary"/></label>
                <label>Message<textarea value={supportForm.message} onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })} placeholder="Describe your issue…" rows={3}/></label>
                {error && <div className="checkout-error">{error}</div>}
                <Button type="submit"><Send size={15}/> Send request</Button>
              </form>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
