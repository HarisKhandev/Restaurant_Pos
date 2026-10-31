export function flyToCart(sourceEl, targetEl, image) {
  if (!sourceEl || !targetEl) return
  const from = sourceEl.getBoundingClientRect()
  const to = targetEl.getBoundingClientRect()
  const flyer = document.createElement('div')
  flyer.className = 'cart-flyer'
  flyer.innerHTML = image
    ? `<img src="${image}" alt="" />`
    : '<span class="cart-flyer-dot"></span>'
  const startX = from.left + from.width / 2
  const startY = from.top + from.height / 2
  const endX = to.left + to.width / 2
  const endY = to.top + to.height / 2
  flyer.style.setProperty('--fly-x', `${endX - startX}px`)
  flyer.style.setProperty('--fly-y', `${endY - startY}px`)
  flyer.style.left = `${startX}px`
  flyer.style.top = `${startY}px`
  document.body.appendChild(flyer)
  requestAnimationFrame(() => flyer.classList.add('cart-flyer-active'))
  flyer.addEventListener('animationend', () => flyer.remove(), { once: true })
  targetEl.classList.add('cart-pulse')
  setTimeout(() => targetEl.classList.remove('cart-pulse'), 500)
}

export function pulseCartItem(itemEl) {
  if (!itemEl) return
  itemEl.classList.remove('cart-item-pop')
  void itemEl.offsetWidth
  itemEl.classList.add('cart-item-pop')
}
