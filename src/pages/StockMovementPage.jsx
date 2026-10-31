import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Filter, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MOVEMENT_TYPES } from '../utils/inventoryEngine'
import { formatQuantity } from '../utils/inventoryUnits'
import { Badge, Button, Card, DataTable, Field, Input, PageHeader, SearchBox, Select, StatCard } from '../components/ui'

const TYPE_LABELS = {
  OPENING_STOCK: 'Opening stock',
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  ORDER_CANCEL_RESTORE: 'Cancel restore',
  WASTE: 'Waste',
  ADJUSTMENT: 'Adjustment',
  TRANSFER: 'Transfer',
  RETURN: 'Return',
}

export function StockMovementPage() {
  const { data, activeRestaurant } = useApp()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [itemFilter, setItemFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const inventory = (data.inventory || []).filter((item) => item.restaurantId === activeRestaurant.id)
  const inventoryMap = useMemo(() => new Map(inventory.map((item) => [item.id, item])), [inventory])

  const movements = (data.inventoryMovements || [])
    .filter((m) => m.restaurantId === activeRestaurant.id)
    .filter((m) => typeFilter === 'All' || m.type === typeFilter)
    .filter((m) => itemFilter === 'All' || m.inventoryItemId === itemFilter)
    .filter((m) => {
      const day = String(m.createdAt || '').slice(0, 10)
      if (dateFrom && day < dateFrom) return false
      if (dateTo && day > dateTo) return false
      return true
    })
    .filter((m) => {
      if (!query.trim()) return true
      const item = inventoryMap.get(m.inventoryItemId)
      const q = query.toLowerCase()
      return item?.name?.toLowerCase().includes(q) || m.referenceId?.toLowerCase().includes(q) || m.notes?.toLowerCase().includes(q)
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayMovements = movements.filter((m) => String(m.createdAt).startsWith(todayKey))
  const salesToday = todayMovements.filter((m) => m.type === MOVEMENT_TYPES.SALE).length

  const columns = [
    { key: 'createdAt', label: 'Date', render: (r) => <small>{new Date(r.createdAt).toLocaleString()}</small> },
    { key: 'item', label: 'Item', render: (r) => <strong>{inventoryMap.get(r.inventoryItemId)?.name || 'Unknown'}</strong> },
    { key: 'type', label: 'Type', render: (r) => <Badge tone={r.type === 'SALE' ? 'warning' : r.type === 'PURCHASE' ? 'active' : 'info'}>{TYPE_LABELS[r.type] || r.type}</Badge> },
    { key: 'change', label: 'Change', render: (r) => {
      const item = inventoryMap.get(r.inventoryItemId)
      const unit = item?.baseUnit || item?.unit || ''
      if (r.quantityIn > 0) return <span style={{ color: 'var(--brand)' }}><ArrowDownLeft size={12}/> +{formatQuantity(r.quantityIn, unit)}</span>
      return <span style={{ color: '#c53d3d' }}><ArrowUpRight size={12}/> -{formatQuantity(r.quantityOut, unit)}</span>
    }},
    { key: 'balanceAfter', label: 'Balance', render: (r) => {
      const item = inventoryMap.get(r.inventoryItemId)
      return formatQuantity(r.balanceAfter, item?.baseUnit || item?.unit || '')
    }},
    { key: 'reference', label: 'Reference', render: (r) => <small>{r.referenceType ? `${r.referenceType} ${r.referenceId || ''}` : '—'}</small> },
    { key: 'notes', label: 'Notes', render: (r) => <small>{r.notes || '—'}</small> },
  ]

  return <div>
    <PageHeader eyebrow="INVENTORY & SUPPLY" title="Stock movement" description={`${movements.length} ledger entries for ${activeRestaurant.name}`}/>
    <div className="stat-grid three">
      <StatCard label="Movements today" value={todayMovements.length} icon={Filter}/>
      <StatCard label="Sales deductions today" value={salesToday} icon={Package} tone="amber"/>
      <StatCard label="Items tracked" value={inventory.length} icon={Package} tone="blue"/>
    </div>
    <Card>
      <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search movements…"/>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </Select>
        <Select value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}>
          <option value="All">All items</option>
          {inventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
        <Field label="From"><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}/></Field>
        <Field label="To"><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}/></Field>
        {(typeFilter !== 'All' || itemFilter !== 'All' || dateFrom || dateTo || query) && (
          <Button variant="ghost" onClick={() => { setTypeFilter('All'); setItemFilter('All'); setDateFrom(''); setDateTo(''); setQuery('') }}>Clear filters</Button>
        )}
      </div>
      <DataTable rows={movements} columns={columns} empty="No stock movements yet — movements are created when orders, purchases, waste or adjustments occur."/>
    </Card>
  </div>
}
