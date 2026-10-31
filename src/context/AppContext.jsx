import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { mockStorage } from '../services/mockStorage'
import { calcMaxServings, calcRecipeCost } from '../utils/inventoryRecipe'
import { calculateProductAvailability } from '../utils/inventoryAvailability'
import { normalizeInventoryFormInput, normalizeProduct, normalizeRecipe } from '../utils/dataNormalization'
import { PRODUCT_TYPES, detectComboCycle } from '../utils/productInventoryResolver'
import {
  getDefaultInventorySettings,
  processInventoryForOrder,
  recordAdjustmentMovement,
  recordPurchaseMovement,
  recordWasteMovement,
  restoreInventory,
  shouldProcessInventoryForStatus,
  validateOrderInventory,
} from '../utils/inventoryEngine'
import {
  autoGeneratePOGroup,
  buildGroupId,
  buildLowStockNotificationEntries,
  buildPOReadyNotification,
  getDefaultProcurementSettings,
  getLowStockItems,
  parseInventoryUpload,
  removeItemsFromSiblingPOs,
  syncPOGroupFromSource,
} from '../utils/purchaseOrderEngine'
import {
  buildEmployeeFromUser,
  buildRiderFromUser,
  isDeliveryRole,
  isWaiterRole,
} from '../utils/staffResolver'

const AppContext = createContext(null)

const nextId = (prefix) => `${prefix}${Date.now().toString(36)}`
const slugify = (value) => value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function buildInventoryCtx(current, restaurantId, branchId) {
  const restaurant = current.restaurants?.find((r) => r.id === restaurantId)
  return {
    products: current.products || [],
    recipes: current.recipes || [],
    inventory: current.inventory || [],
    addons: current.addons || [],
    restaurantId,
    branchId,
    inventorySettings: restaurant?.inventorySettings || getDefaultInventorySettings(),
    allowOversell: restaurant?.inventorySettings?.allowOversell ?? false,
  }
}

function refreshProductAvailability(products, recipes, inventory) {
  return products.map((product) => {
    const normalized = normalizeProduct(product, recipes, inventory)
    const availableQty = calculateProductAvailability(normalized, { products, recipes, inventory })
    return {
      ...normalized,
      stock: availableQty === Infinity ? normalized.stock : availableQty,
    }
  })
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => mockStorage.load())
  const [activeRestaurantId, setActiveRestaurantId] = useState(() => localStorage.getItem('orbit-active-restaurant') || 'r1')
  const [activeBranchId, setActiveBranchId] = useState(() => localStorage.getItem('orbit-active-branch') || 'b1')
  const [role, setRole] = useState(() => localStorage.getItem('orbit-role') || '')
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orbit-session')) }
    catch { return null }
  })
  const [customerSession, setCustomerSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orbit-customer-session')) }
    catch { return null }
  })
  const [online, setOnline] = useState(() => localStorage.getItem('orbit-online') !== 'false')
  const [theme, setTheme] = useState(() => localStorage.getItem('orbit-theme') || 'light')
  const [toast, setToast] = useState(null)

  useEffect(() => mockStorage.save(data), [data])
  useEffect(() => localStorage.setItem('orbit-active-restaurant', activeRestaurantId), [activeRestaurantId])
  useEffect(() => localStorage.setItem('orbit-active-branch', activeBranchId), [activeBranchId])
  useEffect(() => localStorage.setItem('orbit-role', role), [role])
  useEffect(() => {
    if (session) localStorage.setItem('orbit-session', JSON.stringify(session))
    else localStorage.removeItem('orbit-session')
  }, [session])
  useEffect(() => {
    if (customerSession) localStorage.setItem('orbit-customer-session', JSON.stringify(customerSession))
    else localStorage.removeItem('orbit-customer-session')
  }, [customerSession])
  useEffect(() => {
    localStorage.setItem('orbit-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const updateCollection = useCallback((collection, updater) => {
    setData((current) => ({ ...current, [collection]: updater(current[collection]) }))
  }, [])

  const switchRestaurant = useCallback((id) => {
    setActiveRestaurantId(id)
    const branch = data.branches.find((item) => item.restaurantId === id)
    if (branch) setActiveBranchId(branch.id)
  }, [data.branches])

  const toggleOnline = useCallback(() => {
    setOnline((current) => {
      const next = !current
      localStorage.setItem('orbit-online', String(next))
      if (next && data.pendingSync.length) {
        notify(`Sync complete · ${data.pendingSync.length} orders synced`)
        setData((state) => ({ ...state, pendingSync: [] }))
      } else if (!next) notify('Offline mode enabled · orders will be saved locally', 'warning')
      return next
    })
  }, [data.pendingSync.length, notify])

  const addRestaurant = useCallback((restaurant) => {
    const id = nextId('r')
    const baseSlug = slugify(restaurant.slug || restaurant.name)
    const slug = data.restaurants.some((item) => item.slug === baseSlug) ? `${baseSlug}-${id.slice(-4)}` : baseSlug
    const created = { ...restaurant, id, slug, monthlySales: 0, users: 1, status: 'Trial', createdAt: new Date().toISOString().slice(0, 10) }
    const ownerEmail = restaurant.email || `owner@${baseSlug.replace(/-/g, '')}.pk`
    const ownerUser = { id: nextId('u'), restaurantId: id, name: restaurant.owner, email: ownerEmail, password: restaurant.loginPassword || 'orbit123', role: 'Restaurant Owner' }
    setData((current) => ({ ...current, restaurants: [created, ...current.restaurants], users: [ownerUser, ...(current.users || [])] }))
    notify('Restaurant created successfully')
    return id
  }, [data.restaurants, notify])

  const updateRestaurant = useCallback((id, changes) => {
    updateCollection('restaurants', (items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))
    notify('Restaurant updated successfully')
  }, [notify, updateCollection])

  const addProduct = useCallback((product) => {
    updateCollection('products', (items) => [{
      ...product,
      id: nextId('p'),
      restaurantId: activeRestaurantId,
      available: true,
      stock: product.stock || 0,
      prepMinutes: product.prepMinutes || 15,
      modifiers: product.modifiers || [],
      addonIds: product.addonIds || [],
    }, ...items])
    notify('Product added to menu')
  }, [activeRestaurantId, notify, updateCollection])

  const updateProduct = useCallback((id, changes) => {
    updateCollection('products', (items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))
    notify('Product updated')
  }, [notify, updateCollection])

  const addInventory = useCallback((item) => {
    const normalized = normalizeInventoryFormInput({
      ...item,
      restaurantId: activeRestaurantId,
    })
    const created = {
      ...normalized,
      id: nextId('i'),
      restaurantId: activeRestaurantId,
    }
    updateCollection('inventory', (items) => [created, ...items])
    notify('Inventory item added')
    return created.id
  }, [activeRestaurantId, notify, updateCollection])

  const saveProductWithRecipe = useCallback(({ product, ingredients, productId, comboItems }) => {
    const isEdit = Boolean(productId)
    const productType = product.productType || PRODUCT_TYPES.SERVICE
    const inventoryTracking = product.inventoryTracking !== false && productType !== PRODUCT_TYPES.SERVICE
    const validIngredients = (ingredients || []).filter((ing) => ing.inventoryId && Number(ing.quantity) > 0)

    if (productType === PRODUCT_TYPES.COMBO && detectComboCycle(productId || 'new', comboItems || product.comboItems || [], data.products)) {
      notify('Combo cannot contain circular product references', 'warning')
      return { ok: false }
    }

    setData((current) => {
      const inventory = current.inventory || []
      const id = productId || nextId('p')
      const stockMode = productType === PRODUCT_TYPES.RECIPE ? 'recipe' : productType === PRODUCT_TYPES.DIRECT_STOCK ? 'direct' : null
      const recipeCost = productType === PRODUCT_TYPES.RECIPE && validIngredients.length
        ? calcRecipeCost(validIngredients, inventory)
        : Number(product.cost) || 0

      const productRecord = normalizeProduct({
        ...product,
        id,
        restaurantId: activeRestaurantId,
        available: product.manuallyDisabled ? false : product.available !== false,
        manuallyDisabled: product.manuallyDisabled ?? false,
        productType,
        inventoryTracking,
        stockMode,
        price: Number(product.price) || 0,
        cost: productType === PRODUCT_TYPES.RECIPE && validIngredients.length ? recipeCost : Number(product.cost) || 0,
        directStockConfig: product.directStockConfig || null,
        comboItems: comboItems || product.comboItems || [],
        prepMinutes: Number(product.prepMinutes) || 15,
        kitchenStation: product.kitchenStation || product.station || 'grill',
        station: product.kitchenStation || product.station || 'grill',
        modifiers: product.modifiers || [],
        addonIds: product.addonIds || [],
        description: product.description || '',
      }, current.recipes, inventory)

      if (productType === PRODUCT_TYPES.DIRECT_STOCK) {
        productRecord.stock = calculateProductAvailability(productRecord, {
          products: [productRecord],
          recipes: current.recipes,
          inventory,
        })
      } else if (productType === PRODUCT_TYPES.RECIPE) {
        productRecord.stock = calcMaxServings(validIngredients, inventory)
      } else if (productType === PRODUCT_TYPES.COMBO) {
        productRecord.stock = calculateProductAvailability(productRecord, {
          products: current.products.concat(productRecord),
          recipes: current.recipes,
          inventory,
        })
      }

      const products = isEdit
        ? current.products.map((item) => (item.id === id ? { ...item, ...productRecord } : item))
        : [{ ...productRecord, available: productRecord.available !== false }, ...current.products]

      let recipes = current.recipes || []
      const now = new Date().toISOString()
      if (productType === PRODUCT_TYPES.RECIPE && validIngredients.length) {
        const existing = recipes.find((r) => r.productId === id)
        const recipeRecord = normalizeRecipe({
          id: existing?.id || nextId('rec'),
          restaurantId: activeRestaurantId,
          productId: id,
          name: product.name,
          version: (existing?.version || 0) + (existing ? 1 : 0) || 1,
          ingredients: validIngredients.map((ing) => ({
            inventoryId: ing.inventoryId,
            quantity: Number(ing.quantity),
            unit: ing.unit,
          })),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        })
        recipes = existing
          ? recipes.map((r) => (r.productId === id ? recipeRecord : r))
          : [recipeRecord, ...recipes]
      } else if (isEdit) {
        recipes = recipes.filter((r) => r.productId !== id)
      }

      return { ...current, products: refreshProductAvailability(products, recipes, inventory), recipes }
    })

    notify(isEdit ? 'Product saved successfully' : 'Product added to menu')
    return { ok: true }
  }, [activeRestaurantId, data.products, notify])

  const addAddon = useCallback((addon) => {
    updateCollection('addons', (items) => [{ ...addon, id: nextId('a'), restaurantId: activeRestaurantId, active: addon.active !== false }, ...items])
    notify('Add-on created')
  }, [activeRestaurantId, notify, updateCollection])

  const updateAddon = useCallback((id, changes) => {
    updateCollection('addons', (items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))
    notify('Add-on updated')
  }, [notify, updateCollection])

  const deleteAddon = useCallback((id) => {
    updateCollection('addons', (items) => items.filter((item) => item.id !== id))
    updateCollection('products', (items) => items.map((product) => ({
      ...product,
      addonIds: (product.addonIds || []).filter((addonId) => addonId !== id),
    })))
    notify('Add-on removed')
  }, [notify, updateCollection])

  const runInventoryAlerts = useCallback((restaurantId, inventory, purchaseOrders, options = {}, existingNotifications) => {
    const restaurant = data.restaurants.find((r) => r.id === restaurantId)
    const procurement = { ...getDefaultProcurementSettings(), ...(restaurant?.procurementSettings || {}) }
    const nearPercent = procurement.nearThresholdPercent ?? 0.2
    const lowItems = getLowStockItems(inventory, restaurantId, nearPercent)
    let nextPOs = purchaseOrders
    let poCreated = false

    if (procurement.autoGenerate !== false && lowItems.length) {
      const beforeCount = purchaseOrders.filter((po) => po.restaurantId === restaurantId && po.autoGenerated).length
      nextPOs = autoGeneratePOGroup({
        inventory,
        restaurantId,
        existingPOs: purchaseOrders,
        nearPercent,
        groupId: buildGroupId(restaurantId),
      })
      const afterCount = nextPOs.filter((po) => po.restaurantId === restaurantId && po.autoGenerated).length
      poCreated = afterCount > beforeCount
    }

    const baseNotifications = existingNotifications ?? data.notifications ?? []
    const newNotifs = buildLowStockNotificationEntries(inventory, restaurantId, baseNotifications)
    let notifications = [...baseNotifications]
    if (newNotifs.length) notifications = [...newNotifs, ...notifications]

    if (poCreated && !options.silentPO) {
      const todayKey = `po-ready-${new Date().toISOString().slice(0, 10)}`
      const alreadyNotified = notifications.some((n) => n.sourceKey === todayKey && n.restaurantId === restaurantId)
      if (!alreadyNotified) {
        notifications = [buildPOReadyNotification(restaurantId, 3), ...notifications]
      }
    }

    return { purchaseOrders: nextPOs, notifications, lowItems }
  }, [data.notifications, data.restaurants])

  const applyInventoryProcessing = useCallback((order, action, options = {}) => {
    let result = { ok: true }
    setData((current) => {
      const ctx = buildInventoryCtx(current, order.restaurantId, order.branchId)
      result = action === 'RESTORE'
        ? restoreInventory(order, ctx, options)
        : processInventoryForOrder({ order, action: 'DEDUCT', ctx, createdBy: session?.name || 'system' })
      if (!result.ok) return current

      const inventory = result.inventory
      const movements = result.movements || []
      const recipes = current.recipes || []
      const products = refreshProductAvailability(current.products, recipes, inventory)
      const orders = current.orders.map((item) => {
        if (item.id !== order.id) return item
        return {
          ...item,
          inventoryStatus: result.inventoryStatus || item.inventoryStatus,
          costSnapshots: result.costSnapshots || item.costSnapshots,
        }
      })

      return {
        ...current,
        inventory,
        products,
        orders,
        inventoryMovements: [...movements, ...(current.inventoryMovements || [])],
      }
    })

    if (result.ok && action === 'DEDUCT') {
      setData((current) => {
        const alertResult = runInventoryAlerts(order.restaurantId, result.inventory, current.purchaseOrders || [], { silentPO: true }, current.notifications)
        return {
          ...current,
          purchaseOrders: alertResult.purchaseOrders,
          notifications: alertResult.notifications,
        }
      })
      const lowStock = (result.inventory || []).filter((inv) => inv.stock <= inv.minimum && inv.stock > 0)
      if (lowStock.length) notify(`Low stock alert: ${lowStock.map((i) => i.name).join(', ')}`, 'warning')
    }
    return result
  }, [notify, runInventoryAlerts, session?.name])

  const updateOrder = useCallback((id, changes, options = {}) => {
    const existing = data.orders.find((o) => o.id === id)
    if (!existing) return

    const nextStatus = changes.status ?? existing.status
    const restaurant = data.restaurants.find((r) => r.id === existing.restaurantId)
    const timing = restaurant?.inventorySettings?.deductionTiming || getDefaultInventorySettings().deductionTiming

    if (changes.status === 'Cancelled' && existing.inventoryStatus?.processed && !existing.inventoryStatus?.restored) {
      if (options.restoreInventory === true) {
        applyInventoryProcessing(existing, 'RESTORE', { partialRestore: options.partialRestore, createdBy: session?.name })
      }
    } else if (!existing.inventoryStatus?.processed && shouldProcessInventoryForStatus(nextStatus, timing)) {
      const ctx = buildInventoryCtx(data, existing.restaurantId, existing.branchId)
      const validation = validateOrderInventory({ ...existing, ...changes }, ctx)
      if (!validation.ok && !ctx.allowOversell) {
        notify(`Insufficient inventory: ${validation.shortages.map((s) => s.name).join(', ')}`, 'warning')
        return { ok: false, shortages: validation.shortages }
      }
      applyInventoryProcessing({ ...existing, ...changes }, 'DEDUCT')
    }

    updateCollection('orders', (items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))

    if (changes.status === 'Ready' && existing.paymentStatus === 'Pending' && existing.tableId) {
      updateCollection('tables', (items) => items.map((table) => (
        table.id === existing.tableId ? { ...table, status: 'Payment Pending' } : table
      )))
    }

    if (!options.silent) notify('Order status updated')
    return { ok: true }
  }, [applyInventoryProcessing, data, notify, session?.name, updateCollection])

  const validateOrderStock = useCallback((orderPayload) => {
    const restaurantId = orderPayload.restaurantId || activeRestaurantId
    const ctx = buildInventoryCtx(data, restaurantId, orderPayload.branchId || activeBranchId)
    return validateOrderInventory(orderPayload, ctx)
  }, [activeBranchId, activeRestaurantId, data])

  const createOrder = useCallback((payload) => {
    const id = nextId('o')
    const restaurantId = payload.restaurantId || activeRestaurantId
    const branchId = payload.branchId || data.branches.find((item) => item.restaurantId === restaurantId)?.id || activeBranchId
    const status = payload.status || 'Completed'
    const restaurant = data.restaurants.find((r) => r.id === restaurantId)
    const timing = restaurant?.inventorySettings?.deductionTiming || getDefaultInventorySettings().deductionTiming
    const ctx = buildInventoryCtx(data, restaurantId, branchId)

    const validation = validateOrderInventory(payload, ctx)
    if (!validation.ok && !ctx.allowOversell) {
      notify(`Insufficient inventory for this order`, 'warning')
      return { ok: false, shortages: validation.shortages }
    }

    const order = {
      ...payload,
      id,
      number: `#${1040 + data.orders.length}`,
      restaurantId,
      branchId,
      createdAt: new Date().toISOString(),
      status,
      isNew: ['New', 'Pending Confirmation'].includes(status),
      inventoryStatus: { processed: false, restored: false },
    }

    let inventoryResult = null
    setData((current) => {
      const sold = new Map(payload.items.map((item) => [item.id, item.quantity]))
      const recipes = current.recipes || []
      let inventory = current.inventory || []
      let inventoryMovements = current.inventoryMovements || []
      let inventoryStatus = order.inventoryStatus
      let costSnapshots = []

      if (shouldProcessInventoryForStatus(status, timing)) {
        const processCtx = buildInventoryCtx(current, restaurantId, branchId)
        inventoryResult = processInventoryForOrder({
          order,
          action: 'DEDUCT',
          ctx: processCtx,
          createdBy: session?.name || 'system',
        })
        inventory = inventoryResult.inventory
        inventoryMovements = [...(inventoryResult.movements || []), ...inventoryMovements]
        inventoryStatus = inventoryResult.inventoryStatus
        costSnapshots = inventoryResult.costSnapshots || []
      }

      const updatedProducts = refreshProductAvailability(
        current.products.map((product) => {
          const qty = sold.get(product.id) || 0
          if (!qty) return product
          return { ...product, totalSold: (product.totalSold || 0) + qty }
        }),
        recipes,
        inventory,
      )

      let updatedCustomers = current.customers || []
      if (payload.customer && payload.phone) {
        const phone = payload.phone.replace(/\s/g, '')
        const existing = updatedCustomers.find((c) => c.phone === phone && c.restaurantId === restaurantId)
        if (existing) {
          updatedCustomers = updatedCustomers.map((c) => c.id === existing.id ? { ...c, name: payload.customer, orders: c.orders + 1, spent: c.spent + (payload.total || 0), lastOrder: new Date().toISOString().slice(0, 10), points: c.points + Math.floor((payload.total || 0) / 100), address: payload.deliveryAddress?.split(',')[0]?.trim() || c.address, area: payload.deliveryAddress?.split(',')[1]?.trim() || c.area } : c)
        } else if (payload.customerId) {
          updatedCustomers = updatedCustomers.map((c) => c.id === payload.customerId ? { ...c, name: payload.customer, orders: c.orders + 1, spent: c.spent + (payload.total || 0), lastOrder: new Date().toISOString().slice(0, 10), points: c.points + Math.floor((payload.total || 0) / 100), address: payload.deliveryAddress?.split(',')[0]?.trim() || c.address, area: payload.deliveryAddress?.split(',')[1]?.trim() || c.area } : c)
        } else {
          updatedCustomers = [{ id: nextId('cu'), restaurantId, name: payload.customer, phone, email: '', orders: 1, spent: payload.total || 0, points: Math.floor((payload.total || 0) / 100), lastOrder: new Date().toISOString().slice(0, 10), status: 'Active' }, ...updatedCustomers]
        }
      }

      let tables = current.tables || []
      if (payload.tableId) {
        const payLater = payload.paymentStatus === 'Pending'
        tables = tables.map((table) => {
          if (table.id !== payload.tableId) return table
          return {
            ...table,
            status: payLater ? 'Occupied' : (status === 'Completed' ? 'Available' : 'Occupied'),
            currentOrderId: payLater || status !== 'Completed' ? id : null,
          }
        })
      }

      return {
        ...current,
        orders: [{ ...order, inventoryStatus, costSnapshots }, ...current.orders],
        products: updatedProducts,
        customers: updatedCustomers,
        inventory,
        inventoryMovements,
        tables,
        pendingSync: online ? current.pendingSync : [...current.pendingSync, id],
      }
    })

    if (inventoryResult?.movements?.length) {
      const lowStock = (data.inventory || []).filter((inv) => inv.stock <= inv.minimum && inv.stock > 0)
      if (lowStock.length) notify(`Low stock alert: ${lowStock.map((i) => i.name).join(', ')}`, 'warning')
    }

    notify(online ? `Order ${order.number} ${status === 'Completed' ? 'completed' : 'placed'}` : `Order ${order.number} saved for sync`)
    return { ok: true, order }
  }, [activeBranchId, activeRestaurantId, data, notify, online, session?.name])

  const completeOrderPayment = useCallback((orderId, paymentDetails) => {
    let completedOrder = null
    setData((current) => {
      const existing = current.orders.find((o) => o.id === orderId)
      if (!existing) return current

      completedOrder = {
        ...existing,
        ...paymentDetails,
        paymentStatus: 'Paid',
        status: 'Completed',
        paidAt: new Date().toISOString(),
      }

      let tables = current.tables || []
      if (existing.tableId) {
        tables = tables.map((table) => (
          table.id === existing.tableId
            ? { ...table, status: 'Available', currentOrderId: null }
            : table
        ))
      }

      let customers = current.customers || []
      if (existing.customer && existing.phone) {
        const phone = existing.phone.replace(/\s/g, '')
        customers = customers.map((c) => (
          c.phone === phone && c.restaurantId === existing.restaurantId
            ? {
              ...c,
              spent: c.spent + (paymentDetails.total || existing.total || 0),
              points: c.points + Math.floor((paymentDetails.total || existing.total || 0) / 100),
              lastOrder: new Date().toISOString().slice(0, 10),
            }
            : c
        ))
      }

      return {
        ...current,
        orders: current.orders.map((o) => (o.id === orderId ? completedOrder : o)),
        tables,
        customers,
      }
    })

    if (completedOrder) notify(`Payment collected for ${completedOrder.number} · table cleared`)
    return completedOrder ? { ok: true, order: completedOrder } : { ok: false }
  }, [notify])

  const recordWaste = useCallback((payload) => {
    const ctx = buildInventoryCtx(data, activeRestaurantId, activeBranchId)
    const result = recordWasteMovement({ ...payload, ctx, createdBy: session?.name || 'system' })
    if (!result.ok) {
      notify(result.error || 'Could not record waste', 'warning')
      return result
    }
    setData((current) => ({
      ...current,
      inventory: result.inventory,
      inventoryMovements: [...(result.movements || []), ...(current.inventoryMovements || [])],
      products: refreshProductAvailability(current.products, current.recipes, result.inventory),
    }))
    notify('Waste recorded')
    return result
  }, [activeBranchId, activeRestaurantId, data, notify, session?.name])

  const recordStockAdjustment = useCallback((payload) => {
    const ctx = buildInventoryCtx(data, activeRestaurantId, activeBranchId)
    const result = recordAdjustmentMovement({ ...payload, ctx, createdBy: session?.name || 'system' })
    if (!result.ok) {
      notify(result.error || 'Could not adjust stock', 'warning')
      return result
    }
    setData((current) => ({
      ...current,
      inventory: result.inventory,
      inventoryMovements: [...(result.movements || []), ...(current.inventoryMovements || [])],
      products: refreshProductAvailability(current.products, current.recipes, result.inventory),
    }))
    notify('Stock adjustment saved')
    return result
  }, [activeBranchId, activeRestaurantId, data, notify, session?.name])

  const addUser = useCallback((user) => {
    const id = nextId('u')
    const created = {
      ...user,
      id,
      restaurantId: user.restaurantId || activeRestaurantId,
    }

    setData((current) => {
      const users = [created, ...(current.users || [])]
      let riders = current.riders || []
      let employees = current.employees || []

      if (isDeliveryRole(created.role)) {
        riders = [buildRiderFromUser(created, created.branchId || activeBranchId), ...riders]
        employees = [buildEmployeeFromUser(created, 'Delivery Rider', created.branchId || activeBranchId), ...employees]
      } else if (isWaiterRole(created.role)) {
        employees = [buildEmployeeFromUser(created, 'Waiter', created.branchId || activeBranchId), ...employees]
      }

      return { ...current, users, riders, employees }
    })

    notify('User created successfully')
    return id
  }, [activeBranchId, activeRestaurantId, notify])

  const updateUser = useCallback((id, changes) => {
    setData((current) => {
      const users = (current.users || []).map((item) => item.id === id ? { ...item, ...changes } : item)
      const updated = users.find((item) => item.id === id)
      if (!updated) return current

      let riders = [...(current.riders || [])]
      let employees = [...(current.employees || [])]

      if (isDeliveryRole(updated.role)) {
        const riderIdx = riders.findIndex((r) => r.userId === id)
        if (riderIdx >= 0) {
          riders[riderIdx] = {
            ...riders[riderIdx],
            name: updated.name,
            branchId: updated.branchId ?? riders[riderIdx].branchId,
          }
        } else {
          riders = [buildRiderFromUser(updated, updated.branchId || activeBranchId), ...riders]
        }

        const empIdx = employees.findIndex((e) => e.userId === id && e.role === 'Delivery Rider')
        if (empIdx >= 0) {
          employees[empIdx] = {
            ...employees[empIdx],
            name: updated.name,
            branchId: updated.branchId ?? employees[empIdx].branchId,
          }
        } else {
          employees = [buildEmployeeFromUser(updated, 'Delivery Rider', updated.branchId || activeBranchId), ...employees]
        }
      } else {
        riders = riders.filter((r) => r.userId !== id)
        employees = employees.filter((e) => !(e.userId === id && e.role === 'Delivery Rider'))
      }

      if (isWaiterRole(updated.role)) {
        const empIdx = employees.findIndex((e) => e.userId === id && e.role === 'Waiter')
        if (empIdx >= 0) {
          employees[empIdx] = {
            ...employees[empIdx],
            name: updated.name,
            branchId: updated.branchId ?? employees[empIdx].branchId,
          }
        } else {
          employees = [buildEmployeeFromUser(updated, 'Waiter', updated.branchId || activeBranchId), ...employees]
        }
      } else {
        employees = employees.filter((e) => !(e.userId === id && e.role === 'Waiter'))
      }

      return { ...current, users, riders, employees }
    })
    notify('User updated')
  }, [activeBranchId, notify])

  const deleteUser = useCallback((id) => {
    setData((current) => ({
      ...current,
      users: (current.users || []).filter((item) => item.id !== id),
      riders: (current.riders || []).filter((item) => item.userId !== id),
      employees: (current.employees || []).filter((item) => item.userId !== id),
    }))
    notify('User removed')
  }, [notify])

  const login = useCallback(({ role: nextRole, restaurantId = null, name, email, permissions }) => {
    const nextSession = { role: nextRole, restaurantId, name, email, permissions: permissions || null, signedInAt: new Date().toISOString() }
    setRole(nextRole)
    setSession(nextSession)
    if (restaurantId) switchRestaurant(restaurantId)
    return nextSession
  }, [switchRestaurant])

  const logout = useCallback(() => {
    setRole('')
    setSession(null)
  }, [])

  const normalizePhone = (value) => value.replace(/\s/g, '')
  const isValidPhone = (value) => /^03\d{9}$/.test(normalizePhone(value))
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  const findCustomerByIdentifier = useCallback((restaurantId, identifier) => {
    const id = identifier.trim().toLowerCase()
    const phone = normalizePhone(identifier)
    return (data.customers || []).find((c) => c.restaurantId === restaurantId && (
      (isValidPhone(identifier) && normalizePhone(c.phone) === phone) ||
      (c.email && c.email.toLowerCase() === id)
    ))
  }, [data.customers])

  const requestCustomerOtp = useCallback(({ restaurantId, identifier, name, mode = 'login' }) => {
    const trimmed = identifier.trim()
    if (!trimmed) return { ok: false, error: 'Enter your phone number or email address.' }
    if (!isValidPhone(trimmed) && !isValidEmail(trimmed)) return { ok: false, error: 'Use a valid 03XXXXXXXXX phone or email address.' }
    if (mode === 'signup' && !name?.trim()) return { ok: false, error: 'Enter your name to create an account.' }
    const existing = findCustomerByIdentifier(restaurantId, trimmed)
    if (mode === 'login' && !existing) return { ok: false, error: 'No account found. Please sign up first.' }
    if (mode === 'signup' && existing) return { ok: false, error: 'Account already exists. Please log in instead.' }
    return { ok: true, pending: { restaurantId, identifier: trimmed, name: name?.trim(), mode }, demoOtp: '1234' }
  }, [findCustomerByIdentifier])

  const verifyCustomerOtp = useCallback(({ restaurantId, identifier, otp, name, mode = 'login' }) => {
    if (!/^\d{4}$/.test(String(otp).trim())) return { ok: false, error: 'Enter the 4-digit verification code.' }
    const trimmed = identifier.trim()
    let customer = findCustomerByIdentifier(restaurantId, trimmed)
    if (mode === 'signup' && !customer) {
      const phone = isValidPhone(trimmed) ? normalizePhone(trimmed) : ''
      const email = isValidEmail(trimmed) ? trimmed.toLowerCase() : ''
      customer = {
        id: nextId('cu'), restaurantId, name: name?.trim() || 'Guest', phone: phone || `03${Date.now().toString().slice(-9)}`, email,
        orders: 0, spent: 0, points: 0, lastOrder: null, status: 'Active', portalVerified: true,
        address: '', area: '', addresses: [],
      }
      updateCollection('customers', (items) => [customer, ...items])
    }
    if (!customer) return { ok: false, error: 'Account not found. Please sign up first.' }
    const nextSession = {
      customerId: customer.id, restaurantId, name: customer.name,
      phone: customer.phone, email: customer.email || '',
      points: customer.points || 0, signedInAt: new Date().toISOString(),
    }
    setCustomerSession(nextSession)
    notify(`Welcome back, ${customer.name.split(' ')[0]}!`)
    return { ok: true, session: nextSession, customer }
  }, [findCustomerByIdentifier, notify, updateCollection])

  const customerLogout = useCallback(() => {
    setCustomerSession(null)
    notify('Signed out successfully')
  }, [notify])

  const getCustomerOrders = useCallback((restaurantId, customerId) => {
    return data.orders.filter((o) => o.restaurantId === restaurantId && (
      o.customerId === customerId ||
      (customerSession?.phone && o.phone && normalizePhone(o.phone) === normalizePhone(customerSession.phone))
    )).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [customerSession?.phone, data.orders])

  const submitFeedback = useCallback(({ restaurantId, customerId, customerName, orderId, rating, category, message }) => {
    if (!rating || !message?.trim()) return { ok: false, error: 'Please add a rating and your feedback.' }
    const entry = {
      id: nextId('fb'), restaurantId, customerId, customerName, orderId: orderId || null,
      rating, category: category || 'General', message: message.trim(),
      createdAt: new Date().toISOString(), status: 'New',
    }
    updateCollection('feedback', (items) => [entry, ...(items || [])])
    notify('Thank you for your feedback!')
    return { ok: true, feedback: entry }
  }, [notify, updateCollection])

  const createSupportTicket = useCallback(({ restaurantId, customerId, customerName, subject, message, type = 'General' }) => {
    if (!subject?.trim() || !message?.trim()) return { ok: false, error: 'Please fill in subject and message.' }
    const ticket = {
      id: nextId('st'), restaurantId, customerId, customerName,
      subject: subject.trim(), message: message.trim(), type,
      status: 'Open', createdAt: new Date().toISOString(), response: null,
    }
    updateCollection('supportTickets', (items) => [ticket, ...(items || [])])
    notify('Support request submitted — we will respond shortly')
    return { ok: true, ticket }
  }, [notify, updateCollection])

  const addOffer = useCallback((offer) => {
    updateCollection('offers', (items) => [{ ...offer, id: nextId('of'), restaurantId: activeRestaurantId, active: true }, ...items])
    notify('Offer created successfully')
  }, [activeRestaurantId, notify, updateCollection])

  const updateOffer = useCallback((id, changes) => {
    updateCollection('offers', (items) => items.map((item) => item.id === id ? { ...item, ...changes } : item))
    notify('Offer updated')
  }, [notify, updateCollection])

  const deleteOffer = useCallback((id) => {
    updateCollection('offers', (items) => items.filter((item) => item.id !== id))
    notify('Offer removed')
  }, [notify, updateCollection])

  const addExpense = useCallback((expense) => {
    updateCollection('expenses', (items) => [{ ...expense, id: nextId('ex'), date: new Date().toISOString().slice(0, 10), branchId: activeBranchId }, ...items])
    notify('Expense recorded')
  }, [activeBranchId, notify, updateCollection])

  const markNotificationRead = useCallback((id) => {
    updateCollection('notifications', (items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }, [updateCollection])

  const markAllNotificationsRead = useCallback((restaurantId) => {
    updateCollection('notifications', (items) => items.map((item) => (
      !restaurantId || item.restaurantId === restaurantId || !item.restaurantId
        ? { ...item, read: true }
        : item
    )))
  }, [updateCollection])

  const updatePurchaseOrderItems = useCallback((poId, items) => {
    setData((current) => {
      const synced = syncPOGroupFromSource(current.purchaseOrders || [], poId, items)
      return { ...current, purchaseOrders: synced }
    })
    notify('PO updated — synced across daily, weekly & monthly orders')
  }, [notify])

  const receivePurchaseOrder = useCallback((poId) => {
    const po = (data.purchaseOrders || []).find((p) => p.id === poId)
    if (!po) return { ok: false }

    const ctx = buildInventoryCtx(data, po.restaurantId, activeBranchId)
    const receiveItems = (po.items || []).map((item) => ({
      inventoryItemId: item.inventoryId,
      quantity: item.requiredQty ?? item.requiredQuantity ?? 0,
      unit: item.unit,
    }))

    const result = recordPurchaseMovement({
      items: receiveItems,
      ctx,
      referenceId: po.id,
      notes: `Received ${po.number}`,
      createdBy: session?.name || 'system',
    })

    if (!result.ok) {
      notify(result.error || 'Could not receive PO', 'warning')
      return result
    }

    const inventoryIds = (po.items || []).map((item) => item.inventoryId)
    let purchaseOrders = (data.purchaseOrders || []).map((p) => (
      p.id === poId ? { ...p, status: 'Received', receivedAt: new Date().toISOString() } : p
    ))
    if (po.groupId) {
      purchaseOrders = removeItemsFromSiblingPOs(purchaseOrders, po.groupId, poId, inventoryIds)
    }

    const alertResult = runInventoryAlerts(po.restaurantId, result.inventory, purchaseOrders, { silentPO: true })

    setData((current) => ({
      ...current,
      inventory: result.inventory,
      products: refreshProductAvailability(current.products, current.recipes, result.inventory),
      inventoryMovements: [...(result.movements || []), ...(current.inventoryMovements || [])],
      purchaseOrders: alertResult.purchaseOrders,
      notifications: alertResult.notifications,
    }))

    notify(`${po.number} received — stock updated, items removed from other POs`)
    return { ok: true }
  }, [activeBranchId, data, notify, runInventoryAlerts, session?.name])

  const uploadInventoryStock = useCallback((text, restaurantId = activeRestaurantId) => {
    const parsed = parseInventoryUpload(text, data.inventory || [], restaurantId)
    if (!parsed.updated.length && !parsed.created?.length) {
      notify(parsed.notFound.length ? 'No matching products found in upload' : 'Upload file is empty or invalid', 'warning')
      return parsed
    }

    const updateMap = new Map(parsed.updated.map((u) => [u.inventoryId, u.quantity]))
    setData((current) => {
      let inventory = [...(current.inventory || [])]

      parsed.created?.forEach((item) => {
        const normalized = normalizeInventoryFormInput({
          name: item.name,
          sku: item.sku,
          category: item.category,
          unit: item.unit,
          stock: item.quantity,
          minimum: item.minimum,
          restaurantId,
        })
        inventory = [{
          ...normalized,
          id: nextId('i'),
          restaurantId,
        }, ...inventory]
      })

      inventory = inventory.map((item) => {
        const qty = updateMap.get(item.id)
        if (qty === undefined) return item
        return { ...item, stock: qty, currentStock: qty }
      })

      const alertResult = runInventoryAlerts(restaurantId, inventory, current.purchaseOrders || [], {}, current.notifications)
      return {
        ...current,
        inventory,
        products: refreshProductAvailability(current.products, current.recipes, inventory),
        purchaseOrders: alertResult.purchaseOrders,
        notifications: alertResult.notifications,
      }
    })

    const parts = []
    if (parsed.updated.length) parts.push(`${parsed.updated.length} updated`)
    if (parsed.created?.length) parts.push(`${parsed.created.length} new added`)
    notify(`Stock upload complete — ${parts.join(', ')}`)
    return parsed
  }, [activeRestaurantId, data.inventory, notify, runInventoryAlerts])

  const procurementChecked = useRef(false)
  useEffect(() => {
    if (!activeRestaurantId || procurementChecked.current) return
    procurementChecked.current = true

    setData((current) => {
      const inventory = current.inventory || []
      const alertResult = runInventoryAlerts(activeRestaurantId, inventory, current.purchaseOrders || [], { silentPO: false }, current.notifications)
      const changed = alertResult.purchaseOrders !== current.purchaseOrders
        || alertResult.notifications.length !== (current.notifications || []).length
      if (!changed) return current
      return {
        ...current,
        purchaseOrders: alertResult.purchaseOrders,
        notifications: alertResult.notifications,
      }
    })
  }, [activeRestaurantId, runInventoryAlerts])

  const resetDemo = useCallback(() => {
    setData(mockStorage.reset())
    notify('Demo data reset')
  }, [notify])

  const activeRestaurant = data.restaurants.find((item) => item.id === activeRestaurantId) || data.restaurants[0]
  const activeBranch = data.branches.find((item) => item.id === activeBranchId) || data.branches.find((item) => item.restaurantId === activeRestaurant?.id)
  const restaurantBranches = data.branches.filter((item) => item.restaurantId === activeRestaurant?.id)

  const value = useMemo(() => ({
    data, setData, activeRestaurant, activeRestaurantId, activeBranch, activeBranchId, restaurantBranches,
    role, setRole, session, login, logout, customerSession, customerLogout, requestCustomerOtp, verifyCustomerOtp,
    getCustomerOrders, submitFeedback, createSupportTicket,
    online, theme, toast, setActiveBranchId, switchRestaurant, toggleOnline,
    setTheme, notify, addRestaurant, updateRestaurant, addProduct, updateProduct, addInventory, saveProductWithRecipe, updateOrder, createOrder,
    addAddon, updateAddon, deleteAddon,
    addOffer, updateOffer, deleteOffer, addExpense, validateOrderStock, recordWaste, recordStockAdjustment,
    markNotificationRead, markAllNotificationsRead, updatePurchaseOrderItems, receivePurchaseOrder, uploadInventoryStock,
    completeOrderPayment,
    updateCollection, resetDemo, addUser, updateUser, deleteUser,
  }), [data, activeRestaurant, activeRestaurantId, activeBranch, activeBranchId, restaurantBranches, role, session, login, logout, customerSession, customerLogout, requestCustomerOtp, verifyCustomerOtp, getCustomerOrders, submitFeedback, createSupportTicket, online, theme, toast, switchRestaurant, toggleOnline, notify, addRestaurant, updateRestaurant, addProduct, updateProduct, addInventory, saveProductWithRecipe, updateOrder, createOrder, addAddon, updateAddon, deleteAddon, addOffer, updateOffer, deleteOffer, addExpense, validateOrderStock, recordWaste, recordStockAdjustment, markNotificationRead, markAllNotificationsRead, updatePurchaseOrderItems, receivePurchaseOrder, uploadInventoryStock, completeOrderPayment, updateCollection, resetDemo, addUser, updateUser, deleteUser])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
