import React from 'react'

export interface TabItem {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
  variant?: 'pills' | 'underline'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'pills',
  className = ''
}) => {
  return (
    <div
      role="tablist"
      className={`ui-tabs ui-tabs-${variant} ${className}`}
      aria-orientation="horizontal"
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            className={`ui-tab-btn ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="ui-tab-icon" aria-hidden="true">{tab.icon}</span>}
            <span className="ui-tab-label">{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`ui-tab-count ${isActive ? 'is-active' : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
