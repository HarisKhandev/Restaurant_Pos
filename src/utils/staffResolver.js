export function isDeliveryRole(role) {
  return role === 'Delivery Rider' || role === 'Delivery'
}

export function isWaiterRole(role) {
  return role === 'Waiter'
}

export function buildRiderFromUser(user, fallbackBranchId, riderId) {
  return {
    id: riderId || `rd${Date.now().toString(36)}`,
    userId: user.id,
    restaurantId: user.restaurantId,
    branchId: user.branchId || fallbackBranchId || null,
    name: user.name,
    phone: user.phone || '',
    vehicle: user.vehicle || 'Motorcycle',
    status: user.riderStatus || 'Available',
    activeOrders: 0,
    completedToday: 0,
    rating: 0,
    zone: user.zone || 'General',
    route: user.route || '',
  }
}

export function buildEmployeeFromUser(user, role, fallbackBranchId, employeeId) {
  return {
    id: employeeId || `e${Date.now().toString(36)}`,
    userId: user.id,
    restaurantId: user.restaurantId,
    branchId: user.branchId || fallbackBranchId || null,
    name: user.name,
    role,
    status: 'Active',
    shift: 'Morning',
    lastActive: 'Just added',
  }
}

export function getBranchRiders(data, restaurantId, branchId) {
  const riders = (data.riders || []).filter(
    (r) => r.restaurantId === restaurantId && (!branchId || !r.branchId || r.branchId === branchId),
  )
  const linkedUserIds = new Set(riders.map((r) => r.userId).filter(Boolean))
  const linkedNames = new Set(riders.map((r) => r.name.toLowerCase()))

  const fromUsers = (data.users || [])
    .filter(
      (u) => u.restaurantId === restaurantId
        && isDeliveryRole(u.role)
        && (!branchId || !u.branchId || u.branchId === branchId)
        && !linkedUserIds.has(u.id)
        && !linkedNames.has(u.name.toLowerCase()),
    )
    .map((u) => buildRiderFromUser(u, branchId, `rd-u-${u.id}`))

  return [...riders, ...fromUsers]
}

export function getBranchWaiters(data, restaurantId, branchId) {
  const waiters = (data.employees || []).filter(
    (e) => e.restaurantId === restaurantId
      && e.role === 'Waiter'
      && e.status === 'Active'
      && (!branchId || !e.branchId || e.branchId === branchId),
  )
  const linkedUserIds = new Set(waiters.map((w) => w.userId).filter(Boolean))
  const linkedNames = new Set(waiters.map((w) => w.name.toLowerCase()))

  const fromUsers = (data.users || [])
    .filter(
      (u) => u.restaurantId === restaurantId
        && isWaiterRole(u.role)
        && (!branchId || !u.branchId || u.branchId === branchId)
        && !linkedUserIds.has(u.id)
        && !linkedNames.has(u.name.toLowerCase()),
    )
    .map((u) => buildEmployeeFromUser(u, 'Waiter', branchId, `e-u-${u.id}`))

  return [...waiters, ...fromUsers]
}
