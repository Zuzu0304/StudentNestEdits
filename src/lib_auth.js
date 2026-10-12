import { apiFetch, getToken } from './lib_api.js'

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('studentnest_user') || 'null') } catch { return null }
}

export function storeAuth(data) {
  localStorage.setItem('studentnest_token', data.token)
  localStorage.setItem('studentnest_user', JSON.stringify(data.user))
}

export function storeUser(user) {
  localStorage.setItem('studentnest_user', JSON.stringify(user))
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
      })
    }
  } finally {
    clearAuth()
    window.dispatchEvent(new Event('studentnest-auth'))
  }
}

export async function getCurrentUser() {
  if (!getToken()) return null
  const data = await apiFetch('/auth/me')
  if (!data?.user) {
    throw new Error('The server did not return the current user.')
  }
  storeUser(data.user)
  return data.user
}
