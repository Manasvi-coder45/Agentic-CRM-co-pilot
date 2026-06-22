import { useEffect, useState, useCallback } from 'react'
import { getDeals, getAtRisk, getDealScores } from '../api/client'

const STAGES = ['prospecting','qualification','proposal','negotiation','closed_won','closed_lost']
const STAGE_META = {
  prospecting:   { color: '#9CA3AF', label: 'Prospecting' },
  qualification: { color: '#3B82F6', label: 'Qualification' },
  proposal:      { color: '#7C3AED', label: 'Proposal' },
  negotiation:   { color: '#D97706', label: 'Negotiation' },
  closed_won:    { color: '#059669', label: 'Closed Won' },
  closed_lost:   { color: '#DC2626', label: 'Closed Lost' },
}
const HEALTH_COLOR = {
  green: '#10B981', amber: '#F59E0B', red: '#EF4444'
}

export default function Deals() {
  const [deals, setDeals]     = useState([])
  const [atRisk, setAtRisk]   = useState(new Set())
  const [scores, setScores]   = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    Promise.all([getDeals(), getAtRisk(), getDealScores()])
      .then(([d, a, s]) => {
        setDeals(d.data)
        setAtRisk(new Set(a.data.map(x => x.id)))
        const sm = {}
        s.data.forEach(x => { sm[x.deal_id] = x })
        setScores(sm)
      }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) return <div style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading pipeline...</div>

  const totalPipeline = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>Deal Pipeline</h1>
        <p style={{ fontSize: 13.5, color: 'var(--gray-500)', marginTop: 4 }}>
          {deals.length} deals · ${(totalPipeline/1000).toFixed(0)}k active pipeline
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
        {STAGES.map(stage => {
          const meta = STAGE_META[stage]
          const stageDeals = deals.filter(d => d.stage === stage)
          const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0)

          return (
            <div key={stage} style={{ minWidth: 220, flexShrink: 0 }}>
              {/* Column header */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 10, boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${meta.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-500)', padding: '1px 7px', borderRadius: 20, fontWeight: 500 }}>
                    {stageDeals.length}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                  ${stageValue.toLocaleString()}
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stageDeals.length === 0 ? (
                  <div style={{ background: 'var(--white)', border: '1px dashed var(--gray-200)', borderRadius: 'var(--radius)', padding: '16px', fontSize: 12, color: 'var(--gray-300)', textAlign: 'center' }}>
                    No deals
                  </div>
                ) : stageDeals.map(deal => {
                  const health = scores[deal.id]
                  const isRisk = atRisk.has(deal.id)
                  return (
                    <div key={deal.id} style={{
                      background: 'var(--white)', borderRadius: 'var(--radius)',
                      border: `1px solid ${isRisk ? '#FED7D7' : 'var(--gray-200)'}`,
                      padding: '12px', boxShadow: 'var(--shadow-sm)',
                      borderLeft: `3px solid ${isRisk ? '#EF4444' : meta.color}`
                    }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--gray-800)', marginBottom: 6, lineHeight: 1.3 }}>
                        {deal.title}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 6 }}>
                        ${deal.value?.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: health ? 8 : 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{deal.probability}% close</span>
                        {isRisk && <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 500 }}>⚠ At Risk</span>}
                      </div>
                      {health && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>Health</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: HEALTH_COLOR[health.color] }}>{health.score}/100</span>
                          </div>
                          <div style={{ height: 3, background: 'var(--gray-100)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${health.score}%`, background: HEALTH_COLOR[health.color], borderRadius: 2 }} />
                          </div>
                        </div>
                      )}
                      {deal.notes && (
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 7, paddingTop: 7, borderTop: '1px solid var(--gray-100)', lineHeight: 1.4 }}>
                          {deal.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}