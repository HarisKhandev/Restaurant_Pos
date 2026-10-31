const isAddonGroup = (group) => group?.name?.trim().toLowerCase() === 'add-ons'

export function resolveProductModifiers(product, addons = []) {
  const groups = (product.modifiers || []).filter((group) => !isAddonGroup(group))
  if (!product.addonIds?.length) return groups

  const productAddons = product.addonIds
    .map((id) => addons.find((addon) => addon.id === id && addon.active !== false))
    .filter(Boolean)

  if (productAddons.length) {
    groups.push({
      name: 'Add-ons',
      multiple: true,
      options: productAddons.map((addon) => ({ name: addon.name, price: addon.price, addonId: addon.id })),
    })
  }

  return groups
}

export function productHasModifiers(product, addons = []) {
  return resolveProductModifiers(product, addons).length > 0
}

export function withResolvedModifiers(product, addons = []) {
  return { ...product, modifiers: resolveProductModifiers(product, addons) }
}
