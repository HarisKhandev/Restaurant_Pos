import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Boxes, ChefHat, Check, Clock3, CreditCard, Croissant, Globe,
  Layers, MonitorSmartphone, Pill, Printer, ScanBarcode, ShieldCheck,
  ShoppingCart, Sparkles, Tag, Truck, Users, UtensilsCrossed, Zap,
} from 'lucide-react'
import { Button } from '../components/ui'

const businessTypes = [
  { key: 'restaurant', word: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed, color: '#0f766e', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', features: ['Kitchen Display', 'Table Mapping', 'Waiter Punching', 'Recipe Inventory', 'Online Ordering', 'Auto Print'], desc: 'Dine-in, takeaway and delivery in one flow — kitchen tickets, tables, costing and inventory deduction without extra tools.', metric: { sales: 486420, orders: 184, label: 'Guests', value: 428 } },
  { key: 'bakery', word: 'bakeries', label: 'Bakeries', icon: Croissant, color: '#b45309', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', features: ['Production Recipes', 'Ingredient Tracking', 'Counter POS', 'Daily Stock Lists', 'Barcode Scanning', 'Delivery'], desc: 'From flour to counter: production batches, recipe costing, barcode sales and automatic purchase lists for the next bake.', metric: { sales: 218650, orders: 96, label: 'Batches', value: 34 } },
  { key: 'pharmacy', word: 'pharmacies', label: 'Pharmacies', icon: Pill, color: '#059669', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80', features: ['Barcode POS', 'Batch & Expiry', 'Low-stock Alerts', 'Purchase Orders', 'Customer Records', 'Riders'], desc: 'Scan-to-sell billing with batch tracking, expiry warnings, controlled stock thresholds and automated reorder lists.', metric: { sales: 312800, orders: 247, label: 'SKUs', value: 1840 } },
  { key: 'mart', word: 'marts', label: 'Marts & Grocery', icon: ShoppingCart, color: '#2563eb', image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80', features: ['High-speed POS', 'Category Stock', 'Supplier Lists', 'Loyalty', 'Delivery Fleet', 'Daily Ledger'], desc: 'Fast checkout, department-level stock, supplier restocking and a delivery fleet that stays in sync with the till.', metric: { sales: 891240, orders: 512, label: 'Aisles', value: 18 } },
  { key: 'retail', word: 'retail stores', label: 'Retail Stores', icon: Tag, color: '#7c3aed', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80', features: ['SKU & Barcode', 'Size / Variant Stock', 'Purchase Orders', 'Customer CRM', 'Sales Analytics', 'Multi-branch'], desc: 'Fashion, electronics and general merchandise with variants, purchasing workflows and branch-level sales insight.', metric: { sales: 654900, orders: 163, label: 'SKUs', value: 920 } },
]

const platformFeatures = [
  { icon: Layers, title: 'One platform, many trades', desc: 'Restaurants, bakeries, pharmacies, marts and retail — each gets its own workflows, not a bolted-on template.' },
  { icon: ShieldCheck, title: 'Roles that stay in their lane', desc: 'Owners, managers, cashiers, kitchen, waiters and riders only see the screens that match their job.' },
  { icon: ScanBarcode, title: 'Fast, accurate billing', desc: 'Keyboard-wedge and camera barcodes, plus a POS built for speed on a busy counter.' },
  { icon: Boxes, title: 'Stock that updates itself', desc: 'Recipes deduct ingredients on sale. Low stock builds purchase lists on the schedule you set.' },
  { icon: Truck, title: 'Dispatch without a second app', desc: 'Assign riders, track live deliveries, and keep zones and routes on the same dashboard as sales.' },
  { icon: MonitorSmartphone, title: 'Floor, counter, and pocket', desc: 'Desktop for managers, tablets for waiters, phones for riders — one system, every screen.' },
]

const steps = [
  { icon: CreditCard, title: 'Sell', text: 'Punch an order at the till, table, or online store. Prices, modifiers and taxes stay consistent.' },
  { icon: ChefHat, title: 'Make', text: 'Kitchen tickets print or appear on the KDS. Status moves from new to ready without radio chatter.' },
  { icon: Boxes, title: 'Track', text: 'Inventory, recipes and purchase lists update from the same sale — no evening spreadsheet.' },
  { icon: Printer, title: 'Learn', text: 'Branch reports, ledgers and alerts show what moved today and what to restock tomorrow.' },
]

const roles = [
  { icon: ShieldCheck, title: 'Owner', text: 'Every branch, every number, every setting.' },
  { icon: Users, title: 'Manager', text: 'Floor, staff, stock and today’s exceptions.' },
  { icon: CreditCard, title: 'Cashier', text: 'A fast till — nothing else in the way.' },
  { icon: ChefHat, title: 'Kitchen', text: 'Tickets, timers and ready-to-pass.' },
  { icon: UtensilsCrossed, title: 'Waiter', text: 'Tables and punches from the floor.' },
  { icon: Truck, title: 'Rider', text: 'Assigned drops and live status.' },
]

const activityFeed = [
  { icon: Check, title: 'Order #1042 completed', detail: 'Printed to kitchen & cashier' },
  { icon: Boxes, title: 'Low stock alert', detail: 'Chicken breast below threshold' },
  { icon: Truck, title: 'Rider assigned', detail: 'Zone B · 12 min ETA' },
  { icon: Printer, title: 'KOT sent', detail: 'Table 14 · 3 items' },
  { icon: Sparkles, title: 'Loyalty applied', detail: 'Guest saved PKR 180' },
]

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

function formatPkr(n) {
  if (n >= 1e6) return `PKR ${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `PKR ${Math.round(n / 1e3)}K`
  return `PKR ${n.toLocaleString('en-PK')}`
}

export default function DemoAccess() {
  const navigate = useNavigate()
  const [activeType, setActiveType] = useState('restaurant')
  const [paused, setPaused] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [feedIndex, setFeedIndex] = useState(0)
  const [salesBump, setSalesBump] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const active = businessTypes.find((b) => b.key === activeType)
  const word = businessTypes[wordIndex]
  const pulse = activityFeed[feedIndex]
  const PulseIcon = pulse.icon

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setWordIndex((i) => (i + 1) % businessTypes.length), 2600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (paused) return undefined
    const t = setInterval(() => {
      setActiveType((current) => {
        const i = businessTypes.findIndex((b) => b.key === current)
        return businessTypes[(i + 1) % businessTypes.length].key
      })
    }, 5200)
    return () => clearInterval(t)
  }, [paused])

  useEffect(() => {
    const t = setInterval(() => {
      setFeedIndex((i) => (i + 1) % activityFeed.length)
      setSalesBump((n) => n + Math.floor(Math.random() * 1800) + 420)
    }, 2400)
    return () => clearInterval(t)
  }, [])

  const pickIndustry = (key) => {
    setActiveType(key)
    setPaused(true)
  }

  return (
    <main className="landing-page">
      <div className="landing-aurora" aria-hidden="true" />

      <header className={`landing-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="landing-brand">
          <span><Zap size={18} /></span>
          <strong>Orbit POS</strong>
        </div>
        <nav className="landing-nav">
          <a href="#industries">Industries</a>
          <a href="#how">How it works</a>
          <a href="#features">Capabilities</a>
          <a href="#roles">Teams</a>
        </nav>
        <Button variant="outline" onClick={() => navigate('/login')}>Sign in</Button>
      </header>

      <section className="landing-hero">
        <div className="hero-content">
          <span className="hero-kicker"><Globe size={14} /> ONE SYSTEM. ANY COUNTER.</span>
          <h1>
            The operating system
            <br />
            for{' '}
            <em key={word.key} className="hero-word" style={{ '--word-color': word.color }}>{word.word}</em>
          </h1>
          <p>
            Sell, prepare, stock, dispatch and report from a single workspace.
            Orbit POS is built for mixed businesses — not a restaurant tool pretending to be everything else.
          </p>
          <div className="hero-actions">
            <Button onClick={() => scrollTo('industries')}>Explore industries <ArrowRight size={16} /></Button>
            <Button variant="outline" onClick={() => scrollTo('how')}>See how it works</Button>
          </div>
          <div className="hero-stats">
            <div><strong>5</strong><small>Industries</small></div>
            <div><strong>7</strong><small>Staff roles</small></div>
            <div><strong>1</strong><small>Connected system</small></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-dashboard-preview">
            <div className="preview-topbar">
              <span /><span /><span />
              <small>{active.label} · live</small>
            </div>
            <div className="preview-body">
              <div className="preview-stat" style={{ '--ps-color': active.color }}>
                <strong>{formatPkr(active.metric.sales + salesBump)}</strong>
                <small>Today’s sales</small>
              </div>
              <div className="preview-stat" style={{ '--ps-color': '#2563eb' }}>
                <strong>{active.metric.orders + Math.floor(salesBump / 2400)}</strong>
                <small>Orders</small>
              </div>
              <div className="preview-stat" style={{ '--ps-color': '#7c3aed' }}>
                <strong>{active.metric.value}</strong>
                <small>{active.metric.label}</small>
              </div>
              <div className="preview-chart">
                {[42, 58, 51, 74, 63, 88, 80, 96, 72, 85].map((h, i) => (
                  <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
              <ul className="preview-feed">
                {activityFeed.slice(0, 3).map((item, i) => {
                  const Icon = activityFeed[(feedIndex + i) % activityFeed.length].icon
                  const row = activityFeed[(feedIndex + i) % activityFeed.length]
                  return (
                    <li key={`${row.title}-${i}`}>
                      <Icon size={14} />
                      <span>{row.title}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className="hero-floating-card fc-1" key={pulse.title}>
            <PulseIcon size={16} />
            <div>
              <strong>{pulse.title}</strong>
              <small>{pulse.detail}</small>
            </div>
          </div>
          <div className="hero-floating-card fc-2">
            <Clock3 size={16} />
            <div>
              <strong>Live operations</strong>
              <small>Tickets, stock and dispatch in sync</small>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-marquee" aria-hidden="true">
        <div className="landing-marquee-track">
          {[...businessTypes, ...businessTypes].map((bt, i) => (
            <span key={`${bt.key}-${i}`} style={{ color: bt.color }}><bt.icon size={15} />{bt.label}</span>
          ))}
        </div>
      </div>

      <section className="landing-industries" id="industries">
        <div className="section-intro">
          <span className="section-kicker">BUILT AROUND THE TRADE</span>
          <h2>Pick a counter. The product reshapes around it.</h2>
          <p>Same platform, different muscle — inventory, billing and staff tools match how that business actually runs.</p>
        </div>

        <div className="industry-tabs">
          {businessTypes.map((bt) => (
            <button
              key={bt.key}
              type="button"
              className={activeType === bt.key ? 'active' : ''}
              onClick={() => pickIndustry(bt.key)}
              style={{ '--ind-color': bt.color }}
            >
              <bt.icon size={17} />{bt.label}
            </button>
          ))}
        </div>

        <div className="industry-showcase" style={{ '--ind-color': active.color }}>
          <div className="industry-image">
            <img src={active.image} alt={active.label} />
            <span className="industry-badge" style={{ background: active.color }}>
              <active.icon size={16} /> {active.label}
            </span>
          </div>
          <div className="industry-info">
            <h3>{active.label}</h3>
            <p>{active.desc}</p>
            <div className="industry-features">
              {active.features.map((f) => <span key={f}><Check size={13} />{f}</span>)}
            </div>
            <Button variant="outline" onClick={() => scrollTo('how')}>See the flow <ArrowRight size={14} /></Button>
          </div>
        </div>
      </section>

      <section className="landing-how" id="how">
        <div className="section-intro">
          <span className="section-kicker">FROM SALE TO STOCK</span>
          <h2>A day on the floor, in four moves.</h2>
          <p>Nothing is siloed. What happens at the till is what the kitchen, warehouse and reports already know.</p>
        </div>
        <ol className="how-grid">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="how-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="how-icon"><step.icon size={20} /></span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-features" id="features">
        <div className="section-intro">
          <span className="section-kicker">WHAT STAYS CONNECTED</span>
          <h2>The pieces that usually live in five apps.</h2>
        </div>
        <div className="features-grid">
          {platformFeatures.map((f) => (
            <article key={f.title} className="feature-block">
              <span><f.icon size={20} /></span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-roles" id="roles">
        <div className="section-intro">
          <span className="section-kicker">EVERY PERSON ON SHIFT</span>
          <h2>Each role gets a workspace, not a leftover menu.</h2>
          <p>Permissions and screens follow the job — so the till stays fast and the owner still sees everything.</p>
        </div>
        <div className="roles-grid">
          {roles.map((role) => (
            <article key={role.title} className="role-card-landing">
              <span className="role-card-icon"><role.icon size={20} /></span>
              <strong>{role.title}</strong>
              <small>{role.text}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <span className="section-kicker">TRY THE WORKSPACE</span>
          <h2>Open a live demo and walk the floor.</h2>
          <p>No signup. Demo data stays in this browser so you can click through as owner, cashier or kitchen.</p>
        </div>
        <Button onClick={() => navigate('/login')}>Open workspace <ArrowRight size={16} /></Button>
      </section>

      <footer className="landing-footer">
        <div><span><Zap size={16} /></span><strong>Orbit POS</strong></div>
        <p>Point of sale, kitchen, inventory, delivery and reports — for more than one kind of business.</p>
        <small>Demo mode · data is stored locally in this browser</small>
      </footer>
    </main>
  )
}
