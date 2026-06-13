import axios from 'axios'
const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login' }
  return Promise.reject(err)
})
export default api
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}
export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData),
  list: (params) => api.get('/documents/', { params }),
  get: (id) => api.get(`/documents/${id}`),
  status: (id) => api.get(`/documents/${id}/status`),
  downloadPdf: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  retry: (id) => api.post(`/documents/${id}/retry`),
}
export const summariesAPI = {
  get: (id) => api.get(`/summaries/${id}`),
}
