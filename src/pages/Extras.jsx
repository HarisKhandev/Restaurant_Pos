import { useState } from 'react'
import { Bell, Check, ShoppingBag, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, Button, Card, PageHeader, Tabs, money } from '../components/ui'

export function NotificationsPage() {
  const { data, updateCollection, notify } = useApp()
  const [filter, setFilter] = useState('All')
  const rows = data.notifications.filter((item) => filter === 'All' || (filter === 'Unread' ? !item.read : item.type === filter.toLowerCase()))
  const markAll = () => { updateCollection('notifications', (items) => items.map((item) => ({ ...item, read: true }))); notify('All notifications marked as read') }
  return <div><PageHeader eyebrow="INBOX" title="Notifications" description={`${data.notifications.filter((item) => !item.read).length} items need your attention.`}><Button variant="outline" onClick={markAll}><Check size={16}/> Mark all read</Button></PageHeader><Card><div className="table-toolbar"><Tabs items={['All','Unread','Order','Warning']} active={filter} onChange={setFilter}/></div><div className="notification-list">{rows.map((item) => <article key={item.id} className={item.read ? '' : 'unread'}><span className={`notification-icon ${item.type}`}><Bell size={17}/></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.time}</small></div><div><Button size="sm" variant="ghost" onClick={() => updateCollection('notifications', (items) => items.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))}>Mark read</Button><button className="icon-btn" onClick={() => updateCollection('notifications', (items) => items.filter((entry) => entry.id !== item.id))}><Trash2 size={16}/></button></div></article>)}</div></Card></div>
}

export function StorePreview() {
  const { data, activeRestaurant, createOrder } = useApp()
  const [cart, setCart] = useState([])
  const [category, setCategory] = useState('Popular')
  const [placed, setPlaced] = useState(null)
  const products = data.products.filter((item) => item.category === category || category === 'Popular' && data.products.indexOf(item) < 8)
  const add = (product) => setCart((items) => {
    const found = items.find((item) => item.id === product.id)
    return found ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1, lineId: `web-${Date.now()}`, lineTotal: product.price, modifiers: [] }]
  })
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const checkout = () => {
    const tax = Math.round(total * .16)
    const result = createOrder({ type: 'Online', customer: 'Online Guest', payment: 'Online Payment', items: cart, subtotal: total, discount: 0, tax, serviceCharge: 0, deliveryCharge: 250, total: total + tax + 250, status: 'New' })
    if (!result?.ok) return
    setPlaced(result.order)
    setCart([])
  }
  return <div className="store-preview"><header style={{ '--store-brand': activeRestaurant.branding.primary }}><div className="store-logo">{activeRestaurant.branding.mark}</div><div><strong>{activeRestaurant.name}</strong><span>Gulberg · 30–45 min</span></div><Badge tone="active">Open</Badge><button><ShoppingBag size={18}/>{cart.reduce((sum,item)=>sum+item.quantity,0)}</button></header>{placed ? <div className="order-placed"><span><Check size={28}/></span><h1>Order placed successfully</h1><p>Your order <strong>{placed.number}</strong> is now visible in the restaurant dashboard.</p><Button onClick={()=>setPlaced(null)}>Continue shopping</Button></div> : <><section className="store-hero"><span>ORDER DIRECT · SAVE MORE</span><h1>Comfort food,<br/>made beautifully.</h1><p>Freshly prepared and delivered from our kitchen to your door.</p></section><div className="store-categories">{data.categories.slice(0,8).map((item)=><button key={item.id} className={category===item.name?'active':''} onClick={()=>setCategory(item.name)}>{item.name}</button>)}</div><main><div className="store-products">{products.map((product)=><Card key={product.id}><img src={product.image} alt=""/><div><small>{product.category}</small><h3>{product.name}</h3><p>Fresh ingredients, made to order.</p><footer><strong>{money(product.price)}</strong><Button size="sm" onClick={()=>add(product)}>Add</Button></footer></div></Card>)}</div>{cart.length>0&&<aside className="store-cart"><h2>Your order</h2>{cart.map((item)=><div key={item.id}><span>{item.quantity} × {item.name}</span><strong>{money(item.price*item.quantity)}</strong></div>)}<hr/><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Delivery</span><strong>{money(250)}</strong></div><Button onClick={checkout}>Checkout · {money(total+250)}</Button></aside>}</main></>}</div>
}
