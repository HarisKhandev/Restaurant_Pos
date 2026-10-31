import { Children, forwardRef, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, LoaderCircle, Search, ChevronDown, MoreHorizontal, Check } from 'lucide-react'
import { getOrderStatusTone, getOrderTypeTone } from '../utils/orderWorkflow'

function optionLabel(children) {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  return Children.toArray(children).map((child) => (typeof child === 'string' || typeof child === 'number' ? child : '')).join('').trim()
}

function parseSelectOptions(children) {
  const options = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return
    const value = child.props.value ?? optionLabel(child.props.children)
    options.push({
      value: String(value),
      label: optionLabel(child.props.children) || String(value),
      disabled: Boolean(child.props.disabled),
    })
  })
  return options
}

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    })
  }
}

function useDropdownPosition(open, anchorRef) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240, placement: 'bottom' })

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const placement = spaceBelow >= 160 || spaceBelow >= spaceAbove ? 'bottom' : 'top'
    const maxHeight = Math.min(280, placement === 'bottom' ? spaceBelow : spaceAbove)
    setPosition({
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(maxHeight, 120),
      placement,
    })
  }, [anchorRef])

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    const closeOnScroll = () => updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [open, updatePosition])

  return position
}

export function DropdownMenu({ open, anchorRef, children, className = '', align = 'start', minWidth = 180, onClose }) {
  const position = useDropdownPosition(open, anchorRef)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handlePointer = (event) => {
      if (anchorRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      onClose?.()
    }
    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [open, anchorRef, onClose])

  if (!open) return null

  const style = {
    top: position.placement === 'bottom' ? position.top : undefined,
    bottom: position.placement === 'top' ? window.innerHeight - position.top : undefined,
    left: align === 'end' ? position.left + position.width - minWidth : position.left,
    minWidth: Math.max(minWidth, position.width),
    maxHeight: position.maxHeight,
  }

  return createPortal(
    <div ref={menuRef} className={`app-dropdown-menu ${className}`} role="presentation" style={style}>
      {children}
    </div>,
    document.body,
  )
}

export const money = (value, short) => { const n = Number(value || 0); if (short && n >= 1e6) return `PKR ${(n / 1e6).toFixed(1)}M`; if (short && n >= 1e3) return `PKR ${(n / 1e3).toFixed(0)}K`; return `PKR ${n.toLocaleString('en-PK')}` }

export function Button({ children, variant = 'primary', size = 'md', className = '', loading, ...props }) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>{loading && <LoaderCircle size={16} className="spin" />}{children}</button>
}

export function Badge({ children, tone }) {
  const normalized = tone || String(children).toLowerCase().replaceAll(' ', '-')
  return <span className={`badge badge-${normalized}`}>{children}</span>
}

export function OrderTypeBadge({ type }) {
  return <Badge tone={getOrderTypeTone(type)}>{type}</Badge>
}

export function OrderStatusBadge({ status }) {
  return <Badge tone={getOrderStatusTone(status)}>{status}</Badge>
}

export function Card({ children, className = '', onClick }) {
  return <section className={`card ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>{children}</section>
}

export function StatCard({ label, value, change, icon: Icon, tone = 'brand' }) {
  return <Card className="stat-card">
    <div className={`stat-icon tone-${tone}`}>{Icon && <Icon size={19} />}</div>
    <div><p>{label}</p><strong>{value}</strong>{change && <small className={String(change).startsWith('-') ? 'negative' : 'positive'}>{change}</small>}</div>
  </Card>
}

export function PageHeader({ eyebrow, title, description, children }) {
  return <header className="page-header">
    <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
    {children && <div className="page-actions">{children}</div>}
  </header>
}

export function SectionHeader({ title, description, children }) {
  return <div className="section-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</div>
}

export function Field({ label, error, required, children, hint }) {
  return <label className="field"><span>{label}{required && <b>*</b>}</span>{children}{hint && <small>{hint}</small>}{error && <em>{error}</em>}</label>
}

export function Input({ icon: Icon, className = '', ...props }) {
  return <div className={`input-wrap ${className}`}>{Icon && <Icon size={16} />}<input {...props} /></div>
}

export const Select = forwardRef(function Select({
  children,
  className = '',
  disabled = false,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  id,
  placeholder = 'Select…',
  size = 'md',
  variant = 'default',
  menuClassName = '',
  style,
  required,
  ...props
}, ref) {
  const options = useMemo(() => parseSelectOptions(children), [children])
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const rootRef = useRef(null)
  const hiddenRef = useRef(null)
  const listId = useId()
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const currentValue = isControlled ? String(value ?? '') : String(internalValue ?? '')
  const selectedOption = options.find((option) => option.value === currentValue)
  const enabledOptions = options.filter((option) => !option.disabled)

  const setValue = (nextValue) => {
    if (!isControlled) setInternalValue(nextValue)
    onChange?.({ target: { value: nextValue, name } })
  }

  const closeMenu = useCallback((shouldBlur = true) => {
    setOpen(false)
    setHighlightIndex(-1)
    if (shouldBlur) onBlur?.({ target: { value: currentValue, name } })
  }, [currentValue, name, onBlur])

  const openMenu = () => {
    if (disabled) return
    const selectedIndex = enabledOptions.findIndex((option) => option.value === currentValue)
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const selectOption = useCallback((option) => {
    if (!option || option.disabled) return
    setValue(option.value)
    closeMenu(true)
  }, [closeMenu])

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu(true)
        return
      }
      if (!enabledOptions.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightIndex((index) => (index + 1) % enabledOptions.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightIndex((index) => (index <= 0 ? enabledOptions.length - 1 : index - 1))
      } else if (event.key === 'Enter' && highlightIndex >= 0) {
        event.preventDefault()
        selectOption(enabledOptions[highlightIndex])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, enabledOptions, highlightIndex, closeMenu, selectOption])

  const wrapClass = [
    'select-wrap',
    'custom-select',
    open ? 'open' : '',
    disabled ? 'disabled' : '',
    size === 'sm' ? 'select-sm' : '',
    variant === 'ghost' ? 'select-ghost' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapClass} ref={rootRef} style={style} {...props}>
      <button
        type="button"
        id={id}
        className="custom-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? closeMenu(false) : openMenu())}
      >
        <span className={selectedOption ? 'custom-select-value' : 'custom-select-placeholder'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={size === 'sm' ? 14 : 15} className="custom-select-chevron" />
      </button>
      <input
        type="hidden"
        ref={mergeRefs(ref, hiddenRef)}
        name={name}
        value={currentValue}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
      />
      <DropdownMenu open={open} anchorRef={rootRef} className={menuClassName} onClose={() => closeMenu(true)}>
        <ul id={listId} className="custom-select-menu" role="listbox" aria-label={name || 'Options'}>
          {options.map((option) => {
            const enabledIndex = enabledOptions.indexOf(option)
            const isSelected = option.value === currentValue
            const isHighlighted = enabledIndex === highlightIndex
            return (
              <li key={`${option.value}-${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className={[
                    'custom-select-option',
                    isSelected ? 'selected' : '',
                    isHighlighted ? 'highlighted' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => enabledIndex >= 0 && setHighlightIndex(enabledIndex)}
                  onClick={() => selectOption(option)}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} className="custom-select-check" />}
                </button>
              </li>
            )
          })}
        </ul>
      </DropdownMenu>
    </div>
  )
})

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return <Input icon={Search} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
}

export function Modal({ open, onClose, title, description, children, size = 'md' }) {
  if (!open) return null
  return <div className="overlay" role="presentation" onMouseDown={onClose}>
    <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19} /></button></header>
      <div className="modal-body">{children}</div>
    </div>
  </div>
}

export function Drawer({ open, onClose, title, children }) {
  if (!open) return null
  return <div className="overlay" role="presentation" onMouseDown={onClose}>
    <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19} /></button></header>
      <div className="drawer-body">{children}</div>
    </aside>
  </div>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="empty-state">{Icon && <Icon size={30} />}<h3>{title}</h3><p>{description}</p>{action}</div>
}

export function Toast({ toast }) {
  if (!toast) return null
  return <div className={`toast toast-${toast.type}`} role="status"><span>{toast.type === 'success' ? '✓' : '!'}</span>{toast.message}</div>
}

export function Tabs({ items, active, onChange }) {
  return <div className="tabs">{items.map((item) => <button key={item} className={active === item ? 'active' : ''} onClick={() => onChange(item)}>{item}</button>)}</div>
}

export function DataTable({ columns, rows, onRowClick, rowClassName, empty = 'No records found' }) {
  return <div className="table-shell"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((row) => <tr key={row.id} onClick={() => onRowClick?.(row)} className={[onRowClick ? 'clickable' : '', rowClassName?.(row)].filter(Boolean).join(' ')}>{columns.map((column) => <td key={column.key} className={column.stopRowClick ? 'table-action-cell' : ''} onClick={column.stopRowClick ? (event) => event.stopPropagation() : undefined}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>) : <tr><td colSpan={columns.length} className="table-empty">{empty}</td></tr>}</tbody>
  </table></div>
}

export function RowActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const toggle = (event) => {
    event.stopPropagation()
    setOpen((value) => !value)
  }

  return <div className="row-menu" ref={rootRef} onClick={(event) => event.stopPropagation()}>
    <button type="button" className="row-menu-btn" aria-label="Row actions" aria-expanded={open} onClick={toggle}><MoreHorizontal size={18} /></button>
    <DropdownMenu open={open} anchorRef={rootRef} align="end" minWidth={180} onClose={() => setOpen(false)}>
      <div className="row-menu-dropdown" role="menu">
        {items.map((item) => <button key={item.label} type="button" role="menuitem" className={item.danger ? 'danger' : ''} onClick={(event) => { event.stopPropagation(); setOpen(false); item.onClick() }}>
          {item.icon && <item.icon size={14} />}{item.label}
        </button>)}
      </div>
    </DropdownMenu>
  </div>
}
