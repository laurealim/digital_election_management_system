import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor — inject token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dems_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dems_token')
      localStorage.removeItem('dems_user')
      // Hard redirect to login — avoids stale React state
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
