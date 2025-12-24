'use client'

import { Game, Round } from '@/types/game'
import { useEffect, useState } from 'react'
import GuessingPhase from './GuessingPhase'
import RevealPhase from './RevealPhase'
import ComparisonPhase from './ComparisonPhase'

interface GameRoundProps {
  game: Game
  round: Round
  userId: string
  isHost: boolean
}

export default function GameRound({
  game,
  round,
  userId,
  isHost,
}: GameRoundProps) {
  const [localRound, setLocalRound] = useState(round)

  useEffect(() => {
    setLocalRound(round)
  }, [round])

  const renderPhase = () => {
    switch (localRound.phase) {
      case 'guessing':
        return (
          <GuessingPhase
            game={game}
            round={localRound}
            userId={userId}
            isHost={isHost}
          />
        )
      case 'reveal':
        return (
          <RevealPhase
            game={game}
            round={localRound}
            userId={userId}
            isHost={isHost}
          />
        )
      case 'comparison':
        return (
          <ComparisonPhase
            game={game}
            round={localRound}
            userId={userId}
            isHost={isHost}
          />
        )
      default:
        return (
          <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
            <div className="text-fire-500">ממתין...</div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <div className="border-b border-fire-900 p-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-fire-400">
            סיבוב {round.roundNumber} מתוך {game.totalRounds}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-fire-300 text-sm">קוד:</span>
            <span className="text-fire-500 font-mono font-bold text-xl tracking-wider">
              {game.code}
            </span>
          </div>
        </div>
      </div>
      {renderPhase()}
    </div>
  )
}

