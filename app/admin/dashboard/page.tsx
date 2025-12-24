'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { signInAnonymous, onAuthChange } from '@/lib/firebase/authService'
import { createGame, startGame, createRound, updateRoundPhase } from '@/lib/firebase/gameService'
import { subscribeToGame } from '@/lib/firebase/gameService'
import { Game } from '@/types/game'
import { User } from 'firebase/auth'

export default function AdminDashboard() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [game, setGame] = useState<Game | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)

  useEffect(() => {
    // Check admin authentication
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('admin-authenticated') === 'true'
      if (!isAuth) {
        router.push('/admin/login')
        return
      }
      setAuthenticated(true)
    }
  }, [router])

  useEffect(() => {
    if (!authenticated) return

    // Authenticate with Firebase
    const unsubscribe = onAuthChange(async (authUser) => {
      if (!authUser) {
        try {
          await signInAnonymous()
        } catch (error) {
          console.error('Error signing in:', error)
        }
      } else {
        setUser(authUser)
      }
    })

    return () => unsubscribe()
  }, [authenticated])

  useEffect(() => {
    if (!user || game) return

    // Create game automatically when admin logs in (only once)
    const createAdminGame = async () => {
      try {
        setGameLoading(true)
        const gameId = await createGame(user.uid, 'Admin')
        
        // Subscribe to game updates
        const unsubscribe = subscribeToGame(gameId, (gameData) => {
          setGame(gameData)
        })
        setGameLoading(false)
        return () => unsubscribe()
      } catch (error) {
        console.error('Error creating game:', error)
        setGameLoading(false)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleStartGame = async () => {
    if (!game || !user) return

    setLoading(true)
    try {
      // Add AI player
      const addAIResponse = await fetch('/api/game/add-ai-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id }),
      })
      const { aiPlayerId } = await addAIResponse.json()

      await startGame(game.id)

      // Create first round
      const response = await fetch('/api/ai/generate-post', {
        method: 'POST',
      })
      const { topic, post, techniques } = await response.json()

      const roundId = await createRound(game.id, 1, topic, post, techniques)
      const guessingEndsAt = Date.now() + 60000
      await updateRoundPhase(game.id, roundId, 'guessing', guessingEndsAt)

      // Generate and submit AI player guess
      const shouldMakeMistake = Math.random() > 0.6
      const aiGuessResponse = await fetch('/api/ai/ai-player-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post,
          topic,
          shouldMakeMistake,
        }),
      })
      const aiGuess = await aiGuessResponse.json()

      fetch('/api/game/submit-ai-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          roundId,
          aiPlayerId,
          techniques: aiGuess.techniques,
        }),
      }).catch(console.error)

      // Redirect to game
      router.push(`/game/${game.id}`)
    } catch (error) {
      console.error('Error starting game:', error)
      setLoading(false)
    }
  }

  const getJoinUrl = () => {
    if (typeof window === 'undefined' || !game) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${game.code}`
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin-authenticated')
      router.push('/admin/login')
    }
  }

  if (!authenticated || gameLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
        <div className="text-fire-500 text-xl">טוען...</div>
      </div>
    )
  }

  const players = game ? Object.values(game.players) : []

  return (
    <div className="min-h-screen bg-black p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-fire-500">
            פאנל ניהול
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            התנתק
          </button>
        </div>

        {game && (
          <>
            {/* QR Code Section */}
            <div className="bg-fire-900/30 border-2 border-fire-600 rounded-lg p-8 mb-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-fire-400 mb-4">
                  סרוק כדי להצטרף למשחק
                </h2>
                <div className="flex justify-center bg-white p-6 rounded-lg inline-block mb-4">
                  <QRCodeSVG
                    value={getJoinUrl()}
                    size={300}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-fire-300 text-sm mb-2">
                  שחקנים יכולים לסרוק את הקוד הזה כדי להצטרף למשחק
                </p>
                <p className="text-fire-400 text-xs font-mono">
                  {getJoinUrl()}
                </p>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-fire-400 mb-4">
                שחקנים ({players.length})
              </h2>
              <div className="space-y-2">
                {players.length === 0 ? (
                  <div className="text-fire-300 text-center py-4">
                    עדיין אין שחקנים שהצטרפו
                  </div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-fire-600 flex items-center justify-center text-white font-semibold">
                          {player.displayName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {player.displayName}
                          </div>
                          {player.isAI && (
                            <div className="text-xs text-fire-300">בינה מלאכותית</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              disabled={loading || game.status !== 'lobby'}
              className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading
                ? 'מתחיל משחק...'
                : game.status !== 'lobby'
                ? 'המשחק כבר התחיל'
                : 'התחל משחק'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

