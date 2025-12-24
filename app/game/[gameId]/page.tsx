'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { onAuthChange } from '@/lib/firebase/authService'
import { subscribeToGame } from '@/lib/firebase/gameService'
import { Game } from '@/types/game'
import GameLobby from '@/components/GameLobby'
import GameRound from '@/components/GameRound'
import { User } from 'firebase/auth'

export default function GamePage() {
  const params = useParams()
  const gameId = params.gameId as string
  const [game, setGame] = useState<Game | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeAuth = onAuthChange((authUser) => {
      setUser(authUser)
      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!gameId) return

    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      setGame(gameData)
    })

    return () => unsubscribe()
  }, [gameId])

  if (loading || !user || !game) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
        <div className="text-fire-500 text-xl">טוען...</div>
      </div>
    )
  }

  // Check if user is host - either by player record or by being the game creator
  const isHost = game.players[user.uid]?.isHost || game.hostId === user.uid || false
  const currentRound = game.currentRoundId
    ? game.rounds[game.currentRoundId]
    : null

  if (game.status === 'lobby') {
    return <GameLobby game={game} userId={user.uid} isHost={isHost} />
  }

  if (currentRound) {
    return (
      <GameRound
        game={game}
        round={currentRound}
        userId={user.uid}
        isHost={isHost}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
      <div className="text-fire-500 text-xl">מכין סיבוב...</div>
    </div>
  )
}

