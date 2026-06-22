import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  "Find all at-risk deals and draft follow-up emails",
  "Check health scores and flag critical deals",
  "Update BlueWave deal stage to closed_won",
  "Summarize the pipeline by stage and total value",
]

const TOOL_LABELS = {
  get_at_risk_deals:     '🔍 Scanning for at-risk deals...',
  get_all_deals:         '📋 Fetching all deals...',
  get_all_contacts:      '👥 Loading contacts...',
  get_contact_by_id:     '👤 Fetching contact details...',
  get_deal_by_id:        '◎ Fetching deal details...',
  get_deal_health_scores:'📊 Computing health scores...',
  update_deal_stage:     '✏️ Updating deal stage...',
  draft_followup_email:  '✉️ Drafting follow-up email...',
}

function StreamingSteps({ steps }) {
  if (!steps.length) return null
  const toolCalls = steps.filter(s => s.type === 'tool_call')
  return (
    <div style={{
      background: '#F9FAFB', border: '1px solid #E5E7EB',
      borderRadius: 8, padding: '10px 14px', marginBottom: 8
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        Agent working — {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''} used
      </div>
      {toolCalls.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#059669', flexShrink: 0 }}>✓</span>
          <span style={{ fontSize: 12, color: '#374151' }}>
            {TOOL_LABELS[s.tool] || s.tool}
          </span>
        </div>
      ))}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isUser ? '#4F46E5' : 'white',
        border: isUser ? 'none' : '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        {isUser ? '◉' : '⬡'}
      </div>
      <div style={{ maxWidth: '78%' }}>
        {msg.steps && <StreamingSteps steps={msg.steps} />}
        <div style={{
          background: isUser ? '#4F46E5' : 'white',
          color: isUser ? 'white' : '#1F2937',
          border: isUser ? 'none' : '1px solid #E5E7EB',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          padding: '12px 16px', fontSize: 13.5, lineHeight: 1.65,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap'
        }}>
          {msg.content}
          {msg.streaming && (
            <span style={{ display: 'inline-block', width: 2, height: 14, background: '#4F46E5', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function AgentChat() {
  const [messages, setMessages] = useState([{
    role: 'agent',
    content: "Hi! I'm your CRM Co-Pilot. I can find at-risk deals, check health scores, draft follow-up emails, update deal stages, and more. What would you like me to do?"
  }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const eventSourceRef          = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  const send = async (text) => {
    const message = text || input.trim()
    if (!message || loading) return
    setInput('')
    setLoading(true)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }])

    // Add empty agent message that we'll stream into
    setMessages(prev => [...prev, {
      role: 'agent',
      content: '',
      steps: [],
      streaming: true
    }])

    const url = `http://127.0.0.1:8000/agent/stream?message=${encodeURIComponent(message)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'tool_call') {
        setMessages(prev => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
          last.steps = [...(last.steps || []), { type: 'tool_call', tool: data.tool, input: data.input }]
          updated[updated.length - 1] = last
          return updated
        })
      }

      else if (data.type === 'response') {
        setMessages(prev => {
          const updated = [...prev]
          const last = { ...updated[updated.length - 1] }
          last.content = data.content
          last.streaming = false
          updated[updated.length - 1] = last
          return updated
        })
      }

      else if (data.type === 'error') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'agent',
            content: `⚠ Agent error: ${data.content}`,
            steps: []
          }
          return updated
        })
        es.close()
        setLoading(false)
      }

      else if (data.type === 'done') {
        es.close()
        setLoading(false)
      }
    }

    es.onerror = () => {
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (!last.content) {
          updated[updated.length - 1] = {
            role: 'agent',
            content: '⚠ Could not reach the agent. Make sure the backend is running.',
            steps: []
          }
        }
        return updated
      })
      es.close()
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ padding: '24px 0 16px', borderBottom: '1px solid #F3F4F6', marginBottom: 24, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white' }}>⬡</div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>AI Agent</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Groq · LLaMA 3.3 70B · {loading ? 'Thinking...' : 'Ready'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{
              background: 'white', border: '1px solid #E5E7EB',
              borderRadius: 20, padding: '6px 14px', fontSize: 12.5,
              color: '#6B7280', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ paddingBottom: 24, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '8px 8px 8px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Tell the agent what to do..."
            disabled={loading}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1F2937', background: 'transparent' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#F3F4F6' : '#4F46E5',
              color: loading || !input.trim() ? '#9CA3AF' : 'white',
              border: 'none', borderRadius: 8, padding: '8px 18px',
              fontSize: 13.5, fontWeight: 500, transition: 'all 0.12s'
            }}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}