import { useMemo, useState } from 'react'
import { ChefHat, Layers, Minus, Package, Plus } from 'lucide-react'
import { DEFAULT_CATEGORY_PREP } from '../utils/orderEta'
import { calcMaxServings } from '../utils/inventoryRecipe'
import { getProductRecipe } from '../utils/productInventoryResolver'
import { PRODUCT_TYPES } from '../utils/productInventoryResolver'
import { getCompatibleUnits, getDefaultRecipeUnit, getInventoryStockInUnit, getPurchaseUnitLabel, getQuantityInputProps, getRecipeQuantityHint, getUnitInfo, PURCHASE_UNITS, validateRecipeIngredient } from '../utils/inventoryUnits'
import { getBusinessLabels, getDefaultInventoryCategory, getDefaultMenuCategory, getInventoryCategories } from '../utils/businessConfig'
import { Button, Field, Input, Modal, SectionHeader, Select, Tabs } from './ui'

const BUILDER_STEPS = ['Basic Information', 'Inventory & Recipe', 'Availability & Settings']

export function buildEmptyProductForm(categories = [], businessType = 'restaurant') {
  return {
    name: '',
    sku: '',
    category: getDefaultMenuCategory(categories, businessType),
    description: '',
    price: '',
    cost: '',
    stock: 20,
    image: '',
    prepMinutes: 15,
    addonIds: [],
    inventoryTracking: true,
    productType: PRODUCT_TYPES.RECIPE,
    directStockConfig: { inventoryItemId: '', quantityPerSale: 1, unit: 'pcs' },
    comboItems: [{ productId: '', quantity: 1 }],
    ingredients: [{ inventoryId: '', quantity: '', unit: '' }],
    manuallyDisabled: false,
    allowNegativeStock: false,
  }
}

function emptyInventoryFormFor(businessType = 'restaurant') {
  return {
    name: '',
    sku: '',
    category: getDefaultInventoryCategory(businessType),
    unit: 'kg',
    stock: 0,
    minimum: 5,
    purchaseUnit: 'pack',
    packSize: 1,
    purchaseCost: '',
  }
}

export function productToForm(product, recipes = []) {
  const recipe = getProductRecipe(product.id, recipes)
  const productType = product.productType || (recipe ? PRODUCT_TYPES.RECIPE : product.stockMode === 'direct' ? PRODUCT_TYPES.DIRECT_STOCK : PRODUCT_TYPES.SERVICE)
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    description: product.description || '',
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    image: product.image || '',
    prepMinutes: product.prepMinutes || DEFAULT_CATEGORY_PREP[product.category] || 15,
    addonIds: product.addonIds || [],
    inventoryTracking: product.inventoryTracking !== false && productType !== PRODUCT_TYPES.SERVICE,
    productType,
    directStockConfig: product.directStockConfig || { inventoryItemId: '', quantityPerSale: 1, unit: 'pcs' },
    comboItems: product.comboItems?.length ? product.comboItems : [{ productId: '', quantity: 1 }],
    ingredients: recipe?.ingredients?.length
      ? recipe.ingredients.map((ing) => ({ inventoryId: ing.inventoryId, quantity: ing.quantity, unit: ing.unit || '' }))
      : [{ inventoryId: '', quantity: '', unit: '' }],
    manuallyDisabled: product.manuallyDisabled ?? product.available === false,
    allowNegativeStock: product.allowNegativeStock ?? false,
  }
}

function validateIngredients(ingredients, inventory) {
  const errors = []
  const seen = new Set()
  ingredients.forEach((ing, idx) => {
    if (!ing.inventoryId) return
    if (seen.has(ing.inventoryId)) {
      const item = inventory.find((i) => i.id === ing.inventoryId)
      errors.push(`Row ${idx + 1}: duplicate ingredient${item ? ` (${item.name})` : ''}`)
    }
    seen.add(ing.inventoryId)
    const item = inventory.find((i) => i.id === ing.inventoryId)
    errors.push(...validateRecipeIngredient(ing, item, idx))
  })
  return errors
}

function InventoryPurchaseFields({ form, onPatch, stockUnit }) {
  const purchaseLabel = getPurchaseUnitLabel(form.purchaseUnit || 'pack')
  return <>
    <div className="span-2 inventory-form-section">
      <p className="inventory-form-section-title">How you buy it</p>
      <p className="inventory-form-section-desc">Optional — e.g. ketchup bought as packs, not per kilogram.</p>
    </div>
    <Field label="Purchased as">
      <Select value={form.purchaseUnit || 'pack'} onChange={(e) => onPatch({ purchaseUnit: e.target.value })}>
        {PURCHASE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
      </Select>
    </Field>
    <Field label={`Quantity per ${purchaseLabel.toLowerCase()}`} hint={`How many ${stockUnit} in one ${purchaseLabel.toLowerCase()}? e.g. 5 for a 5 kg pack.`}>
      <Input type="number" min="0.001" step="0.001" value={form.packSize ?? 1} onChange={(e) => onPatch({ packSize: e.target.value })}/>
    </Field>
    <Field label={`Cost per ${purchaseLabel.toLowerCase()}`} hint={`Total price for one ${purchaseLabel.toLowerCase()}, not per ${stockUnit}.`}>
      <Input type="number" min="0" placeholder="e.g. 850" value={form.purchaseCost} onChange={(e) => onPatch({ purchaseCost: e.target.value })}/>
    </Field>
  </>
}

export default function ProductBuilder({
  open,
  editing,
  form,
  setForm,
  onClose,
  onSave,
  categories,
  businessType = 'restaurant',
  restaurantInventory,
  restaurantAddons,
  restaurantProducts,
  addInventory,
}) {
  const labels = getBusinessLabels(businessType)
  const inventoryCategories = getInventoryCategories(businessType)
  const [step, setStep] = useState(0)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [inventoryForm, setInventoryForm] = useState(() => emptyInventoryFormFor(businessType))
  const [pendingInventoryRow, setPendingInventoryRow] = useState(null)
  const [errors, setErrors] = useState([])

  const categoryAddons = restaurantAddons.filter((addon) => addon.category === form.category)
  const maxServings = form.productType === PRODUCT_TYPES.RECIPE
    ? calcMaxServings(form.ingredients, restaurantInventory)
    : Number(form.stock) || 0

  const comboProductOptions = useMemo(
    () => restaurantProducts.filter((p) => p.id !== editing?.id && p.productType !== PRODUCT_TYPES.COMBO),
    [editing?.id, restaurantProducts],
  )

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }))

  const setProductType = (productType) => {
    setForm((f) => ({
      ...f,
      productType,
      inventoryTracking: productType !== PRODUCT_TYPES.SERVICE,
    }))
  }

  const addIngredientRow = () => setForm((f) => ({ ...f, ingredients: [...f.ingredients, { inventoryId: '', quantity: '', unit: '' }] }))
  const removeIngredientRow = (idx) => setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))
  const updateIngredient = (idx, key, val) => setForm((f) => ({
    ...f,
    ingredients: f.ingredients.map((ing, i) => (i === idx ? { ...ing, [key]: val } : ing)),
  }))

  const selectIngredient = (idx, inventoryId) => {
    setForm((f) => {
      const selectedItem = restaurantInventory.find((i) => i.id === inventoryId)
      const baseUnit = selectedItem?.baseUnit || selectedItem?.unit || ''
      return {
        ...f,
        ingredients: f.ingredients.map((ing, i) => (i === idx ? {
          ...ing,
          inventoryId,
          unit: selectedItem ? getDefaultRecipeUnit(baseUnit) : '',
          quantity: ing.quantity,
        } : ing)),
      }
    })
  }

  const openQuickInventory = (rowIdx) => {
    setPendingInventoryRow(rowIdx)
    setInventoryForm({ ...emptyInventoryFormFor(businessType), sku: `INV-${Date.now().toString(36).slice(-4).toUpperCase()}` })
    setInventoryOpen(true)
  }

  const handleNewInventoryItem = () => {
    const emptyIdx = form.ingredients.findIndex((ing) => !ing.inventoryId)
    if (emptyIdx >= 0) {
      openQuickInventory(emptyIdx)
      return
    }
    const newIdx = form.ingredients.length
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { inventoryId: '', quantity: '', unit: '' }] }))
    openQuickInventory(newIdx)
  }

  const patchInventoryForm = (patch) => setInventoryForm((current) => ({ ...current, ...patch }))

  const saveQuickInventory = (e) => {
    e.preventDefault()
    const id = addInventory(inventoryForm)
    const rowIdx = pendingInventoryRow
    const unit = getDefaultRecipeUnit(inventoryForm.unit)
    if (rowIdx !== null) {
      setForm((f) => ({
        ...f,
        ingredients: f.ingredients.map((ing, i) => (i === rowIdx ? { ...ing, inventoryId: id, unit } : ing)),
      }))
    }
    setInventoryOpen(false)
    setPendingInventoryRow(null)
    setInventoryForm(emptyInventoryFormFor(businessType))
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const nextErrors = []
    if (!form.name?.trim()) nextErrors.push('Product name is required')
    if (!form.price) nextErrors.push('Selling price is required')
    if (form.inventoryTracking) {
      if (form.productType === PRODUCT_TYPES.DIRECT_STOCK && !form.directStockConfig?.inventoryItemId) {
        nextErrors.push('Select a linked inventory item for direct stock')
      }
      if (form.productType === PRODUCT_TYPES.RECIPE) {
        nextErrors.push(...validateIngredients(form.ingredients, restaurantInventory))
        if (!form.ingredients.some((ing) => ing.inventoryId && Number(ing.quantity) > 0)) {
          nextErrors.push('Add at least one recipe ingredient')
        }
      }
      if (form.productType === PRODUCT_TYPES.COMBO && !form.comboItems.some((item) => item.productId && Number(item.quantity) > 0)) {
        nextErrors.push('Add at least one product to the combo')
      }
    }
    setErrors(nextErrors)
    return !nextErrors.length
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave()
    setStep(0)
    setErrors([])
  }

  const handleClose = () => {
    setStep(0)
    setErrors([])
    onClose()
  }

  const stockUnit = inventoryForm.unit || 'kg'

  return <>
    <Modal open={open} onClose={handleClose} title={editing ? `Edit ${labels.product.toLowerCase()}` : `${labels.product} builder`} description={`Set up your ${labels.product.toLowerCase()} details, recipe and availability.`} size="lg">
      <div className="product-builder">
        <Tabs items={BUILDER_STEPS} active={BUILDER_STEPS[step]} onChange={(label) => setStep(BUILDER_STEPS.indexOf(label))} />
        {errors.length > 0 && <div className="form-errors" style={{ margin: '12px 0', padding: '10px 12px', background: '#fff0f0', borderRadius: 8, fontSize: 11, color: '#c53d3d' }}>
          {errors.map((err) => <div key={err}>{err}</div>)}
        </div>}

        <form onSubmit={handleSave} className="form-grid" style={{ marginTop: 16 }}>
          {step === 0 && <>
            <Field label="Product image" className="span-2"><div className="image-upload-field"><input type="file" accept="image/*" onChange={handleImage}/>{form.image && <img src={form.image} alt="Preview" className="image-preview"/>}</div></Field>
            <Field label={`${labels.product} name`} required><Input required value={form.name} onChange={(e) => patchForm({ name: e.target.value })}/></Field>
            <Field label="SKU"><Input value={form.sku} onChange={(e) => patchForm({ sku: e.target.value })}/></Field>
            <Field label={labels.category} required><Select value={form.category} onChange={(e) => patchForm({ category: e.target.value, prepMinutes: DEFAULT_CATEGORY_PREP[e.target.value] || 15 })}>{categories.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Description" className="span-2"><textarea rows={3} value={form.description} onChange={(e) => patchForm({ description: e.target.value })} placeholder="Optional product description"/></Field>
            <Field label="Selling price" required><Input type="number" required value={form.price} onChange={(e) => patchForm({ price: e.target.value })}/></Field>
            <Field label="Preparation time (min)"><Input type="number" min="1" value={form.prepMinutes} onChange={(e) => patchForm({ prepMinutes: e.target.value })}/></Field>
          </>}

          {step === 1 && <>
            <div className="span-2 inventory-recipe-intro">
              <p>Choose how stock is tracked for this item. Ingredients are deducted automatically when sold.</p>
            </div>

            <Field label="Track inventory?" className="span-2">
              <label className="switch"><input type="checkbox" checked={form.inventoryTracking} onChange={(e) => {
                const tracking = e.target.checked
                setForm((f) => ({ ...f, inventoryTracking: tracking, productType: tracking ? PRODUCT_TYPES.RECIPE : PRODUCT_TYPES.SERVICE }))
              }}/><i/></label>
            </Field>

            {form.inventoryTracking && <>
              <Field label="Stock method" className="span-2">
                <div className="stock-mode-picker" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {[
                    [PRODUCT_TYPES.DIRECT_STOCK, Package, 'Direct stock', 'Sell a packaged item as-is'],
                    [PRODUCT_TYPES.RECIPE, ChefHat, 'Recipe', 'Made from ingredients each order'],
                    [PRODUCT_TYPES.COMBO, Layers, 'Combo', 'Bundle of menu items'],
                  ].map(([type, Icon, title, desc]) => (
                    <label key={type} className={`stock-mode-option${form.productType === type ? ' selected' : ''}`}>
                      <input type="radio" name="productType" value={type} checked={form.productType === type} onChange={() => setProductType(type)}/>
                      <Icon size={16}/>
                      <span><strong>{title}</strong><small>{desc}</small></span>
                    </label>
                  ))}
                </div>
              </Field>

              {form.productType === PRODUCT_TYPES.DIRECT_STOCK && <div className="span-2 recipe-panel">
                <Field label="Linked ingredient" required>
                  <Select value={form.directStockConfig.inventoryItemId} onChange={(e) => setForm((f) => ({ ...f, directStockConfig: { ...f.directStockConfig, inventoryItemId: e.target.value } }))}>
                    <option value="">Select ingredient…</option>
                    {restaurantInventory.map((i) => <option key={i.id} value={i.id}>{i.name} — {i.stock} {i.unit || i.baseUnit} in stock</option>)}
                  </Select>
                </Field>
                <Field label="Deduct per sale" required hint="How much stock to remove for each order."><Input type="number" min="0.01" step="0.01" value={form.directStockConfig.quantityPerSale} onChange={(e) => setForm((f) => ({ ...f, directStockConfig: { ...f.directStockConfig, quantityPerSale: e.target.value } }))}/></Field>
              </div>}

              {form.productType === PRODUCT_TYPES.RECIPE && <div className="span-2 recipe-panel">
                <SectionHeader title="Ingredients per serving" description="How much of each ingredient goes into one order of this item.">
                  <Button type="button" variant="outline" size="sm" onClick={handleNewInventoryItem}><Plus size={14}/> New ingredient</Button>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredientRow}><Plus size={14}/> Add row</Button>
                </SectionHeader>

                <div className="recipe-ingredient-list">
                  {form.ingredients.map((ing, idx) => {
                    const item = restaurantInventory.find((i) => i.id === ing.inventoryId)
                    const baseUnit = item?.baseUnit || item?.unit || 'pcs'
                    const recipeUnit = ing.unit || (item ? getDefaultRecipeUnit(baseUnit) : '')
                    const compatibleUnits = item ? getCompatibleUnits(baseUnit) : ['g', 'kg', 'ml', 'L', 'pcs']
                    const qtyProps = getQuantityInputProps(recipeUnit)
                    const stockInRecipeUnit = item && recipeUnit ? getInventoryStockInUnit(item, recipeUnit) : null
                    return (
                      <div key={idx} className="recipe-ingredient-card">
                        <div className="recipe-ingredient-card-fields">
                          <Field label={idx === 0 ? 'Ingredient' : ''}>
                            <Select value={ing.inventoryId} onChange={(e) => selectIngredient(idx, e.target.value)}>
                              <option value="">Select ingredient…</option>
                              {restaurantInventory.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </Select>
                          </Field>
                          <Field label={idx === 0 ? 'Amount' : ''}>
                            <Input
                              type="number"
                              min={qtyProps.min}
                              step={qtyProps.step}
                              placeholder={qtyProps.placeholder}
                              value={ing.quantity}
                              onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                            />
                          </Field>
                          <Field label={idx === 0 ? 'Unit' : ''}>
                            <Select
                              value={ing.unit || recipeUnit}
                              disabled={!item}
                              onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                            >
                              {!item && <option value="">—</option>}
                              {compatibleUnits.map((u) => {
                                const info = getUnitInfo(u)
                                return <option key={u} value={u}>{info.label}</option>
                              })}
                            </Select>
                          </Field>
                          {form.ingredients.length > 1 && (
                            <div className="recipe-ingredient-card-remove">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredientRow(idx)} aria-label="Remove ingredient"><Minus size={14}/></Button>
                            </div>
                          )}
                        </div>
                        {item && (
                          <p className="recipe-ingredient-hint">
                            {getRecipeQuantityHint(recipeUnit, item.name)}
                            {stockInRecipeUnit != null && ` · ${Number(stockInRecipeUnit).toFixed(stockInRecipeUnit % 1 ? 2 : 0)} ${recipeUnit} available`}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {maxServings > 0 && (
                  <p className="recipe-availability-note">Can make approximately <strong>{maxServings}</strong> servings with current stock.</p>
                )}
              </div>}

              {form.productType === PRODUCT_TYPES.COMBO && <div className="span-2 recipe-panel">
                <SectionHeader title="Included items" description="Each product uses its own stock or recipe."/>
                {form.comboItems.map((comboItem, idx) => (
                  <div key={idx} className="recipe-ingredient-card">
                    <div className="recipe-ingredient-card-fields combo-fields">
                      <Field label={idx === 0 ? 'Menu item' : ''}>
                        <Select value={comboItem.productId} onChange={(e) => setForm((f) => ({ ...f, comboItems: f.comboItems.map((item, i) => i === idx ? { ...item, productId: e.target.value } : item) }))}>
                          <option value="">Select item…</option>
                          {comboProductOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                      </Field>
                      <Field label={idx === 0 ? 'Qty' : ''}><Input type="number" min="1" value={comboItem.quantity} onChange={(e) => setForm((f) => ({ ...f, comboItems: f.comboItems.map((item, i) => i === idx ? { ...item, quantity: e.target.value } : item) }))}/></Field>
                      {form.comboItems.length > 1 && (
                        <div className="recipe-ingredient-card-remove">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, comboItems: f.comboItems.filter((_, i) => i !== idx) }))}><Minus size={14}/></Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, comboItems: [...f.comboItems, { productId: '', quantity: 1 }] }))}><Plus size={14}/> Add item</Button>
              </div>}
            </>}
          </>}

          {step === 2 && <>
            <Field label="Available on menu"><label className="switch"><input type="checkbox" checked={!form.manuallyDisabled} onChange={(e) => patchForm({ manuallyDisabled: !e.target.checked, available: e.target.checked })}/><i/></label></Field>
            <Field label="Allow selling when stock is insufficient"><label className="switch"><input type="checkbox" checked={form.allowNegativeStock} onChange={(e) => patchForm({ allowNegativeStock: e.target.checked })}/><i/></label></Field>
            <Field label="Available add-ons" className="span-2">
              {categoryAddons.length ? <div className="addon-picker">
                {categoryAddons.map((addon) => {
                  const checked = form.addonIds.includes(addon.id)
                  return <label key={addon.id} className={`addon-picker-item${checked ? ' selected' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => patchForm({ addonIds: checked ? form.addonIds.filter((id) => id !== addon.id) : [...form.addonIds, addon.id] })}/>
                    <span><strong>{addon.name}</strong></span>
                  </label>
                })}
              </div> : <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>No add-ons for {form.category} yet.</p>}
            </Field>
          </>}

          <div className="form-actions span-2">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            {step > 0 && <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
            {step < BUILDER_STEPS.length - 1
              ? <Button type="button" onClick={() => setStep((s) => s + 1)}>Continue</Button>
              : <Button type="submit">{editing ? `Save ${labels.product.toLowerCase()}` : `Create ${labels.product.toLowerCase()}`}</Button>}
          </div>
        </form>
      </div>
    </Modal>

    <Modal open={inventoryOpen} onClose={() => { setInventoryOpen(false); setPendingInventoryRow(null) }} title={`Add ${labels.inventoryItem.toLowerCase()}`} description="Set stock in the unit you count it. Enter purchase price per pack if you buy in packs." size="md">
      <form onSubmit={saveQuickInventory} className="form-grid">
        <Field label="Name" required hint="e.g. Ketchup, Chicken Breast, Flour"><Input required value={inventoryForm.name} onChange={(e) => patchInventoryForm({ name: e.target.value })}/></Field>
        <Field label="SKU" required><Input required value={inventoryForm.sku} onChange={(e) => patchInventoryForm({ sku: e.target.value })}/></Field>
        <Field label={labels.inventoryCategory}>
          <Select value={inventoryForm.category} onChange={(e) => patchInventoryForm({ category: e.target.value })}>
            {inventoryCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>

        <div className="span-2 inventory-form-section">
          <p className="inventory-form-section-title">Stock on hand</p>
          <p className="inventory-form-section-desc">Track inventory in the unit you actually use — kg for bulk, L for liquids, pcs for bottles.</p>
        </div>
        <Field label="Stock unit" required>
          <Select value={inventoryForm.unit} onChange={(e) => patchInventoryForm({ unit: e.target.value })}>
            {['kg', 'g', 'L', 'ml', 'pcs'].map((u) => {
              const info = getUnitInfo(u)
              return <option key={u} value={u}>{info.label}</option>
            })}
          </Select>
        </Field>
        <Field label={`Current stock (${stockUnit})`} hint="Total amount you have right now."><Input type="number" min="0" step="0.01" placeholder="e.g. 30" value={inventoryForm.stock} onChange={(e) => patchInventoryForm({ stock: e.target.value })}/></Field>
        <Field label={`Minimum stock (${stockUnit})`} hint="Alert when stock falls below this."><Input type="number" min="0" step="0.01" value={inventoryForm.minimum} onChange={(e) => patchInventoryForm({ minimum: e.target.value })}/></Field>

        <InventoryPurchaseFields form={inventoryForm} onPatch={patchInventoryForm} stockUnit={stockUnit}/>

        <div className="form-actions span-2"><Button type="button" variant="ghost" onClick={() => setInventoryOpen(false)}>Cancel</Button><Button type="submit">Save & use in recipe</Button></div>
      </form>
    </Modal>
  </>
}
