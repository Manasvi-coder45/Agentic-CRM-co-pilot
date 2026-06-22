import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const STAGE_COLORS = {
  prospecting:   '#9CA3AF',
  qualification: '#3B82F6',
  proposal:      '#7C3AED',
  negotiation:   '#D97706',
  closed_won:    '#059669',
  closed_lost:   '#DC2626',
}

const HEALTH_COLORS = ['#EF4444', '#F59E0B', '#10B981']

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white', border: '1px solid #E5E7EB',
        borderRadius: 8, padding: '10px 14px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          ${payload[0].value?.toLocaleString()}
        </div>
      </div>
    )
  }
  return null
}

export function PipelineBarChart({ deals }) {
  const stages = ['prospecting','qualification','proposal','negotiation','closed_won','closed_lost']
  const data = stages.map(stage => ({
    name: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
    color: STAGE_COLORS[stage]
  })).filter(d => d.value > 0)

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB',
      borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Pipeline Value by Stage</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Total deal value per pipeline stage</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HealthDonutChart({ scores }) {
  const scoreValues = Object.values(scores)
  if (!scoreValues.length) return null

  const data = [
    { name: 'Critical (0–25)',  value: scoreValues.filter(s => s.score <= 25).length },
    { name: 'At Risk (26–50)', value: scoreValues.filter(s => s.score > 25 && s.score <= 50).length },
    { name: 'Healthy (51+)',   value: scoreValues.filter(s => s.score > 50).length },
  ].filter(d => d.value > 0)

  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB',
      borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Deal Health Distribution</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Breakdown of deals by health score range</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={55} outerRadius={80}
            paddingAngle={3} dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={HEALTH_COLORS[i]} />
            ))}
          </Pie>
          <Legend
            iconType="circle" iconSize={8}
            formatter={v => <span style={{ fontSize: 12, color: '#6B7280' }}>{v}</span>}
          />
          <Tooltip
            formatter={(value) => [`${value} deals`, '']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}