import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Zap } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import { useApp } from '../context/AppContext'

const HOME_PREFIX = { 'Super Admin': null, 'Restaurant Owner': 'dashboard', 'Branch Manager': 'dashboard', Cashier: 'pos', 'Kitchen Staff': 'kitchen', Waiter: 'waiter', 'Delivery Rider': 'rider-dashboard' }

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'owner@orbitpos.pk', password: 'orbit123' },
  { label: 'Restaurant Owner', email: 'owner@saltandember.pk', password: 'orbit123' },
  { label: 'Bakery Owner', email: 'owner@goldencrust.pk', password: 'orbit123' },
  { label: 'Pharmacy Owner', email: 'owner@medicare.pk', password: 'orbit123' },
  { label: 'Mart Owner', email: 'owner@freshmart.pk', password: 'orbit123' },
  { label: 'Cashier', email: 'cashier@saltandember.pk', password: 'orbit123' },
]

export default function LoginPage() {
  const { session, data, login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  if (session) {
    const page = HOME_PREFIX[session.role]
    return <Navigate to={page === null ? '/super-admin' : `/restaurant/${session.restaurantId}/${page}`} replace />
  }

  const submit = (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    const users = data.users || []
    const matchedUser = users.find((u) => u.email === trimmedEmail && u.password === password)
    if (!matchedUser) {
      setError('Invalid email or password.')
      return
    }
    const page = HOME_PREFIX[matchedUser.role]
    const home = page === null ? '/super-admin' : `/restaurant/${matchedUser.restaurantId}/${page}`
    login({ role: matchedUser.role, restaurantId: matchedUser.restaurantId || null, name: matchedUser.name, email: matchedUser.email, permissions: matchedUser.permissions })
    navigate(home, { replace: true })
  }

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return <main className="role-login-page">
    <section className="role-login-card">
      <Link className="login-back" to="/"><Zap size={16}/> Orbit POS</Link>
      <div className="login-role-mark"><LockKeyhole size={24}/></div>
      <span className="eyebrow">ORBIT POS · SIGN IN</span>
      <h1>Welcome back</h1>
      <p>Enter your credentials to access your workspace.</p>
      <form onSubmit={submit}>
        <label>Email address<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="username" required/></label>
        <label>Password<div className="password-field"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" required/><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Show password">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {error && <div className="login-error">{error}</div>}
        <Button type="submit">Sign in <ArrowRight size={16}/></Button>
      </form>
      <div className="demo-credentials-list">
        <small className="demo-label">DEMO CREDENTIALS — click to fill</small>
        {DEMO_ACCOUNTS.map((account) => <button key={account.email} className="demo-credential" onClick={() => fillDemo(account)}>
          <LockKeyhole size={17}/>
          <span>
            <strong>{account.label}</strong>
            <small>{account.email} · {account.password}</small>
          </span>
        </button>)}
      </div>
      <small className="login-disclaimer">Demo only: credentials are stored in this browser.</small>
    </section>
  </main>
}
