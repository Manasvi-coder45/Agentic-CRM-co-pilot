import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 20 }}>
          Make sure the backend is running on port 8000.
        </p>
        <button onClick={() => this.setState({ error: null })}
          style={{
            padding: '8px 20px', background: 'var(--primary)', color: 'white',
            border: 'none', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500
          }}>
          Try again
        </button>
      </div>
    )
    return this.props.children
  }
}