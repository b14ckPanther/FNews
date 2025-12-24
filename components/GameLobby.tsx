'use client'

import { Game } from '@/types/game'
import { startGame, createRound, updateRoundPhase } from '@/lib/firebase/gameService'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface GameLobbyProps {
  game: Game
  userId: string
  isHost: boolean
}

export default function GameLobby({ game, userId, isHost }: GameLobbyProps) {
  const [loading, setLoading] = useState(false)
  const players = Object.values(game.players)

  const handleStartGame = async () => {
    if (!isHost) return

    setLoading(true)
    try {
      // Add AI player if not exists
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
      const guessingEndsAt = Date.now() + 60000 // 60 seconds
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

      // Submit AI guess asynchronously
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

      // Store AI analysis with correct techniques
      await fetch('/api/game/store-round-techniques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          roundId,
          techniques,
        }),
      }).catch(console.error)

    } catch (error) {
      console.error('Error starting game:', error)
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.code)
    alert(`קוד המשחק ${game.code} הועתק ללוח!`)
  }

  // Generate join URL - works on same device or network
  const getJoinUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${game.code}`
  }

  return (
    <div className="min-h-screen bg-black p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-fire-500 mb-6">
            חדר המתנה
          </h1>
          
          {/* Prominent Game Code Display with QR Code */}
          <div className="bg-fire-900/30 border-2 border-fire-600 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-fire-300 text-lg mb-4">
                קוד משחק - שתף עם שחקנים
              </div>
              
              {isHost && (
                <div className="mb-6">
                  <div className="text-fire-400 text-sm mb-3">
                    סרוק QR כדי להצטרף
                  </div>
                  <div className="flex justify-center bg-white p-4 rounded-lg inline-block">
                    <QRCodeSVG
                      value={getJoinUrl()}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-5xl font-mono font-bold text-fire-500 tracking-widest">
                  {game.code}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-fire-600 hover:bg-fire-700 text-white rounded-lg transition-colors text-sm font-medium"
                  title="העתק קוד"
                >
                  העתק
                </button>
              </div>
              {isHost && (
                <div className="text-fire-400 text-sm space-y-1">
                  <div>אתה המארח - שתף QR או קוד זה עם שחקנים אחרים</div>
                  <div className="text-xs text-fire-500">
                    או העתק את הקישור: <span className="font-mono">{getJoinUrl()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-fire-400 mb-4">
            שחקנים ({players.length})
          </h2>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === userId
                    ? 'bg-fire-900/30 border border-fire-700'
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-fire-600 flex items-center justify-center text-white font-semibold">
                    {player.displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {player.displayName}
                    </div>
                    {player.isHost && (
                      <div className="text-xs text-fire-400">מארח</div>
                    )}
                    {player.isAI && (
                      <div className="text-xs text-fire-300">בינה מלאכותית</div>
                    )}
                  </div>
                </div>
                {player.isHost && (
                  <span className="text-fire-500 text-sm font-bold">★</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={loading || players.length < 2}
            className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading
              ? 'מתחיל משחק...'
              : players.length < 2
              ? 'ממתין לשחקנים נוספים...'
              : 'התחל משחק'}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-fire-300 py-4">
            ממתין למארח להתחיל את המשחק...
          </div>
        )}
      </div>
    </div>
  )
}

