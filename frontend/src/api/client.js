import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' }
})

export const getContacts   = ()        => api.get('/contacts/')
export const getDeals      = ()        => api.get('/deals/')
export const getAtRisk     = ()        => api.get('/deals/at-risk')
export const getDealScores = ()        => api.get('/scores/deals')
export const getActivity   = ()        => api.get('/activity/')
export const runAgent      = (message) => api.post('/agent/run', { message })

export default api