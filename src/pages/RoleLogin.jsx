import { useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ROLE_ACCESS } from '../data/roleAccess'

const ROLE_MAP = { 'super-admin': 'Super Admin', 'restaurant-owner': 'Restaurant Owner', 'branch-manager': 'Branch Manager', cashier: 'Cashier', 'kitchen-staff': 'Kitchen Staff', waiter: 'Waiter', rider: 'Delivery Rider' }
const HOME_PREFIX = { 'Restaurant Owner': 'dashboard', 'Branch Manager': 'dashboard', Cashier: 'pos', 'Kitchen Staff': 'kitchen', Waiter: 'waiter', 'Delivery Rider': 'rider-dashboard' }

export default function RoleLogin({ accessKey }) {
  const params = useParams()
  const key = accessKey || params.role
  const access = ROLE_ACCESS[key]
  const { session, data, login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const targetRole = ROLE_MAP[key]
  if (!access) return <Navigate to="/" replace />
  if (session) return <Navigate to={session.restaurantId ? `/restaurant/${session.restaurantId}/dashboard` : '/super-admin'} replace />

  const submit = (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    const users = data.users || []
    const matchedUser = users.find((u) => u.email === trimmedEmail && u.password === password && u.role === targetRole)
    if (!matchedUser) {
      setError('Invalid email or password for this role.')
      return
    }
    const home = matchedUser.restaurantId ? `/restaurant/${matchedUser.restaurantId}/${HOME_PREFIX[matchedUser.role] || 'dashboard'}` : '/super-admin'
    login({ role: matchedUser.role, restaurantId: matchedUser.restaurantId, name: matchedUser.name, email: matchedUser.email })
    navigate(home, { replace: true })
  }

  const demoUsers = (data.users || []).filter((u) => u.role === targetRole)
  const fillDemo = (user) => {
    setEmail(user?.email || access.email)
    setPassword(user?.password || 'orbit123')
    setError('')
  }

  return <main className="role-login-page">
    <section className="role-login-card">
      <Link className="login-back" to="/"><ArrowLeft size={16}/> All login options</Link>
      <div className="login-role-mark"><access.icon size={24}/></div>
      <span className="eyebrow">ORBIT POS · DEMO ACCESS</span>
      <h1>{access.title} login</h1>
      <p>Sign in to continue to your dedicated {access.title.toLowerCase()} workspace.</p>
      <form onSubmit={submit}>
        <label>Email address<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" autoComplete="username"/></label>
        <label>Password<div className="password-field"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Show password">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {error && <div className="login-error">{error}</div>}
        <Button type="submit">Sign in securely <ArrowRight size={16}/></Button>
      </form>
      {demoUsers.length > 0 && <div className="demo-credentials-list">
        <small className="demo-label">DEMO CREDENTIALS</small>
        {demoUsers.map((user) => {
          const restaurant = data.restaurants.find((r) => r.id === user.restaurantId)
          return <button key={user.id} className="demo-credential" onClick={() => fillDemo(user)}>
            <LockKeyhole size={17}/>
            <span>
              <strong>{restaurant?.name || 'Platform'}</strong>
              <small>{user.email} · {user.password}</small>
            </span>
          </button>
        })}
      </div>}
      <small className="login-disclaimer">Demo only: credentials and access rules are stored in this browser.</small>
    </section>
  </main>
}
