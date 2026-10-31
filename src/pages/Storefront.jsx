import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check, ChevronLeft, Clock3, Gift, MapPin, MessageCircle, Minus, Percent, Phone, Plus,
  Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Star, Trash2, Truck, UtensilsCrossed, X,
} from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Button, money } from '../components/ui'
import ModifierModal from '../components/ModifierModal'
import { CustomerAccountMenu, CustomerAuthModal, CustomerPanel } from '../components/CustomerPortal'
import { LiveOrderWidget, StoreCartModal, StoreCheckoutForm, StoreSidebarCart, useLiveOrders } from '../components/StoreSidebar'
import StoreThemeToggle, { getStoredStoreTheme, saveStoreTheme } from '../components/StoreThemeToggle'
import { useApp } from '../context/AppContext'
import { googleMapsUrl } from '../services/googleMaps'
import { buildCartLine, buildCartSignature, cartLineAmount, upsertCartLine } from '../utils/cartLines'
import { countKitchenQueue, estimateOrderEta } from '../utils/orderEta'
import { productHasModifiers, withResolvedModifiers } from '../utils/productModifiers'
import { calculateProductAvailability, getProductStockStatus, STOCK_STATUSES } from '../utils/inventoryAvailability'

const slugify = (value) => value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function MenuProductCard({ product, tag, customizable, onAdd, outOfStock, availabilityLabel }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className="menu-product-card">
      <div className={`product-photo ${imageFailed ? 'product-photo-fallback' : ''}`}>
        {!imageFailed && (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        {imageFailed && <UtensilsCrossed size={22} strokeWidth={1.75} aria-hidden="true"/>}
        {tag && <span className="product-tag">{tag}</span>}
        {customizable && <span className="product-tag product-tag-custom"><SlidersHorizontal size={10}/> Customize</span>}
      </div>
      <div className="product-body">
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          {product.prepMinutes ? (
            <span className="product-prep"><Clock3 size={11} strokeWidth={2.5}/>{product.prepMinutes} min</span>
          ) : null}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-footer">
          <span className="product-price">{money(product.price)}</span>
          {outOfStock ? <span className="product-tag product-tag-oos">Out of stock</span> : (
            <button type="button" className="product-add-btn" onClick={onAdd} aria-label={`Add ${product.name}`}>
              <Plus size={15} strokeWidth={2.5}/>
            </button>
          )}
        </div>
        {availabilityLabel && !outOfStock ? <small className="product-availability">{availabilityLabel}</small> : null}
      </div>
    </article>
  )
}

export default function Storefront() {
  const { slug } = useParams()
  const { data, createOrder, updateOrder, customerSession } = useApp()
  const restaurant = data.restaurants.find((item) => (item.slug || slugify(item.name)) === slug)
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState('popular')
  const [cart, setCart] = useState([])
  const [checkout, setCheckout] = useState(false)
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const [placed, setPlaced] = useState(null)
  const [waStep, setWaStep] = useState(null)
  const [error, setError] = useState('')
  const [payment, setPayment] = useState('Cash on Delivery')
  const [fulfillment, setFulfillment] = useState('delivery')
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', area: '', instructions: '', lat: null, lng: null, locationLabel: '' })
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [panel, setPanel] = useState(null)
  const [modifierProduct, setModifierProduct] = useState(null)
  const [storeTheme, setStoreTheme] = useState(() => getStoredStoreTheme())
  const cartTargetRef = useRef(null)
  const sidebarCartRef = useRef(null)
  const menuRef = useRef(null)
  const sectionRefs = useRef({})
  const stickyNavRef = useRef(null)

  const inventoryCtx = useMemo(() => ({
    products: data.products.filter((p) => p.restaurantId === restaurant?.id),
    recipes: data.recipes || [],
    inventory: data.inventory || [],
    addons: data.addons || [],
  }), [data.addons, data.inventory, data.products, data.recipes, restaurant?.id])

  const getAvailability = (product) => {
    const status = getProductStockStatus(product, inventoryCtx)
    const available = calculateProductAvailability(product, inventoryCtx)
    return {
      outOfStock: status === STOCK_STATUSES.OUT_OF_STOCK || status === STOCK_STATUSES.MANUALLY_DISABLED,
      available: available === Infinity ? null : available,
    }
  }

  const allMenuProducts = useMemo(() => (
    data.products.filter((item) => item.restaurantId === restaurant?.id && item.available && item.name.toLowerCase().includes(query.toLowerCase()))
  ), [data.products, query, restaurant?.id])

  const activeOffers = useMemo(() => (data.offers || []).filter((o) => o.restaurantId === restaurant?.id && o.active), [data.offers, restaurant?.id])
  const deals = useMemo(() => activeOffers.filter((o) => o.type === 'deal'), [activeOffers])
  const discounts = useMemo(() => activeOffers.filter((o) => o.type === 'discount'), [activeOffers])

  const menuSections = useMemo(() => {
    if (query.trim()) {
      return allMenuProducts.length ? [{ id: 'search', name: 'Search results', type: 'products', products: allMenuProducts }] : []
    }
    const cats = [...new Set(allMenuProducts.map((item) => item.category).filter(Boolean))]
    const sections = []
    if (deals.length || discounts.length) {
      sections.push({ id: 'deals-offers', name: 'Deals & Offers', type: 'offers', deals, discounts })
    }
    const popular = [...allMenuProducts].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)).slice(0, 8)
    if (popular.length) sections.push({ id: 'popular', name: 'Popular', type: 'products', products: popular })
    for (const cat of cats) {
      const items = allMenuProducts.filter((item) => item.category === cat)
      if (items.length) sections.push({ id: slugify(cat), name: cat, type: 'products', products: items })
    }
    return sections
  }, [allMenuProducts, query, deals, discounts])

  const scrollToSection = (sectionId) => {
    const el = sectionRefs.current[sectionId]
    if (!el) return
    const offset = stickyNavRef.current?.offsetHeight || 0
    const top = el.getBoundingClientRect().top + window.scrollY - offset - 88
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveSection(sectionId)
  }

  useEffect(() => {
    if (!menuSections.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.dataset.section) setActiveSection(visible.target.dataset.section)
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: [0.1, 0.3, 0.5] },
    )
    menuSections.forEach((section) => {
      const el = sectionRefs.current[section.id]
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [menuSections])

  const customerProfile = useMemo(() => {
    if (!customerSession || customerSession.restaurantId !== restaurant?.id) return null
    return data.customers.find((c) => c.id === customerSession.customerId)
  }, [customerSession, data.customers, restaurant?.id])

  useEffect(() => {
    if (customerSession && customerSession.restaurantId === restaurant?.id) {
      setCustomer((prev) => ({
        ...prev,
        name: customerSession.name || prev.name,
        phone: customerSession.phone || prev.phone,
        address: customerProfile?.address || prev.address,
        area: customerProfile?.area || prev.area,
      }))
    }
  }, [customerSession, customerProfile, restaurant?.id])

  const subtotal = cart.reduce((sum, item) => sum + cartLineAmount(item), 0)
  const categoryDiscount = useMemo(() => {
    let total = 0
    for (const d of discounts) {
      if (d.discountType === 'percentage' && d.discountValue) {
        const applicable = cart.filter((item) => d.category === 'All' || item.category === d.category)
        total += applicable.reduce((s, item) => s + Math.round(cartLineAmount(item) * d.discountValue / 100), 0)
      } else if (d.discountType === 'flat' && d.discountValue) {
        if (d.category === 'All' || cart.some((item) => item.category === d.category)) total += d.discountValue
      }
    }
    return total
  }, [cart, discounts])
  const hasFreeDelivery = fulfillment === 'delivery' && discounts.some((d) => d.discountType === 'freeDelivery' && (!d.minOrder || subtotal >= d.minOrder))
  const delivery = fulfillment === 'delivery' && subtotal && !hasFreeDelivery ? 250 : 0
  const tax = Math.round((subtotal - categoryDiscount) * .16)
  const grandTotal = subtotal - categoryDiscount + tax + delivery
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const orderTypeForEta = fulfillment === 'pickup' ? 'Takeaway' : 'Online'
  const kitchenQueue = useMemo(() => countKitchenQueue(data.orders, restaurant?.id), [data.orders, restaurant?.id])
  const orderEta = useMemo(() => estimateOrderEta({ items: cart, restaurant, orderType: orderTypeForEta, kitchenQueue }), [cart, restaurant, kitchenQueue, orderTypeForEta])
  const displayEta = cart.length ? orderEta : estimateOrderEta({ items: [], restaurant, orderType: orderTypeForEta, kitchenQueue })
  const liveOrders = useLiveOrders(restaurant)
  const portalClass = `public-store store-portal-v2 store-theme-${storeTheme}`

  const toggleStoreTheme = () => {
    setStoreTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      saveStoreTheme(next)
      return next
    })
  }

  const theme = restaurant ? {
    '--store-primary': restaurant.branding.primary,
    '--store-secondary': restaurant.branding.secondary,
    '--store-accent': restaurant.branding.accent,
  } : {}

  const animateAdd = (event, item, lineId, updater) => {
    updater()
    const target = cartTargetRef.current || sidebarCartRef.current
    flyToCart(event.currentTarget, target, item.image)
    setTimeout(() => {
      const row = sidebarCartRef.current?.querySelector(`[data-cart-item="${lineId}"]`)
      pulseCartItem(row)
    }, 520)
  }

  const add = (product, modifiers = [], event) => {
    const line = buildCartLine(product, modifiers, 'web')
    const commit = () => {
      setCart((items) => upsertCartLine(items, line))
      setModifierProduct(null)
    }
    if (event) animateAdd(event, product, line.lineId, commit)
    else commit()
  }

  const chooseProduct = (product, event) => {
    const { outOfStock, available } = getAvailability(product)
    if (outOfStock) return
    const inCart = cart.filter((item) => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0)
    if (available != null && inCart >= available) {
      setError(`Only ${available} available for ${product.name}`)
      return
    }
    const resolved = withResolvedModifiers(product, data.addons || [])
    if (productHasModifiers(product, data.addons || [])) {
      setModifierProduct(resolved)
      return
    }
    add(product, [], event)
  }

  const addDeal = (deal, event) => {
    const dealItem = { id: deal.id, name: deal.title, price: deal.dealPrice, image: deal.image, category: 'Deal', isDeal: true, prepMinutes: deal.prepMinutes || 30, station: 'mixed' }
    const line = buildCartLine(dealItem, [], 'deal')
    animateAdd(event, dealItem, line.lineId, () => setCart((items) => upsertCartLine(items, line)))
  }

  const changeQuantity = (lineId, amount) => setCart((items) => items.map((item) => item.lineId === lineId ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0))

  const placeOrder = () => {
    const isPickup = fulfillment === 'pickup'
    const orderType = isPickup ? 'Takeaway' : 'Online'
    const eta = estimateOrderEta({ items: cart, restaurant, orderType, kitchenQueue })
    const result = createOrder({
      restaurantId: restaurant.id,
      type: orderType,
      source: 'online',
      customerId: customerSession?.customerId,
      customer: customer.name.trim(),
      phone: customer.phone.trim(),
      deliveryAddress: isPickup
        ? `${restaurant.name}, ${restaurant.address}, ${restaurant.city}`
        : `${customer.address.trim()}, ${customer.area.trim()}`,
      deliveryLat: isPickup ? null : customer.lat,
      deliveryLng: isPickup ? null : customer.lng,
      deliveryLocationLabel: isPickup ? 'Pickup at restaurant' : (customer.locationLabel || ''),
      googleMapsUrl: !isPickup && customer.lat ? googleMapsUrl(customer.lat, customer.lng) : null,
      instructions: customer.instructions.trim(),
      payment: isPickup && payment === 'Cash on Delivery' ? 'Pay on pickup' : payment,
      items: cart,
      subtotal,
      discount: categoryDiscount,
      tax,
      serviceCharge: 0,
      deliveryCharge: delivery,
      total: grandTotal,
      status: 'Pending Confirmation',
      estimatedEta: eta,
    })
    if (!result?.ok) {
      setError('Some items are out of stock. Please update your cart.')
      return
    }
    setPlaced(result.order)
    setWaStep('sent')
    setCart([])
    setCheckout(false)
    setCartModalOpen(false)
    setPendingSubmit(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = (event) => {
    event.preventDefault()
    if (!customer.name.trim() || !/^03\d{9}$/.test(customer.phone.replace(/\s/g, ''))) {
      setError('Please enter your name and a valid 03XXXXXXXXX phone number.')
      return
    }
    if (fulfillment === 'delivery' && !customer.lat && (!customer.address.trim() || !customer.area.trim())) {
      setError('Set your delivery location on the map, or enter your area and house address.')
      return
    }
    if (!customerSession || customerSession.restaurantId !== restaurant.id) {
      setPendingSubmit(true)
      setAuthMode('signup')
      setAuthOpen(true)
      return
    }
    placeOrder()
  }

  const handleAuthSuccess = () => {
    setAuthOpen(false)
    if (pendingSubmit) placeOrder()
  }

  const handleReorder = (order) => {
    const lines = (order.items || []).map((item, index) => {
      const modifiers = item.modifiers || []
      const modTotal = modifiers.reduce((sum, modifier) => sum + modifier.price, 0)
      const unitPrice = item.lineTotal ?? (item.price + modTotal)
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        prepMinutes: item.prepMinutes,
        station: item.station,
        isDeal: item.isDeal,
        lineId: `reorder-${Date.now()}-${index}-${item.id}`,
        signature: buildCartSignature(item.id, modifiers),
        quantity: item.quantity,
        modifiers,
        lineTotal: unitPrice,
      }
    })
    setCart(lines)
    if (order.customer) {
      setCustomer((current) => ({
        ...current,
        name: order.customer || current.name,
        phone: order.phone?.replace(/\s/g, '') || current.phone,
        address: order.deliveryAddress?.split(',')[0]?.trim() || current.address,
        area: order.deliveryAddress?.split(',')[1]?.trim() || current.area,
        instructions: order.instructions || current.instructions,
        lat: order.deliveryLat ?? current.lat,
        lng: order.deliveryLng ?? current.lng,
        locationLabel: order.deliveryLocationLabel || current.locationLabel,
      }))
    }
    if (order.payment) setPayment(order.payment === 'Pay on pickup' ? 'Pay on pickup' : order.payment)
    setFulfillment(order.type === 'Takeaway' ? 'pickup' : 'delivery')
    setPanel(null)
    setCheckout(false)
    setCartModalOpen(true)
  }

  const openCartModal = () => {
    setCheckout(false)
    setError('')
    setCartModalOpen(true)
  }

  const openCheckoutModal = () => {
    if (!cart.length) return
    setCheckout(true)
    setError('')
    setCartModalOpen(true)
  }

  const closeCartModal = () => {
    setCartModalOpen(false)
    setCheckout(false)
    setError('')
  }

  const checkoutForm = (
    <StoreCheckoutForm
      restaurant={restaurant}
      customer={customer}
      setCustomer={setCustomer}
      payment={payment}
      setPayment={setPayment}
      fulfillment={fulfillment}
      setFulfillment={setFulfillment}
      error={error}
      customerSession={customerSession}
      itemCount={itemCount}
      grandTotal={grandTotal}
      cart={cart}
      orderEta={orderEta}
      inModal
      onBack={() => setCheckout(false)}
      onSignIn={() => { setAuthMode('login'); setAuthOpen(true) }}
      onSubmit={submit}
    />
  )

  if (!restaurant) return <StoreMessage title="Restaurant not found" message="This ordering link is invalid or has expired."/>
  if (restaurant.status === 'Suspended' || !restaurant.features?.online) return <StoreMessage title="Online ordering is unavailable" message={`${restaurant.name} is not accepting online orders right now.`}/>

  const confirmWhatsApp = () => { updateOrder(placed.id, { status: 'New' }); setWaStep('confirmed') }
  const rejectWhatsApp = () => { updateOrder(placed.id, { status: 'Cancelled' }); setWaStep('rejected') }
  const points = customerProfile?.points || customerSession?.points || 0
  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: 'smooth' })

  if (placed) return (
    <div className={portalClass} style={theme}>
      <StoreHeader restaurant={restaurant} itemCount={0} storeTheme={storeTheme} onToggleTheme={toggleStoreTheme} onCart={() => {}} onOpenPanel={setPanel} onAuth={(mode) => { setAuthMode(mode); setAuthOpen(true) }} onNav={{ menu: scrollToMenu, orders: () => setPanel('orders'), rewards: () => setPanel('orders') }} etaLabel={placed.estimatedEta?.label}/>
      {waStep === 'confirmed' ? (
        <section className="store-confirmation">
          <span className="confirmation-check"><Check size={34}/></span>
          <small>ORDER CONFIRMED</small>
          <h1>Thank you, {placed.customer.split(' ')[0]}.</h1>
          <p>Your order <strong>{placed.number}</strong> is being prepared.</p>
          <div className="confirmation-summary">
            {placed.type === 'Takeaway' ? (
              <>
                <div><Clock3 size={19}/><span><small>Ready for pickup in</small><strong>{placed.estimatedEta?.label || '20–35 minutes'}</strong>{placed.estimatedEta?.isLargeOrder && <small className="eta-note">Larger orders need more kitchen time</small>}</span></div>
                <div><MapPin size={19}/><span><small>Pick up at</small><strong>{restaurant.name}</strong><small>{restaurant.address}, {restaurant.city}</small></span></div>
              </>
            ) : (
              <>
                <div><Truck size={19}/><span><small>Estimated delivery</small><strong>{placed.estimatedEta?.label || '35–50 minutes'}</strong>{placed.estimatedEta?.isLargeOrder && <small className="eta-note">Larger orders need more kitchen time</small>}</span></div>
                <div><MapPin size={19}/><span><small>Delivering to</small><strong>{placed.deliveryAddress}</strong>{placed.googleMapsUrl && <a href={placed.googleMapsUrl} target="_blank" rel="noreferrer" className="maps-link">Open in Google Maps</a>}</span></div>
              </>
            )}
          </div>
          <div className="confirmation-actions">
            <Button onClick={() => setPanel('orders')}>Track my order</Button>
            <Button variant="outline" onClick={() => { setPlaced(null); setWaStep(null) }}>Order again</Button>
          </div>
        </section>
      ) : waStep === 'rejected' ? (
        <section className="store-confirmation">
          <span className="confirmation-check cancelled"><X size={34}/></span>
          <h1>Order cancelled</h1>
          <Button onClick={() => { setPlaced(null); setWaStep(null) }}>Start a new order</Button>
        </section>
      ) : (
        <section className="store-confirmation wa-confirmation">
          <div className="wa-phone-frame">
            <div className="wa-phone-header"><div className="wa-phone-notch"/><span>WhatsApp</span></div>
            <div className="wa-chat-area">
              <div className="wa-chat-header"><div className="wa-avatar" style={{ background: restaurant.branding.primary }}>{restaurant.branding.mark}</div><div><strong>{restaurant.name}</strong><small>Business Account</small></div></div>
              <div className="wa-messages">
                <div className="wa-message wa-incoming">
                  <div className="wa-msg-body">
                    <strong>Order Confirmation</strong>
                    <p>Hi {placed.customer.split(' ')[0]}, confirm order <b>{placed.number}</b>?</p>
                    <div className="wa-order-summary">{placed.items.map((item) => <div key={item.id}>{item.quantity}× {item.name}</div>)}<div className="wa-order-total"><span>Total</span><strong>{money(placed.total)}</strong></div></div>
                  </div>
                </div>
              </div>
              <div className="wa-confirm-buttons">
                <button className="wa-btn-yes" onClick={confirmWhatsApp}><Check size={16}/> Yes, confirm</button>
                <button className="wa-btn-no" onClick={rejectWhatsApp}><X size={16}/> Cancel</button>
              </div>
            </div>
          </div>
        </section>
      )}
      <CustomerPanel panel={panel} restaurant={restaurant} storeTheme={storeTheme} onClose={() => setPanel(null)} onReorder={handleReorder}/>
      <CustomerAuthModal open={authOpen} onClose={() => { setAuthOpen(false); setPendingSubmit(false) }} restaurant={restaurant} onSuccess={handleAuthSuccess} defaultMode={authMode}/>
    </div>
  )

  return (
    <div className={portalClass} style={theme}>
      <StoreHeader
        restaurant={restaurant}
        itemCount={itemCount}
        storeTheme={storeTheme}
        onToggleTheme={toggleStoreTheme}
        cartTargetRef={cartTargetRef}
        onCart={openCartModal}
        onOpenPanel={setPanel}
        onAuth={(mode) => { setAuthMode(mode); setAuthOpen(true) }}
        onNav={{ menu: scrollToMenu, orders: () => setPanel('orders'), rewards: () => setPanel('orders') }}
        etaLabel={displayEta.label}
      />

      {customerSession && customerSession.restaurantId === restaurant.id && (
        <div className="loyalty-strip">
          <div className="loyalty-strip-inner">
            <Gift size={15}/>
            <span>Welcome back, <strong>{customerSession.name.split(' ')[0]}</strong> — you have <strong>{points} loyalty points</strong></span>
            <button type="button" onClick={() => setPanel('orders')}>Track orders →</button>
          </div>
        </div>
      )}

      <section className="public-store-hero">
        <div className="store-hero-inner">
          <div>
            <span className="store-kicker"><i/> ORDER DIRECT · ZERO COMMISSION</span>
            <h1>Good food.<br/><em>Delivered fresh.</em></h1>
            <p>Restaurant-quality favourites with live tracking, loyalty rewards & WhatsApp confirmation.</p>
            <button type="button" className="hero-order-btn" onClick={scrollToMenu}>Order now</button>
            <div className="store-promises">
              <span><Clock3 size={16}/> {displayEta.label}</span>
              <span><Star size={16} fill="currentColor"/> 4.8 rating</span>
            </div>
          </div>
          <div className="hero-dish">
            <img src={data.products.find((item) => item.restaurantId === restaurant.id)?.image} alt="Fresh food"/>
          </div>
        </div>
      </section>

      <div className="store-main-layout">
        <div className="store-main-column">
          <section className="store-menu-shell" ref={menuRef} id="menu">
            <div className="store-menu-heading">
              <div><span>OUR MENU</span><h2>What are you craving?</h2></div>
              <label><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the menu"/></label>
            </div>

            {!query && menuSections.length > 1 && (
              <nav className="menu-sticky-nav" ref={stickyNavRef}>
                <div className="menu-sticky-nav-inner">
                  {menuSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={activeSection === section.id ? 'active' : ''}
                      onClick={() => scrollToSection(section.id)}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </nav>
            )}

            {menuSections.length ? menuSections.map((section) => (
              <div
                key={section.id}
                className="menu-category-section"
                id={`section-${section.id}`}
                data-section={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el }}
              >
                <header className="menu-section-header">
                  <h3>{section.name}</h3>
                  <span>
                    {section.type === 'offers'
                      ? `${(section.deals?.length || 0) + (section.discounts?.length || 0)} offers`
                      : `${section.products.length} items`}
                  </span>
                </header>
                {section.type === 'offers' ? (
                  <div className="menu-offers-content">
                    {section.discounts?.length > 0 && (
                      <div className="store-discount-banners">
                        {section.discounts.map((d) => (
                          <div key={d.id} className="discount-banner">
                            <div className="discount-banner-icon"><Percent size={20}/></div>
                            <div><strong>{d.title}</strong><p>{d.description}</p></div>
                            {d.badge && <span className="discount-badge">{d.badge}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {section.deals?.length > 0 && (
                      <div className="menu-deals-grid">
                        {section.deals.map((deal) => (
                          <article key={deal.id} className="deal-card">
                            <div className="deal-card-image">
                              <img src={deal.image} alt={deal.title}/>
                              {deal.badge && <span className="deal-badge">{deal.badge}</span>}
                              <span className="deal-save-tag">Save {money(deal.originalPrice - deal.dealPrice)}</span>
                              <button type="button" className="deal-add-circle" onClick={(e) => addDeal(deal, e)} aria-label={`Add ${deal.title}`}><Plus size={18}/></button>
                            </div>
                            <div className="deal-card-body">
                              <h3>{deal.title}</h3>
                              <p>{deal.description}</p>
                              <div className="deal-card-pricing"><span className="deal-original">{money(deal.originalPrice)}</span><strong>{money(deal.dealPrice)}</strong></div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                <div className="public-products menu-section-grid">
                  {section.products.map((product) => {
                    const sold = product.totalSold || 0
                    const tag = sold >= 20 ? 'Bestseller' : sold >= 10 ? 'Popular' : null
                    const { outOfStock, available } = getAvailability(product)
                    return (
                      <MenuProductCard
                        key={product.id}
                        product={product}
                        tag={tag}
                        customizable={productHasModifiers(product, data.addons || [])}
                        outOfStock={outOfStock}
                        availabilityLabel={available != null && available < 10 ? `Only ${available} available` : null}
                        onAdd={(e) => chooseProduct(product, e)}
                      />
                    )
                  })}
                </div>
                )}
              </div>
            )) : (
              <div className="empty-menu"><UtensilsCrossed size={28}/><h3>No dishes found</h3><p>Try another search term.</p></div>
            )}
          </section>
        </div>

        <aside className={`store-sidebar ${!liveOrders.length ? 'sidebar-cart-only' : ''}`}>
          {liveOrders.length > 0 && <LiveOrderWidget orders={liveOrders} restaurant={restaurant} onViewDetails={() => setPanel('orders')}/>}
          <StoreSidebarCart
            cart={cart}
            itemCount={itemCount}
            subtotal={subtotal}
            categoryDiscount={categoryDiscount}
            tax={tax}
            delivery={delivery}
            grandTotal={grandTotal}
            hasFreeDelivery={hasFreeDelivery}
            changeQuantity={changeQuantity}
            onCheckoutClick={openCheckoutModal}
            cartTargetRef={cartTargetRef}
            sidebarCartRef={sidebarCartRef}
            hasLiveOrder={liveOrders.length > 0}
            orderEta={orderEta}
            fulfillment={fulfillment}
          />
        </aside>
      </div>

      <footer className="store-footer store-footer-full">
        <div className="store-footer-inner">
          <div className="footer-brand">
            <div className="store-logo">{restaurant.branding.mark}</div>
            <div><strong>{restaurant.name}</strong><span>{restaurant.address}, {restaurant.city}</span></div>
          </div>
          <div className="footer-links">
            <button type="button" onClick={() => setPanel('help')}>Help</button>
            <button type="button" onClick={() => setPanel('feedback')}>Feedback</button>
            <button type="button" onClick={() => setPanel('orders')}>My Orders</button>
          </div>
          <div className="footer-contact"><Phone size={14}/> {restaurant.phone}</div>
        </div>
      </footer>

      {itemCount > 0 && (
        <button type="button" className="mobile-cart-bar" onClick={openCartModal}>
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <strong>{money(grandTotal)} · View cart</strong>
        </button>
      )}

      <StoreCartModal
        open={cartModalOpen}
        checkout={checkout}
        checkoutForm={checkoutForm}
        cart={cart}
        itemCount={itemCount}
        subtotal={subtotal}
        categoryDiscount={categoryDiscount}
        tax={tax}
        delivery={delivery}
        grandTotal={grandTotal}
        hasFreeDelivery={hasFreeDelivery}
        changeQuantity={changeQuantity}
        onClose={closeCartModal}
        onBackToCart={() => { setCheckout(false); setError('') }}
        onCheckoutClick={openCheckoutModal}
        orderEta={orderEta}
        fulfillment={fulfillment}
      />

      <CustomerPanel panel={panel} restaurant={restaurant} storeTheme={storeTheme} onClose={() => setPanel(null)} onReorder={handleReorder}/>
      <CustomerAuthModal open={authOpen} onClose={() => { setAuthOpen(false); setPendingSubmit(false) }} restaurant={restaurant} onSuccess={handleAuthSuccess} defaultMode={authMode}/>
      {modifierProduct && (
        <ModifierModal
          key={modifierProduct.id}
          product={modifierProduct}
          onClose={() => setModifierProduct(null)}
          addLabel="Add to cart"
          onAdd={(product, modifiers) => add(product, modifiers)}
        />
      )}
    </div>
  )
}

function StoreHeader({ restaurant, itemCount, storeTheme, onToggleTheme, cartTargetRef, onCart, onOpenPanel, onAuth, onNav, etaLabel }) {
  return (
    <header className="public-store-header">
      <div className="store-header-grid">
        <div className="header-main">
          <div className="store-identity">
            <div className="store-logo">{restaurant.branding.mark}</div>
            <div><strong>{restaurant.name}</strong><span><MapPin size={11}/>{restaurant.city} · Open now</span></div>
          </div>
          <nav className="store-nav">
            <button type="button" onClick={onNav.menu}>Menu</button>
            <button type="button" onClick={onNav.orders}>Orders</button>
            <button type="button" onClick={onNav.rewards}>Rewards</button>
          </nav>
          <div className="header-trust"><span><Clock3 size={14}/> {etaLabel || '25–35 min'}</span></div>
        </div>
        <div className="header-sidebar-slot">
          <StoreThemeToggle theme={storeTheme} onToggle={onToggleTheme}/>
          <CustomerAccountMenu restaurant={restaurant} onOpenPanel={onOpenPanel} onAuth={onAuth}/>
          <button type="button" className="header-cart" onClick={onCart} ref={cartTargetRef}>
            <ShoppingBag size={17}/><span>Cart</span><b>{itemCount}</b>
          </button>
        </div>
      </div>
    </header>
  )
}

function StoreMessage({ title, message }) {
  return <main className="store-message store-portal-v2"><span><UtensilsCrossed size={25}/></span><h1>{title}</h1><p>{message}</p></main>
}
