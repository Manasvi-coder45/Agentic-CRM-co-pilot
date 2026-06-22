import { useEffect, useState } from 'react'
import { getContacts } from '../api/client'

const STATUS = {
  lead:     { color: '#3B82F6', bg: '#EFF6FF' },
  prospect: { color: '#7C3AED', bg: '#F5F3FF' },
  customer: { color: '#059669', bg: '#ECFDF5' },
  churned:  { color: '#DC2626', bg: '#FEF2F2' },
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    getContacts().then(r => setContacts(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>Contacts</h1>
          <p style={{ fontSize: 13.5, color: 'var(--gray-500)', marginTop: 4 }}>{contacts.length} contacts in CRM</p>
        </div>
        <input
          placeholder="Search by name, company or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: 260, padding: '9px 14px', border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius)', fontSize: 13.5, color: 'var(--gray-700)',
            outline: 'none', background: 'var(--white)', boxShadow: 'var(--shadow-sm)'
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--gray-400)', padding: '2rem' }}>Loading contacts...</div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Name', 'Company', 'Email', 'Phone', 'Status'].map(h => (
                  <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const st = STATUS[c.status] || STATUS.lead
                return (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--gray-100)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--primary)', flexShrink: 0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--gray-800)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13.5, color: 'var(--gray-600)' }}>{c.company}</td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--gray-500)' }}>{c.email}</td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--gray-500)' }}>{c.phone}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}