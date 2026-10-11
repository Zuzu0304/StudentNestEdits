const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://studentnesteditsbackend.onrender.com/api'
).replace(/\/+$/, '')

const API_ORIGIN = /^https?:\/\//i.test(API_URL)
  ? API_URL.replace(/\/api\/?$/, '')
  : window.location.origin

export function mediaUrl(value) {
  const raw =
    typeof value === 'string'
      ? value
      : value?.url

  if (!raw) {
    return ''
  }

  // Backend returned a complete URL
  // or this is a temporary browser preview.
  if (
    /^(https?:|blob:|data:)/i.test(raw)
  ) {
    return raw
  }

  // Convert Windows paths to web paths.
  const clean = String(raw)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')

  return `${API_ORIGIN}/${clean}`
}

export function getToken() {
  return (
    localStorage.getItem(
      'studentnest_token',
    ) || ''
  )
}

export async function apiFetch(
  path,
  options = {},
) {
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : {
          'Content-Type':
            'application/json',
        }),

    ...(options.headers || {}),
  }

  const token = getToken()

  const privatePath = /^\/(messages|notifications)(\/|$)|^\/marketplace\/(items\/mine|transactions|payout-account)(\/|$)|^\/student\/(favourites|inquiries)(\/|$)/.test(path)
  if (privatePath && !token) {
    throw new Error('Authentication required.')
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    },
  )

  let data = null

  try {
    data = await response.json()
  } catch {
    data = {
      success: false,
      message:
        'Invalid server response.',
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status})`,
    )
  }

  return data
}

export { API_URL }