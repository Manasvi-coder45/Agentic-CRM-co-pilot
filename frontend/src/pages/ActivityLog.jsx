import { useEffect, useState } from 'react'
import { getActivity } from '../api/client'

const ACTION_META = {
  email_drafted:   { icon: '✉', color: '#7C3AED', bg: '#F5F3FF', label: 'Email Drafted' },
  deal_updated:    { icon: '↑', color: '#059669', bg: '#ECFDF5', label: 'Deal Updated' },
  deal_fetched:    { icon: '◎', color: '#3B82F6', bg: '#EFF6FF', label: 'Deal Fetched' },
  contact_fetched: { icon: '◉', color: '#6B7280', bg: '#F3F4F6', label: 'Contact Fetched' },
  risk_scan:       { icon: '⚠', color: '#D97706', bg: '#FFFBEB', label: 'Risk Scan' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0)  return `${days}d ago`
  if (hrs > 0)   return `${hrs}h ago`
  if (mins > 0)  return `${mins}m ago`
  return 'just now'
}

export default function ActivityLog() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')

  const load = () => {
    setLoading(true)
    getActivity().then(r => setActivities(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.action_type === filter)

  const actionTypes = ['all', ...new Set(activities.map(a => a.action_type))]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>Activity Log</h1>
          <p style={{ fontSize: 13.5, color: 'var(--gray-500)', marginTop: 4 }}>
            Every action taken by the AI agent
          </p>
        </div>
        <button onClick={load} style={{
          background: 'var(--white)', border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius)', padding: '8px 16px', fontSize: 13,
          color: 'var(--gray-600)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
        }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {actionTypes.map(type => (
          <button key={type} onClick={() => setFilter(type)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 500,
            border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
            background: filter === type ? 'var(--primary)' : 'var(--white)',
            color: filter === type ? 'white' : 'var(--gray-500)',
            borderColor: filter === type ? 'var(--primary)' : 'var(--gray-200)',
          }}>
            {type === 'all' ? 'All' : ACTION_META[type]?.label || type}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--gray-400)', padding: '2rem' }}>Loading activity...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◷</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 6 }}>No activity yet</div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Run an agent command to see the activity log populate in real time.</div>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          {filtered.map((activity, i) => {
            const meta = ACTION_META[activity.action_type] || ACTION_META.deal_fetched
            return (
              <div key={activity.id} style={{
                display: 'flex', gap: 14, padding: '14px 20px', alignItems: 'flex-start',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--gray-100)' : 'none',
                transition: 'background 0.1s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {/* Icon */}
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius)', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: meta.color, flexShrink: 0 }}>
                  {meta.icon}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 500, background: meta.bg, color: meta.color, padding: '2px 8px', borderRadius: 20, marginBottom: 5, display: 'inline-block' }}>
                        {meta.label}
                      </span>
                      <div style={{ fontSize: 13.5, color: 'var(--gray-800)', marginTop: 3, lineHeight: 1.4 }}>
                        {activity.summary}
                      </div>
                      {activity.entity_name && (
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>
                          {activity.entity_type === 'deal' ? '◎' : '◉'} {activity.entity_name}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-300)', flexShrink: 0, marginTop: 2 }}>
                      {timeAgo(activity.created_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-300)', marginTop: 4, fontFamily: 'monospace' }}>
                    {activity.tool_name}()
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}