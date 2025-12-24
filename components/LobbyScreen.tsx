'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInAnonymous, onAuthChange } from '@/lib/firebase/authService'
import { createGame, joinGame } from '@/lib/firebase/gameService'
import { User } from 'firebase/auth'

export default function LobbyScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleAnonymousSignIn = async () => {
    if (!playerName.trim()) {
      setError('אנא הזן שם תצוגה')
      return
    }

    try {
      setLoading(true)
      setError('')
      if (!user) {
        await signInAnonymous()
      }
    } catch (err) {
      setError('שגיאה בהתחברות')
      setLoading(false)
    }
  }

  const handleCreateGame = async () => {
    if (!user || !playerName.trim()) {
      setError('אנא הזן שם תצוגה')
      return
    }

    try {
      setLoading(true)
      setError('')
      const gameId = await createGame(user.uid, playerName.trim())
      router.push(`/game/${gameId}`)
    } catch (err) {
      setError('שגיאה ביצירת משחק')
      setLoading(false)
    }
  }

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError('אנא הזן שם תצוגה')
      return
    }

    // Make sure user is authenticated first
    if (!user) {
      try {
        setLoading(true)
        await signInAnonymous()
        // Wait a moment for auth to propagate
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        setError('שגיאה בהתחברות')
        setLoading(false)
        return
      }
    }

    if (!gameCode.trim() || gameCode.length !== 6) {
      setError('אנא הזן קוד משחק תקין (6 ספרות)')
      return
    }

    try {
      setLoading(true)
      setError('')
      const gameId = await joinGame(gameCode.trim(), user.uid, playerName.trim())
      if (!gameId) {
        setError('משחק לא נמצא. אנא וודא שהקוד נכון והמשחק עדיין בלובי (לא התחיל)')
        setLoading(false)
        return
      }
      router.push(`/game/${gameId}`)
    } catch (err: any) {
      console.error('Join game error:', err)
      const errorMessage = err?.message || 'שגיאה בהצטרפות למשחק'
      setError(`שגיאה: ${errorMessage}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-fire-500 mb-4">
            Manipulation Factory
          </h1>
          <p className="text-fire-300 text-lg">
            חוויית הכשרה אינטראקטיבית לזיהוי מניפולציה
          </p>
        </div>

        {error && error.includes('Firebase') && (
          <div className="mb-6 bg-yellow-900/30 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!user ? (
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
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAnonymousSignIn}
              disabled={loading}
              className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'מתחבר...' : 'התחבר והמשך'}
            </button>
          </div>
        ) : (
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
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCreateGame}
                disabled={loading || !playerName.trim()}
                className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'יוצר משחק...' : 'צור משחק חדש'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-fire-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-fire-400">או</span>
                </div>
              </div>

              <div>
                <label className="block text-fire-300 mb-2 text-sm font-medium">
                  קוד משחק
                </label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setGameCode(value)
                  }}
                  placeholder="הזן קוד משחק (6 ספרות)"
                  className="w-full bg-gray-900 border border-fire-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fire-500 transition-colors text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleJoinGame}
                disabled={loading || !playerName.trim() || gameCode.length !== 6}
                className="w-full bg-fire-800 hover:bg-fire-900 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'מצטרף...' : 'הצטרף למשחק'}
              </button>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

