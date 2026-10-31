import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, Check, Package, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button, Modal } from './ui'

const typeIcon = {
  warning: AlertTriangle,
  order: ShoppingCart,
  success: Check,
  info: Package,
}

export function NotificationBell({ basePath, className = '' }) {
  const { data, activeRestaurant, markNotificationRead, markAllNotificationsRead } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const notifications = (data.notifications || [])
    .filter((n) => !n.restaurantId || n.restaurantId === activeRestaurant?.id)
    .sort((a, b) => {
      const priority = { critical: 0, normal: 1 }
      const pa = priority[a.priority] ?? 1
      const pb = priority[b.priority] ?? 1
      if (pa !== pb) return pa - pb
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })

  const unread = notifications.filter((n) => !n.read)
  const criticalCount = unread.filter((n) => n.priority === 'critical').length

  const viewAll = () => {
    setOpen(false)
    navigate(`${basePath}/notifications`)
  }

  return (
    <div className={`notification-bell-wrap ${className}`}>
      <button
        type="button"
        className={`notification-btn${criticalCount ? ' has-critical' : ''}`}
        title="Notifications"
        onClick={() => setOpen(true)}
      >
        <Bell size={18} />
        {unread.length > 0 && <i>{unread.length}</i>}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        description={unread.length ? `${unread.length} unread` : 'All caught up'}
        size="sm"
      >
        <div className="notification-modal">
          {criticalCount > 0 && (
            <div className="notification-critical-bar">
              <AlertTriangle size={14} />
              <span>{criticalCount} ingredient{criticalCount > 1 ? 's' : ''} critically low</span>
            </div>
          )}

          <div className="notification-modal-list">
            {notifications.length ? notifications.slice(0, 10).map((item) => {
              const Icon = typeIcon[item.type] || Bell
              return (
                <article
                  key={item.id}
                  className={`notification-dropdown-item${item.read ? '' : ' unread'}${item.priority === 'critical' ? ' critical' : ''}`}
                  onClick={() => markNotificationRead(item.id)}
                >
                  <span className={`notification-icon ${item.type}`}><Icon size={15} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>{item.time}</small>
                  </div>
                  {!item.read && <span className="unread-dot" />}
                </article>
              )
            }) : (
              <p className="notification-empty">No notifications yet</p>
            )}
          </div>

          <div className="notification-modal-actions">
            {unread.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllNotificationsRead(activeRestaurant?.id)}>
                Mark all read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={viewAll}>View all</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
