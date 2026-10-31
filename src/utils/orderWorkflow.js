export const ORDER_STATUSES = ['New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled', 'Refunded', 'Pending Confirmation']

export const ACTIVE_ORDER_STATUSES = ['Pending Confirmation', 'New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery']

export const TERMINAL_ORDER_STATUSES = ['Completed', 'Cancelled', 'Refunded']

export const UNIFIED_QUEUE_COLUMNS = ['Pending Confirmation', 'New', 'Preparing', 'Ready', 'Out for Delivery']

/** Statuses visible on kitchen screens (KDS + kitchen progress) */
export const KITCHEN_QUEUE_STATUSES = ['New', 'Confirmed', 'Preparing', 'Ready']

/** KDS board columns */
export const KITCHEN_KDS_COLUMNS = ['New', 'Preparing', 'Ready']

/** Kitchen progress pipeline — UI stage labels mapped to canonical statuses */
export const KITCHEN_PIPELINE_STAGES = [
  { key: 'Received', statuses: ['New', 'Confirmed'] },
  { key: 'Preparing', statuses: ['Preparing'] },
  { key: 'Ready', statuses: ['Ready'] },
  { key: 'Out for Delivery', statuses: ['Out for Delivery'] },
]

/** Manager dashboard pipeline — uses canonical statuses only */
export const DASHBOARD_PIPELINE_STATUSES = ['Pending Confirmation', 'New', 'Preparing', 'Ready', 'Out for Delivery', 'Completed']

/** Lower number = shown first in listing view */
export const STATUS_LIST_PRIORITY = {
  'Pending Confirmation': 0,
  New: 1,
  Confirmed: 2,
  Preparing: 3,
  Ready: 4,
  'Out for Delivery': 5,
  Completed: 6,
  Cancelled: 7,
  Refunded: 8,
}

const DELIVERY_TYPES = ['Delivery', 'Online']
const PICKUP_TYPES = ['Takeaway', 'Dine-in']

export function isDeliveryOrder(order) {
  return DELIVERY_TYPES.includes(order?.type)
}

export function isPickupOrder(order) {
  return PICKUP_TYPES.includes(order?.type)
}

export function isOnlineChannelOrder(order) {
  return order?.source === 'online' || order?.type === 'Online'
}

export function getOrderTimelineSteps(order) {
  const steps = ['Pending Confirmation', 'New', 'Confirmed', 'Preparing', 'Ready']
  if (isDeliveryOrder(order)) steps.push('Out for Delivery')
  steps.push('Completed')
  return steps
}

export function statusForOrderQueueColumn(column) {
  return column
}

export function statusForKitchenColumn(column) {
  if (column === 'New') return 'New'
  return column
}

export function statusForKitchenStage(stageKey) {
  const map = {
    Received: 'New',
    Preparing: 'Preparing',
    Ready: 'Ready',
    'Out for Delivery': 'Out for Delivery',
  }
  return map[stageKey] ?? stageKey
}

export function statusForDeliveryColumn(columnTitle) {
  if (columnTitle === 'Pending Pickup') return 'Ready'
  if (columnTitle === 'In Transit') return 'Out for Delivery'
  if (columnTitle === 'Delivered') return 'Completed'
  return null
}

export function todayDateKey() {
  return new Date().toISOString().slice(0, 10)
}

export function getOrderDateKey(createdAt) {
  if (!createdAt) return ''
  return String(createdAt).slice(0, 10)
}

export function filterOrdersByRestaurant(orders, restaurantId) {
  return orders.filter((o) => o.restaurantId === restaurantId)
}

export function sortOrdersForListing(orders) {
  return [...orders].sort((a, b) => {
    const priorityA = STATUS_LIST_PRIORITY[a.status] ?? 99
    const priorityB = STATUS_LIST_PRIORITY[b.status] ?? 99
    if (priorityA !== priorityB) return priorityA - priorityB
    if (Boolean(a.isNew) !== Boolean(b.isNew)) return a.isNew ? -1 : 1
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  })
}

export function filterOrdersByDate(orders, dateKey) {
  if (!dateKey) return orders
  return orders.filter((order) => getOrderDateKey(order.createdAt) === dateKey)
}

export function ordersInColumn(orders, column) {
  if (column === 'New') return orders.filter((o) => ['New', 'Confirmed'].includes(o.status))
  return orders.filter((o) => o.status === column)
}

export function ordersInKitchenColumn(orders, column) {
  return ordersInColumn(orders, column)
}

export function ordersInKitchenStage(orders, stage) {
  return orders.filter((o) => stage.statuses.includes(o.status))
}

export function filterKitchenQueue(orders, restaurantId) {
  return filterOrdersByRestaurant(orders, restaurantId).filter((o) => KITCHEN_QUEUE_STATUSES.includes(o.status))
}

export function filterKitchenPipeline(orders, restaurantId) {
  const statuses = [...KITCHEN_QUEUE_STATUSES, 'Out for Delivery']
  return filterOrdersByRestaurant(orders, restaurantId).filter((o) => statuses.includes(o.status))
}

export function countOrdersByPipelineStatus(orders, status) {
  if (status === 'New') return orders.filter((o) => ['New', 'Confirmed'].includes(o.status)).length
  return orders.filter((o) => o.status === status).length
}

export function getNextOrderStatus(order) {
  switch (order.status) {
    case 'Pending Confirmation':
      return 'New'
    case 'New':
    case 'Confirmed':
      return 'Preparing'
    case 'Preparing':
      return 'Ready'
    case 'Ready':
      return DELIVERY_TYPES.includes(order.type) ? 'Out for Delivery' : 'Completed'
    case 'Out for Delivery':
      return 'Completed'
    default:
      return null
  }
}

export function getOrderActionLabel(order) {
  switch (order.status) {
    case 'Pending Confirmation':
      return 'Confirm'
    case 'New':
      return 'Accept'
    case 'Confirmed':
      return 'Start preparing'
    case 'Preparing':
      return 'Mark ready'
    case 'Ready':
      if (DELIVERY_TYPES.includes(order.type)) return 'Dispatch'
      if (order.type === 'Takeaway') return 'Mark picked up'
      if (order.type === 'Dine-in') return 'Serve'
      return 'Complete'
    case 'Out for Delivery':
      return 'Complete'
    default:
      return null
  }
}

export function getKitchenStageActionLabel(order) {
  return getOrderActionLabel(order)
}

/** Badge tone for order channel (Dine-in, Takeaway, etc.) */
export function getOrderTypeTone(type) {
  switch (type) {
    case 'Dine-in':
      return 'dine-in'
    case 'Takeaway':
      return 'takeaway'
    case 'Delivery':
      return 'delivery'
    case 'Online':
      return 'online'
    default:
      return 'order-type'
  }
}

/** Badge tone for order workflow status */
export function getOrderStatusTone(status) {
  switch (status) {
    case 'Pending Confirmation':
      return 'pending-confirmation'
    case 'New':
      return 'new'
    case 'Confirmed':
      return 'confirmed'
    case 'Preparing':
      return 'preparing'
    case 'Ready':
      return 'ready'
    case 'Out for Delivery':
      return 'out-for-delivery'
    case 'Completed':
      return 'completed'
    case 'Cancelled':
      return 'cancelled'
    case 'Refunded':
      return 'refunded'
    default:
      return 'order-status'
  }
}
