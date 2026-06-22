import { useEffect, useState } from 'react'
import { getDeals, getAtRisk, getContacts, getDealScores } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { PipelineBarChart, HealthDonutChart } from '../components/PipelineCharts'

const STAGE_COLORS = {
  prospecting: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  qualification: { bg: '#EFF6FF', text: '#3B82F6', dot: '#3B82F6' },
  proposal: { bg: '#F5F3FF', text: '#7C3AED', dot: '#7C3AED' },
  negotiation: { bg: '#FFFBEB', text: '#D97706', dot: '#D97706' },
  closed_won: { bg: '#ECFDF5', text: '#059669', dot: '#059669' },
  closed_lost: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
}

const HEALTH_COLOR = {
  green: { bar: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  amber: { bar: '#F59E0B', bg: '#FFFBEB', text: '#78350F' },
  red: { bar: '#EF4444', bg: '#FEF2F2', text: '#7F1D1D' },
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 16, alignItems: 'flex-start'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius)',
        background: color + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  )
}

function HealthBar({ score, color }) {
  const c = HEALTH_COLOR[color] || HEALTH_COLOR.red
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Health Score</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.text, background: c.bg, padding: '1px 8px', borderRadius: 20 }}>
          {score}/100
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: c.bar, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function DealCard({ deal, isAtRisk, healthData }) {
  const stage = STAGE_COLORS[deal.stage] || STAGE_COLORS.prospecting
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)', padding: '16px',
      boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s',
      borderTop: `3px solid ${stage.dot}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--gray-800)', flex: 1, marginRight: 8, lineHeight: 1.3 }}>
          {deal.title}
        </div>
        {isAtRisk && (
          <span style={{ fontSize: 10, fontWeight: 500, background: '#FEF2F2', color: '#DC2626', padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>
            At Risk
          </span>
        )}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 10 }}>
        ${deal.value?.toLocaleString()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 500, background: stage.bg, color: stage.text, padding: '3px 9px', borderRadius: 20 }}>
          {deal.stage.replace('_', ' ')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{deal.probability}% likely</span>
      </div>
      {healthData && <HealthBar score={healthData.score} color={healthData.color} />}
    </div>
  )
}

export default function Dashboard() {
  const [deals, setDeals] = useState([])
  const [atRisk, setAtRisk] = useState([])
  const [contacts, setContacts] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getDeals(), getAtRisk(), getContacts(), getDealScores()])
      .then(([d, a, c, s]) => {
        setDeals(d.data)
        setAtRisk(a.data)
        setContacts(c.data)
        const scoreMap = {}
        s.data.forEach(x => { scoreMap[x.deal_id] = x })
        setScores(scoreMap)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gray-400)', gap: 10 }}>
      <div style={{ width: 20, height: 20, border: '2px solid var(--gray-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading...
    </div>
  )

  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0)
  const atRiskIds = new Set(atRisk.map(d => d.id))
  const avgHealth = Object.values(scores).length
    ? Math.round(Object.values(scores).reduce((s, x) => s + x.score, 0) / Object.values(scores).length)
    : 0

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>Dashboard</h1>
        <p style={{ fontSize: 13.5, color: 'var(--gray-500)', marginTop: 4 }}>
          Live overview of your sales pipeline
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Pipeline" value={`$${(totalValue / 1000).toFixed(0)}k`} sub={`${deals.length} active deals`} color="#4F46E5" icon="💰" />
        <StatCard label="Contacts" value={contacts.length} sub="in CRM" color="#10B981" icon="👥" />
        <StatCard label="At Risk" value={atRisk.length} sub="need follow-up" color="#EF4444" icon="⚠️" />
        <StatCard label="Avg Health Score" value={`${avgHealth}/100`} sub="across active deals" color="#F59E0B" icon="📊" />
      </div>

      {/* At-risk banner */}
      {atRisk.length > 0 && (
        <div style={{
          background: '#FFF5F5', border: '1px solid #FED7D7',
          borderRadius: 'var(--radius-lg)', padding: '14px 20px',
          marginBottom: 28, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 16
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#C53030', marginBottom: 3 }}>
              ⚠ {atRisk.length} deals need immediate attention
            </div>
            <div style={{ fontSize: 13, color: '#E53E3E' }}>
              {atRisk.map(d => d.title).join(' · ')}
            </div>
          </div>
          <button onClick={() => navigate('/agent')}
            style={{
              background: '#E53E3E', color: 'white', border: 'none',
              borderRadius: 'var(--radius)', padding: '8px 16px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0
            }}>
            Ask AI Agent →
          </button>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <PipelineBarChart deals={deals} />
        <HealthDonutChart scores={scores} />
      </div>
      
      {/* Deal cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-800)' }}>All Deals</h2>
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{deals.length} total</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {deals.map(deal => (
          <DealCard
            key={deal.id} deal={deal}
            isAtRisk={atRiskIds.has(deal.id)}
            healthData={scores[deal.id]}
          />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}