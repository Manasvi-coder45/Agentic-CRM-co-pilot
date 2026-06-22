import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar      from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard    from './pages/Dashboard'
import AgentChat    from './pages/AgentChat'
import Contacts     from './pages/Contacts'
import Deals        from './pages/Deals'
import ActivityLog  from './pages/ActivityLog'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--gray-50)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/"         element={<Dashboard />}   />
              <Route path="/agent"    element={<AgentChat />}   />
              <Route path="/contacts" element={<Contacts />}    />
              <Route path="/deals"    element={<Deals />}       />
              <Route path="/activity" element={<ActivityLog />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  )
}