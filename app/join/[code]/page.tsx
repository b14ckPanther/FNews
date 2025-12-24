'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { onAuthChange, signInAnonymous } from '@/lib/firebase/authService'
import { joinGame } from '@/lib/firebase/gameService'
import { User } from 'firebase/auth'

export default function JoinByCodePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [user, setUser] = useState<User | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser)
    })
    return () => unsubscribe()
  }, [])

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('אנא הזן שם תצוגה')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Authenticate if needed
      let currentUser = user
      if (!currentUser) {
        await signInAnonymous()
        // Wait for auth to propagate
        await new Promise((resolve) => setTimeout(resolve, 500))
        // Get the updated user
        currentUser = (await new Promise<User | null>((resolve) => {
          const unsubscribe = onAuthChange((u) => {
            resolve(u)
            unsubscribe()
          })
        })) || null
      }

      if (!currentUser) {
        throw new Error('Failed to authenticate')
      }

      const gameId = await joinGame(code, currentUser.uid, playerName.trim())
      if (!gameId) {
        setError('משחק לא נמצא. אנא וודא שהקוד נכון והמשחק עדיין בלובי')
        setLoading(false)
        return
      }

      router.push(`/game/${gameId}`)
    } catch (err: any) {
      console.error('Join error:', err)
      setError(err?.message || 'שגיאה בהצטרפות למשחק')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-fire-500 mb-2">
            Manipulation Factory
          </h1>
          <p className="text-fire-300 text-lg mb-4">
            הצטרף למשחק
          </p>
          <div className="text-fire-400">
            קוד משחק: <span className="font-mono font-bold text-2xl">{code}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-fire-300 mb-2 text-sm font-medium">
              שם תצוגה
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="הזן את שמך"
              className="w-full bg-gray-900 border border-fire-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fire-500 transition-colors"
              maxLength={20}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleJoin()
                }
              }}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || !playerName.trim()}
            className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'מצטרף...' : 'הצטרף למשחק'}
          </button>
        </div>
      </div>
    </div>
  )
}

