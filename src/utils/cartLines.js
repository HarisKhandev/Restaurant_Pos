export function buildCartSignature(productId, modifiers = []) {
  return `${productId}-${modifiers.map((modifier) => modifier.name).sort().join('-')}`
}

export function buildCartLine(product, modifiers = [], prefix = 'line') {
  const modTotal = modifiers.reduce((sum, modifier) => sum + modifier.price, 0)
  return {
    ...product,
    lineId: `${prefix}-${Date.now()}`,
    signature: buildCartSignature(product.id, modifiers),
    quantity: 1,
    modifiers,
    lineTotal: product.price + modTotal,
  }
}

export function cartLineAmount(item) {
  return (item.lineTotal ?? item.price) * item.quantity
}

export function upsertCartLine(items, line) {
  const existing = items.find((item) => item.signature === line.signature)
  if (existing) {
    return items.map((item) => item.signature === line.signature ? { ...item, quantity: item.quantity + 1 } : item)
  }
  return [...items, line]
}
