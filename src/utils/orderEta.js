export const DEFAULT_CATEGORY_PREP = {
  Popular: 25,
  Burgers: 15,
  Pizza: 22,
  BBQ: 20,
  Pakistani: 40,
  Rice: 18,
  Starters: 12,
  Desserts: 8,
  'Hot Drinks': 5,
  'Cold Drinks': 3,
  Deal: 30,
  Pastries: 10,
  Breads: 12,
  Cakes: 15,
  Cookies: 8,
  Beverages: 5,
  'Pain Relief': 3,
  Antibiotics: 5,
  Vitamins: 3,
  Groceries: 5,
  Dairy: 4,
  Snacks: 3,
  Shirts: 2,
  Pants: 2,
  Shoes: 2,
  Accessories: 2,
  Bags: 2,
}

export const CATEGORY_STATION = {
  Popular: 'grill',
  Burgers: 'grill',
  Pizza: 'pizza',
  BBQ: 'grill',
  Pakistani: 'karahi',
  Rice: 'rice',
  Starters: 'grill',
  Desserts: 'cold',
  'Hot Drinks': 'drinks',
  'Cold Drinks': 'drinks',
  Deal: 'mixed',
  Breads: 'bakery',
  Pastries: 'bakery',
  Cakes: 'bakery',
  Cookies: 'bakery',
  Beverages: 'drinks',
}

export const DEFAULT_PREP_SETTINGS = {
  baseMinutes: 10,
  deliveryMinutes: 15,
  rangeBuffer: 10,
  extraPerItemMinutes: 3,
  largeOrderExtra: 10,
  multiStationExtra: 8,
  busyMode: false,
  busyExtraMinutes: 15,
  categoryPrepMinutes: {},
}

export const MAX_ETA_MINUTES = 60

export function capEtaRange(min, max, maxAllowed = MAX_ETA_MINUTES) {
  const cappedMax = Math.min(Math.round(max), maxAllowed)
  let cappedMin = Math.min(Math.round(min), cappedMax)
  if (cappedMin > cappedMax - 5) cappedMin = Math.max(cappedMax - 12, 15)
  return { min: cappedMin, max: cappedMax }
}

export function formatEtaRange(min, max) {
  const low = Math.max(0, Math.round(min))
  const high = Math.max(low, Math.round(max))
  if (low === high) return `${low} min`
  return `${low}–${high} min`
}

export function getPrepSettings(restaurant) {
  return { ...DEFAULT_PREP_SETTINGS, ...(restaurant?.prepSettings || {}) }
}

export function getItemPrepMinutes(item, restaurant) {
  if (item?.prepMinutes) return item.prepMinutes
  const settings = getPrepSettings(restaurant)
  const category = item?.category || 'Popular'
  if (settings.categoryPrepMinutes?.[category]) return settings.categoryPrepMinutes[category]
  return DEFAULT_CATEGORY_PREP[category] ?? settings.baseMinutes
}

export function getItemStation(item) {
  if (item?.station) return item.station
  return CATEGORY_STATION[item?.category] || 'grill'
}

export function countKitchenQueue(orders, restaurantId) {
  return (orders || []).filter((order) => (
    order.restaurantId === restaurantId &&
    ['New', 'Confirmed', 'Preparing', 'Pending Confirmation'].includes(order.status)
  )).length
}

export function estimateOrderEta({ items = [], restaurant, orderType = 'Online', kitchenQueue = 0 }) {
  const settings = getPrepSettings(restaurant)
  const isDelivery = ['Online', 'Delivery'].includes(orderType)
  const deliveryMinutes = isDelivery ? settings.deliveryMinutes : 0
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

  if (!items.length) {
    const min = settings.baseMinutes + deliveryMinutes
    const max = min + settings.rangeBuffer
    const capped = capEtaRange(min, max)
    return {
      min: capped.min,
      max: capped.max,
      prepMin: settings.baseMinutes,
      prepMax: settings.baseMinutes + settings.rangeBuffer,
      deliveryMinutes,
      queueBuffer: 0,
      itemCount: 0,
      stationCount: 0,
      isLargeOrder: false,
      label: formatEtaRange(capped.min, capped.max),
      prepLabel: formatEtaRange(settings.baseMinutes, settings.baseMinutes + settings.rangeBuffer),
    }
  }

  const byStation = {}
  for (const item of items) {
    const station = getItemStation(item)
    const prep = getItemPrepMinutes(item, restaurant)
    const qtyExtra = Math.max(0, (item.quantity || 1) - 1) * settings.extraPerItemMinutes
    byStation[station] = Math.max(byStation[station] || 0, prep + qtyExtra)
  }

  let prepTime = Math.max(...Object.values(byStation), settings.baseMinutes)
  const stationCount = Object.keys(byStation).length
  const isLargeOrder = itemCount >= 4 || stationCount >= 3

  if (itemCount >= 5) prepTime += settings.largeOrderExtra
  if (stationCount >= 3) prepTime += settings.multiStationExtra

  let queueBuffer = 0
  if (kitchenQueue > 7) queueBuffer = 20
  else if (kitchenQueue > 4) queueBuffer = 10
  else if (kitchenQueue > 2) queueBuffer = 5

  const busyExtra = settings.busyMode ? settings.busyExtraMinutes : 0
  const totalMin = prepTime + queueBuffer + busyExtra + deliveryMinutes
  const totalMax = totalMin + settings.rangeBuffer
  const capped = capEtaRange(totalMin, totalMax)

  return {
    min: capped.min,
    max: capped.max,
    prepMin: prepTime,
    prepMax: prepTime + settings.rangeBuffer,
    deliveryMinutes,
    queueBuffer,
    busyExtra,
    itemCount,
    stationCount,
    isLargeOrder,
    label: formatEtaRange(capped.min, capped.max),
    prepLabel: formatEtaRange(prepTime, prepTime + settings.rangeBuffer),
  }
}

export function withPrepMeta(product) {
  const category = product.category || 'Popular'
  return {
    ...product,
    prepMinutes: product.prepMinutes ?? DEFAULT_CATEGORY_PREP[category] ?? 15,
    station: product.station ?? CATEGORY_STATION[category] ?? 'grill',
  }
}
