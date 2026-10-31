import { useEffect, useMemo } from 'react'
import { Check, ChevronLeft, Clock3, CreditCard, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Store, Trash2, Truck, User, X } from 'lucide-react'
import { Button, Input, money } from './ui'
import { cartLineAmount } from '../utils/cartLines'
import { useApp } from '../context/AppContext'
import DeliveryLocationPicker from './DeliveryLocationPicker'
import { estimateOrderEta } from '../utils/orderEta'
import { isPickupOrder } from '../utils/orderWorkflow'

const LIVE_STATUSES = ['Pending Confirmation', 'New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery']

const TRACK_STEPS_DELIVERY = [
  { key: 'confirmed', label: 'Order Confirmed', match: ['New', 'Confirmed', 'Pending Confirmation'] },
  { key: 'preparing', label: 'Preparing your food', sub: 'Chef is working on it!', match: ['Preparing'] },
  { key: 'delivery', label: 'Out for delivery', match: ['Ready', 'Out for Delivery'] },
]

const TRACK_STEPS_PICKUP = [
  { key: 'confirmed', label: 'Order Confirmed', match: ['New', 'Confirmed', 'Pending Confirmation'] },
  { key: 'preparing', label: 'Preparing your order', sub: 'Kitchen is working on it!', match: ['Preparing'] },
  { key: 'pickup', label: 'Ready for pickup', match: ['Ready'] },
]

function getTrackSteps(order) {
  return isPickupOrder(order) ? TRACK_STEPS_PICKUP : TRACK_STEPS_DELIVERY
}

function getStepIndex(order) {
  const steps = getTrackSteps(order)
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].match.includes(order.status)) return i
  }
  return 0
}

export function useLiveOrders(restaurant) {
  const { customerSession, getCustomerOrders, data } = useApp()
  return useMemo(() => {
    if (!customerSession || !restaurant || customerSession.restaurantId !== restaurant.id) return []
    return getCustomerOrders(restaurant.id, customerSession.customerId)
      .filter((o) => LIVE_STATUSES.includes(o.status))
  }, [customerSession, getCustomerOrders, restaurant, data.orders])
}

/** @deprecated use useLiveOrders — returns newest active order only */
export function useLiveOrder(restaurant) {
  return useLiveOrders(restaurant)[0] || null
}

export function OrderEtaNotice({ eta, compact = false, pickup = false }) {
  if (!eta) return null
  return (
    <div className={`cart-eta-notice ${compact ? 'compact' : ''}`}>
      <span className="cart-eta-icon"><Clock3 size={compact ? 14 : 15}/></span>
      <div>
        <strong>{pickup ? `Est. ready ${eta.label}` : `Est. delivery ${eta.label}`}</strong>
        {!compact && eta.isLargeOrder && <small>Larger order — kitchen needs a little more time</small>}
        {!compact && !eta.isLargeOrder && eta.prepLabel && (
          <small>{pickup ? `Food ready in ~${eta.prepLabel}` : `Food ready in ~${eta.prepLabel} · arrives within 1 hour`}</small>
        )}
        {compact && <small>{pickup ? 'Collect from the restaurant' : 'Arrives within 1 hour'}</small>}
      </div>
    </div>
  )
}

function LiveOrderCard({ order, restaurant, compact = false }) {
  const trackSteps = getTrackSteps(order)
  const step = getStepIndex(order)
  const time = new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const statusLabel = order.status === 'Preparing' ? 'PREPARING' : order.status === 'Ready' && isPickupOrder(order) ? 'READY FOR PICKUP' : order.status.replace(/\s+/g, ' ').toUpperCase()
  const pickup = isPickupOrder(order)
  const eta = order.estimatedEta || (restaurant ? estimateOrderEta({ items: order.items || [], restaurant, orderType: order.type || 'Online' }) : null)

  if (compact) {
    return (
      <article className="live-order-card compact">
        <div className="live-order-card-head">
          <strong>{order.number}</strong>
          <span className="live-status-tag">{statusLabel}</span>
        </div>
        <div className="live-progress-dots" aria-hidden="true">
          {trackSteps.map((item, i) => (
            <span key={item.key} className={`live-progress-dot ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`}/>
          ))}
        </div>
        {eta && <p className="live-order-eta"><Clock3 size={12}/> Est. {pickup ? 'ready' : ''} {eta.label}</p>}
      </article>
    )
  }

  return (
    <article className="live-order-card">
      <div className="live-order-card-head">
        <strong>{order.number}</strong>
        <span className="live-status-tag">{statusLabel}</span>
      </div>
      <div className="live-timeline">
        {trackSteps.map((item, i) => {
          const done = i < step
          const current = i === step
          return (
            <div key={item.key} className={`live-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
              <span className="live-step-dot">{done ? <Check size={11}/> : current ? <i className="pulse-ring"/> : null}</span>
              <div>
                <strong>{item.label}</strong>
                {item.sub && current && <small>{item.sub}</small>}
                {i === 0 && <small>{time}</small>}
              </div>
            </div>
          )
        })}
      </div>
      {eta && <p className="live-order-eta"><Clock3 size={13}/> {pickup ? `Est. ready ${eta.label}` : `Est. delivery ${eta.label}`}</p>}
    </article>
  )
}

export function LiveOrderWidget({ orders, order, onViewDetails, restaurant }) {
  const list = orders ?? (order ? [order] : [])
  if (!list.length) return null
  const multiple = list.length > 1

  return (
    <div className={`sidebar-widget live-order-widget ${multiple ? 'live-order-widget-multi' : ''}`}>
      <header>
        <strong>{multiple ? 'Live Orders' : 'Live Order'}</strong>
        {multiple
          ? <span className="live-order-count">{list.length} active</span>
          : <span className="live-status-tag">{list[0].status === 'Preparing' ? 'PREPARING' : list[0].status === 'Ready' && isPickupOrder(list[0]) ? 'READY FOR PICKUP' : list[0].status.replace(/\s+/g, ' ').toUpperCase()}</span>}
      </header>
      <div className="live-orders-stack">
        {list.map((item, index) => (
          <LiveOrderCard key={item.id} order={item} restaurant={restaurant} compact={multiple && index > 0}/>
        ))}
      </div>
      <button type="button" className="view-details-btn" onClick={onViewDetails}>
        {multiple ? 'View all orders' : 'View details'}
      </button>
    </div>
  )
}

export function StoreCheckoutForm({
  restaurant, customer, setCustomer, payment, setPayment, fulfillment, setFulfillment, error,
  customerSession, itemCount, grandTotal, cart, orderEta, onBack, onSignIn, onSubmit, inModal,
}) {
  const isPickup = fulfillment === 'pickup'
  const paymentMethods = isPickup
    ? ['Pay on pickup', 'JazzCash', 'EasyPaisa', 'Raast']
    : ['Cash on Delivery', 'JazzCash', 'EasyPaisa', 'Raast']

  useEffect(() => {
    if (isPickup && payment === 'Cash on Delivery') setPayment('Pay on pickup')
    if (!isPickup && payment === 'Pay on pickup') setPayment('Cash on Delivery')
  }, [isPickup, payment, setPayment])

  return (
    <form className={`store-checkout sidebar-checkout-form ${inModal ? 'modal-checkout-form' : ''}`} onSubmit={onSubmit}>
      {!inModal && (
        <header className="checkout-panel-header">
          <button type="button" className="checkout-back" onClick={onBack}><ChevronLeft size={16}/> Back</button>
          <div><small>CHECKOUT</small><strong>Complete your order</strong></div>
        </header>
      )}

      <div className="checkout-order-summary">
        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        <strong>{money(grandTotal)}</strong>
      </div>
      <ul className="checkout-item-preview">
        {cart.slice(0, 4).map((item) => (
          <li key={item.lineId}>
            {item.quantity}× {item.name}
            {item.modifiers?.length > 0 && <small> ({item.modifiers.map((mod) => mod.name).join(', ')})</small>}
          </li>
        ))}
        {cart.length > 4 && <li>+{cart.length - 4} more</li>}
      </ul>
      <OrderEtaNotice eta={orderEta} compact pickup={isPickup}/>

      {!customerSession && (
        <div className="checkout-auth-notice">
          <ShieldCheck size={16}/>
          <div><strong>Sign in to place order</strong><small>Quick phone or email verification</small></div>
          <button type="button" onClick={onSignIn}>Sign in</button>
        </div>
      )}

      <section className="checkout-section">
        <h4>How would you like your order?</h4>
        <div className="payment-options compact fulfillment-options">
          <button type="button" className={`payment-option ${fulfillment === 'delivery' ? 'active' : ''}`} onClick={() => setFulfillment('delivery')}>
            <span><Truck size={16}/></span>
            <div><strong>Delivery</strong><small>Delivered to your address</small></div>
            {fulfillment === 'delivery' && <i><Check size={14}/></i>}
          </button>
          <button type="button" className={`payment-option ${fulfillment === 'pickup' ? 'active' : ''}`} onClick={() => setFulfillment('pickup')}>
            <span><Store size={16}/></span>
            <div><strong>Pickup</strong><small>Collect from {restaurant.name}</small></div>
            {fulfillment === 'pickup' && <i><Check size={14}/></i>}
          </button>
        </div>
      </section>

      <section className="checkout-section">
        <h4><User size={14}/> Contact</h4>
        <label>Full name<Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Your name"/></label>
        <label>Mobile number<Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="03XX XXXXXXX" inputMode="tel"/></label>
      </section>

      {isPickup ? (
        <section className="checkout-section pickup-location-notice">
          <h4><MapPin size={14}/> Pickup location</h4>
          <div className="pickup-location-card">
            <strong>{restaurant.name}</strong>
            <small>{restaurant.address}, {restaurant.city}</small>
            <small>{restaurant.phone}</small>
          </div>
          <label>Pickup notes (optional)<textarea value={customer.instructions} onChange={(e) => setCustomer({ ...customer, instructions: e.target.value })} placeholder="Car colour, name for collection, etc."/></label>
        </section>
      ) : (
        <section className="checkout-section">
          <h4><MapPin size={14}/> Delivery address</h4>
          <DeliveryLocationPicker city={restaurant.city} value={customer} onChange={(location) => setCustomer((prev) => ({ ...prev, ...location }))}/>
          <div className="checkout-row">
            <label>Area<Input value={customer.area} onChange={(e) => setCustomer({ ...customer, area: e.target.value })} placeholder="e.g. Gulberg III"/></label>
            <label>House / apartment<Input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="House 12, Street 4"/></label>
          </div>
          <label>Instructions (optional)<textarea value={customer.instructions} onChange={(e) => setCustomer({ ...customer, instructions: e.target.value })} placeholder="Landmark, gate code, etc."/></label>
        </section>
      )}

      <section className="checkout-section">
        <h4><CreditCard size={14}/> Payment</h4>
        <div className="payment-options compact">
          {paymentMethods.map((method) => (
            <button key={method} type="button" className={`payment-option ${payment === method ? 'active' : ''}`} onClick={() => setPayment(method)}>
              <div><strong>{method}</strong></div>
              {payment === method && <i><Check size={14}/></i>}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="checkout-error">{error}</div>}

      <div className="checkout-submit-bar">
        <Button type="submit" className="sidebar-checkout-btn">
          <span className="checkout-btn-text">{customerSession ? (isPickup ? 'Place pickup order' : 'Place order') : 'Sign in & order'}</span>
          <span className="checkout-btn-amount">{money(grandTotal)}</span>
        </Button>
        <small className="order-consent">Secure checkout · Live tracking after sign-in</small>
      </div>
    </form>
  )
}

export function StoreSidebarCart({
  cart, itemCount, subtotal, categoryDiscount, tax, delivery, grandTotal, hasFreeDelivery,
  changeQuantity, onCheckoutClick, cartTargetRef, sidebarCartRef, hasLiveOrder, orderEta, fulfillment = 'delivery',
}) {
  const isPickup = fulfillment === 'pickup'
  return (
    <div className={`sidebar-widget cart-widget ${!hasLiveOrder ? 'cart-widget-expanded' : ''}`} ref={sidebarCartRef}>
      <header className="cart-widget-header">
        <strong>Your Cart</strong>
        <span ref={cartTargetRef} className="cart-count-badge sidebar-cart-target">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </header>
      <div className="sidebar-cart-items">
        {cart.length ? cart.map((item) => (
          <article key={item.lineId} data-cart-item={item.lineId} className="sidebar-cart-item">
            <div>
              <strong>{item.quantity}× {item.name}</strong>
              {item.modifiers?.length > 0 && <small className="sidebar-cart-mods">{item.modifiers.map((mod) => mod.name).join(' · ')}</small>}
              <small>{money(item.lineTotal ?? item.price)}</small>
            </div>
            <div className="sidebar-cart-item-actions">
              <span>{money(cartLineAmount(item))}</span>
              <button type="button" onClick={() => changeQuantity(item.lineId, -1)} aria-label="Decrease">{item.quantity === 1 ? <Trash2 size={12}/> : <Minus size={12}/>}</button>
              <button type="button" onClick={() => changeQuantity(item.lineId, 1)} aria-label="Increase"><Plus size={12}/></button>
            </div>
          </article>
        )) : (
          <div className="sidebar-cart-empty"><ShoppingBag size={22}/><p>Your cart is empty</p><small>Add items from the menu</small></div>
        )}
      </div>
      {cart.length > 0 && (
        <div className="sidebar-cart-footer">
          <OrderEtaNotice eta={orderEta} pickup={isPickup}/>
          {categoryDiscount > 0 && <div className="sidebar-cart-row"><span>Discount</span><strong>- {money(categoryDiscount)}</strong></div>}
          <div className="sidebar-cart-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <div className="sidebar-cart-row"><span>Tax (16%)</span><strong>{money(tax)}</strong></div>
          {!isPickup && (
            <div className="sidebar-cart-row"><span>Delivery</span><strong>{hasFreeDelivery ? 'FREE' : money(delivery)}</strong></div>
          )}
          <div className="sidebar-cart-total"><span>Total</span><strong>{money(grandTotal)}</strong></div>
          <Button type="button" className="sidebar-checkout-btn" onClick={onCheckoutClick}>Checkout</Button>
        </div>
      )}
    </div>
  )
}

export function StoreCartModal({
  open, checkout, onClose, onBackToCart, checkoutForm, cart, itemCount, subtotal, categoryDiscount,
  tax, delivery, grandTotal, hasFreeDelivery, onCheckoutClick, changeQuantity, orderEta, fulfillment = 'delivery',
}) {
  const isPickup = fulfillment === 'pickup'
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div className="store-cart-modal-overlay open" onClick={onClose} role="presentation">
      <div
        className={`store-cart-modal ${checkout ? 'checkout-mode' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={checkout ? 'Checkout' : 'Your cart'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="store-cart-modal-header">
          {checkout ? (
            <button type="button" className="store-cart-modal-back" onClick={onBackToCart} aria-label="Back to cart">
              <ChevronLeft size={18}/> Cart
            </button>
          ) : (
            <button type="button" className="store-cart-modal-close" onClick={onClose} aria-label="Close cart">
              <X size={18}/>
            </button>
          )}
          <div className="store-cart-modal-title">
            <small>{checkout ? 'CHECKOUT' : 'YOUR CART'}</small>
            <strong>{checkout ? 'Complete your order' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}</strong>
          </div>
          {checkout ? (
            <button type="button" className="store-cart-modal-close" onClick={onClose} aria-label="Close checkout">
              <X size={18}/>
            </button>
          ) : <span className="store-cart-modal-spacer"/>}
        </header>

        <div className="store-cart-modal-body">
          {checkout ? checkoutForm : (
            <>
              <div className="sidebar-cart-items modal-cart-items">
                {cart.length ? cart.map((item) => (
                  <article key={item.lineId} className="sidebar-cart-item">
                    <div>
                      <strong>{item.quantity}× {item.name}</strong>
                      {item.modifiers?.length > 0 && <small className="sidebar-cart-mods">{item.modifiers.map((mod) => mod.name).join(' · ')}</small>}
                      <small>{money(item.lineTotal ?? item.price)}</small>
                    </div>
                    <div className="sidebar-cart-item-actions">
                      <span>{money(cartLineAmount(item))}</span>
                      <button type="button" onClick={() => changeQuantity(item.lineId, -1)} aria-label="Decrease">
                        {item.quantity === 1 ? <Trash2 size={12}/> : <Minus size={12}/>}
                      </button>
                      <button type="button" onClick={() => changeQuantity(item.lineId, 1)} aria-label="Increase"><Plus size={12}/></button>
                    </div>
                  </article>
                )) : (
                  <div className="sidebar-cart-empty"><ShoppingBag size={22}/><p>Your cart is empty</p><small>Add items from the menu</small></div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="sidebar-cart-footer modal-cart-footer">
                  <OrderEtaNotice eta={orderEta} pickup={isPickup}/>
                  {categoryDiscount > 0 && <div className="sidebar-cart-row"><span>Discount</span><strong>- {money(categoryDiscount)}</strong></div>}
                  <div className="sidebar-cart-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <div className="sidebar-cart-row"><span>Tax (16%)</span><strong>{money(tax)}</strong></div>
                  {!isPickup && (
                    <div className="sidebar-cart-row"><span>Delivery</span><strong>{hasFreeDelivery ? 'FREE' : money(delivery)}</strong></div>
                  )}
                  <div className="sidebar-cart-total"><span>Total</span><strong>{money(grandTotal)}</strong></div>
                  <Button type="button" className="sidebar-checkout-btn" onClick={onCheckoutClick}>Proceed to checkout</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
