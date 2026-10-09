import { apiFetch, getToken } from './lib_api.js'

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('studentnest_user') || 'null') } catch { return null }
}

export function storeAuth(data) {
  localStorage.setItem('studentnest_token', data.token)
  localStorage.setItem('studentnest_user', JSON.stringify(data.user))
}

export function clearAuth() {
  localStorage.removeItem('studentnest_token')
  localStorage.removeItem('studentnest_user')
}

export async function logout() {
  
  
  
  
  const token = getToken()
  try {
    if (token) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  } catch (_) {
    
  } finally {
    clearAuth()
  }
}

export async function getCurrentUser() {
  if (!getToken()) return null
  const data = await apiFetch('/auth/me')
  localStorage.setItem('studentnest_user', JSON.stringify(data.user))
  return data.user
}
