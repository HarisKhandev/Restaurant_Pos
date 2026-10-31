import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge, Button, Modal, money } from './ui'

export default function ModifierModal({ product, onClose, onAdd, addLabel = 'Add to order' }) {
  const [selected, setSelected] = useState({})
  if (!product) return null

  const toggle = (group, option) => {
    setSelected((current) => {
      if (group.multiple) {
        const values = current[group.name] || []
        return {
          ...current,
          [group.name]: values.some((item) => item.name === option.name)
            ? values.filter((item) => item.name !== option.name)
            : [...values, option],
        }
      }
      return { ...current, [group.name]: [option] }
    })
  }

  const additions = Object.values(selected).flat()
  const total = product.price + additions.reduce((sum, item) => sum + item.price, 0)

  return (
    <Modal open onClose={onClose} title={`Customize ${product.name}`} description="Choose options before adding this item." size="md">
      <div className="modifier-layout">
        <div className="modifier-product">
          <img src={product.image} alt=""/>
          <div><strong>{product.name}</strong><span>{money(product.price)}</span></div>
        </div>
        {product.modifiers.map((group) => (
          <section className="modifier-group" key={group.name}>
            <header>
              <div>
                <h3>{group.name}</h3>
                <small>{group.required ? 'Required · choose one' : group.multiple ? 'Optional · choose multiple' : 'Optional'}</small>
              </div>
              {group.required && <Badge tone="warning">Required</Badge>}
            </header>
            {group.options.map((option) => {
              const checked = (selected[group.name] || []).some((item) => item.name === option.name)
              return (
                <button className={checked ? 'selected' : ''} key={option.name} type="button" onClick={() => toggle(group, option)}>
                  <span className={group.multiple ? 'check-box' : 'radio-box'}>{checked && <Check size={15}/>}</span>
                  <strong>{option.name}</strong>
                  <small>{option.price ? `+ ${money(option.price)}` : 'Included'}</small>
                </button>
              )
            })}
          </section>
        ))}
      </div>
      <div className="modal-sticky-actions">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          disabled={product.modifiers.some((group) => group.required && !(selected[group.name]?.length))}
          onClick={() => onAdd(product, additions)}
        >
          {addLabel} · {money(total)}
        </Button>
      </div>
    </Modal>
  )
}
