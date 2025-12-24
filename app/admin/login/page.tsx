'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username === 'admin' && password === 'admin') {
      // Store admin session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin-authenticated', 'true')
        router.push('/admin/dashboard')
      }
    } else {
      setError('שם משתמש או סיסמה שגויים')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-fire-500 mb-2">
            Manipulation Factory
          </h1>
          <p className="text-fire-300 text-lg">
            פאנל ניהול
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-fire-300 mb-2 text-sm font-medium">
              שם משתמש
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הזן שם משתמש"
              className="w-full bg-gray-900 border border-fire-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fire-500 transition-colors"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-fire-300 mb-2 text-sm font-medium">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הזן סיסמה"
              className="w-full bg-gray-900 border border-fire-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fire-500 transition-colors"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  )
}

