import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { getOrderStatusTone } from '../utils/orderWorkflow'

export function KanbanColumnHeader({ title, count, tone }) {
  const statusTone = tone || getOrderStatusTone(title)
  return (
    <header className={`kanban-column-header kanban-header-tone-${statusTone}`}>
      <span className="kanban-column-title">{title}</span>
      <span className="kanban-column-count" aria-label={`${count} items`}>{count}</span>
    </header>
  )
}

export function KanbanBoard({
  columns,
  className = '',
  style,
  emptyLabel = 'No items',
  onMoveItem,
  renderCard,
  renderHeader,
  getItemId = (item) => item.id,
  disabled = false,
}) {
  const [draggingId, setDraggingId] = useState(null)
  const [dropColumn, setDropColumn] = useState(null)

  const handleDragStart = (event, item, fromColumn) => {
    if (disabled) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({ id: getItemId(item), fromColumn }))
    setDraggingId(getItemId(item))
  }

  const handleDragOver = (event, columnId) => {
    if (disabled) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropColumn(columnId)
  }

  const handleDrop = (event, toColumn) => {
    if (disabled) return
    event.preventDefault()
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/json'))
      if (payload.fromColumn !== toColumn) onMoveItem?.(payload.id, payload.fromColumn, toColumn)
    } catch {
      // ignore malformed drag payload
    }
    setDraggingId(null)
    setDropColumn(null)
  }

  const clearDrag = () => {
    setDraggingId(null)
    setDropColumn(null)
  }

  return (
    <div className={`kanban ${className}`.trim()} style={style}>
      {columns.map((column) => (
        <section
          key={column.id}
          className={`kanban-column kanban-tone-${column.tone || getOrderStatusTone(column.title)} ${dropColumn === column.id ? 'kanban-column-drop-target' : ''}`}
          onDragOver={(event) => handleDragOver(event, column.id)}
          onDragLeave={() => setDropColumn((current) => (current === column.id ? null : current))}
          onDrop={(event) => handleDrop(event, column.id)}
        >
          {renderHeader ? renderHeader(column) : (
            <KanbanColumnHeader title={column.title} count={column.items.length} tone={column.tone} />
          )}
          <div className="kanban-column-body">
            {column.items.length ? column.items.map((item) => {
              const itemId = getItemId(item)
              const isDragging = draggingId === itemId
              return (
                <div
                  key={itemId}
                  className={`kanban-card-wrap ${isDragging ? 'kanban-card-dragging' : ''}`}
                  draggable={!disabled}
                  onDragStart={(event) => handleDragStart(event, item, column.id)}
                  onDragEnd={clearDrag}
                >
                  {!disabled && (
                    <span className="kanban-drag-handle" aria-hidden="true" title="Drag to move">
                      <GripVertical size={15} />
                    </span>
                  )}
                  <div className="kanban-card-content">
                    {renderCard(item, column)}
                  </div>
                </div>
              )
            }) : (
              <p className="order-queue-empty">{emptyLabel}</p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
