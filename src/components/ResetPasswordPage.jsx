import { useState } from 'react'
import { apiFetch } from '../lib_api.js'
import { clearAuth } from '../lib_auth.js'

function tokenFromHash() {
  const query = window.location.hash.split('?')[1] || ''
  return new URLSearchParams(query).get('token') || ''
}

export default function ResetPasswordPage() {
  const [token, setToken] = useState(tokenFromHash)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const result = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), newPassword: password }),
      })
      clearAuth()
      window.dispatchEvent(new Event('studentnest-auth'))
      window.alert(result.message || 'Password reset. Please log in.')
      window.location.hash = 'login'
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className='auth-page'>
      <div className='container auth-shell reset-auth-shell'>
        <section className='auth-card'>
          <div className='auth-card-header'>
            <span className='eyebrow'>Account recovery</span>
            <h1>Reset your password</h1>
            <p>Enter the reset token and choose a new password.</p>
          </div>
          <form className='auth-form' onSubmit={submit}>
            <label className='auth-field'>
              <span>Reset token</span>
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                autoComplete='one-time-code'
                required
              />
            </label>
            <label className='auth-field'>
              <span>New password</span>
              <input
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete='new-password'
                minLength={8}
                required
              />
            </label>
            <label className='auth-field'>
              <span>Confirm new password</span>
              <input
                type='password'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete='new-password'
                minLength={8}
                required
              />
            </label>
            {error && <p className='auth-server-message' role='alert'>{error}</p>}
            <button className='btn btn-primary auth-submit' disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
          <p className='auth-switch-copy'>
            <a href='#login'>Return to log in</a>
          </p>
        </section>
      </div>
    </main>
  )
}
