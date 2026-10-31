import { BUSINESS_TYPE_FEATURES, BTYPE_COLORS, BTYPE_LABELS, FEATURE_MODULES } from '../data/seed'
import { Tabs } from './ui'

const TYPE_TABS = ['All', 'Restaurant', 'Bakery', 'Pharmacy', 'Mart', 'Retail']

export function modulesForType(typeFilter = 'All') {
  const typeKey = typeFilter === 'All' ? null : typeFilter.toLowerCase()
  return FEATURE_MODULES.map((module) => ({
    ...module,
    features: typeKey ? module.features.filter(([key]) => (BUSINESS_TYPE_FEATURES[typeKey] || []).includes(key)) : module.features,
  })).filter((module) => module.features.length)
}

export function FeatureToggleMatrix({ businesses, onToggle, typeFilter = 'All', onTypeFilter }) {
  const modules = modulesForType(typeFilter)
  const features = modules.flatMap((module) => module.features)
  const filteredBiz = typeFilter === 'All' ? businesses : businesses.filter((row) => (row.type || 'restaurant') === typeFilter.toLowerCase())

  return (
    <div className="fm-matrix-wrap">
      {onTypeFilter && <div className="fm-matrix-tabs"><Tabs items={TYPE_TABS} active={typeFilter} onChange={onTypeFilter} /></div>}
      <div className="fm-matrix">
        <div className="fm-matrix-modules">
          <div className="fm-matrix-corner">Module</div>
          {modules.map((module) => (
            <div key={module.key} className="fm-matrix-mod" style={{ flex: module.features.length }}>{module.label}</div>
          ))}
        </div>
        <div className="fm-matrix-head">
          <div className="fm-matrix-corner">Business</div>
          {features.map(([key, label]) => <div key={key} className="fm-matrix-fh"><span>{label}</span></div>)}
        </div>
        {filteredBiz.length ? filteredBiz.map((row) => {
          const color = BTYPE_COLORS[row.type] || '#0f766e'
          const enabledCount = features.filter(([key]) => row.features?.[key]).length
          return (
            <div key={row.id} className="fm-matrix-row">
              <div className="fm-matrix-biz">
                <span className="fm-matrix-mark" style={{ background: row.branding?.primary || color }}>{row.branding?.mark || row.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{row.name}</strong>
                  <small style={{ color }}>{BTYPE_LABELS[row.type] || 'Restaurant'} · {enabledCount}/{features.length}</small>
                </div>
              </div>
              {features.map(([key]) => {
                const available = (BUSINESS_TYPE_FEATURES[row.type || 'restaurant'] || []).includes(key)
                if (!available) return <div key={key} className="fm-matrix-cell fm-cell-na"><span className="fm-cell-dash">—</span></div>
                return (
                  <div key={key} className="fm-matrix-cell">
                    <label className="fm-toggle fm-toggle-sm">
                      <input type="checkbox" checked={!!row.features?.[key]} onChange={() => onToggle(row.id, key)} />
                      <span />
                    </label>
                  </div>
                )
              })}
            </div>
          )
        }) : <div className="btype-empty" style={{ padding: 32 }}><p>No businesses of this type.</p></div>}
      </div>
    </div>
  )
}
