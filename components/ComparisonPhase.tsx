'use client'

import { Game, Round } from '@/types/game'
import {
  updateRoundPhase,
  incrementRoundNumber,
  createRound,
} from '@/lib/firebase/gameService'
import { useState, useEffect, useCallback } from 'react'

interface ComparisonPhaseProps {
  game: Game
  round: Round
  userId: string
  isHost: boolean
}

export default function ComparisonPhase({
  game,
  round,
  userId,
  isHost,
}: ComparisonPhaseProps) {
  const analysis = round.aiAnalysis

  const handleNext = useCallback(async () => {
    if (!isHost) return

    await updateRoundPhase(game.id, round.id, 'complete')

    if (game.currentRoundNumber < game.totalRounds) {
      // Create next round
      const response = await fetch('/api/ai/generate-post', {
        method: 'POST',
      })
      const { topic, post, techniques } = await response.json()

      await incrementRoundNumber(game.id)
      const nextRoundNumber = game.currentRoundNumber + 1
      const roundId = await createRound(game.id, nextRoundNumber, topic, post, techniques)
      await updateRoundPhase(game.id, roundId, 'guessing', Date.now() + 60000)

      // Generate and submit AI player guess for next round
      const aiPlayer = Object.values(game.players).find((p) => p.isAI)
      if (aiPlayer) {
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
            aiPlayerId: aiPlayer.id,
            techniques: aiGuess.techniques,
          }),
        }).catch(console.error)
      }
    } else {
      // Game finished - could navigate to results screen
      window.location.reload()
    }
  }, [isHost, game.id, game.currentRoundNumber, game.totalRounds, game.players, round.id])

  useEffect(() => {
    // Auto-advance after 10 seconds
    if (isHost && analysis) {
      const timer = setTimeout(() => {
        handleNext()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [isHost, analysis, handleNext])

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
        <div className="text-fire-500">טוען...</div>
      </div>
    )
  }

  const isGameFinished = game.currentRoundNumber >= game.totalRounds

  return (
    <div className="min-h-screen bg-black p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-fire-500 mb-6">
          השוואה והרהור
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900 rounded-lg p-6 border-2 border-red-700/50">
            <h3 className="text-xl font-semibold text-red-400 mb-4">
              גרסה מניפולטיבית
            </h3>
            <p className="text-white leading-relaxed whitespace-pre-wrap">
              {round.manipulativePost}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border-2 border-green-700/50">
            <h3 className="text-xl font-semibold text-green-400 mb-4">
              גרסה ניטרלית
            </h3>
            <p className="text-white leading-relaxed whitespace-pre-wrap">
              {analysis.neutralAlternative}
            </p>
          </div>
        </div>

        <div className="bg-fire-900/20 rounded-lg p-6 mb-6 border border-fire-800">
          <h3 className="text-xl font-semibold text-fire-400 mb-4">
            שאלות להרהור:
          </h3>
          <ul className="space-y-2 text-fire-300 list-disc list-inside">
            <li>איזו גרסה גרמה לך לחוש רגש יותר?</li>
            <li>איזו גרסה הייתה משכנעת יותר?</li>
            <li>מה ההבדל העיקרי ביניהן?</li>
            <li>איך המניפולציה משפיעה על התפיסה?</li>
          </ul>
        </div>

        {isHost && (
          <button
            onClick={handleNext}
            className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            {isGameFinished ? 'סיים משחק' : 'סיבוב הבא'}
          </button>
        )}

        {!isHost && (
          <div className="text-center text-fire-400 py-4">
            ממתין למארח להמשיך...
          </div>
        )}

        <Leaderboard game={game} />
      </div>
    </div>
  )
}

function Leaderboard({ game }: { game: Game }) {
  const players = Object.values(game.players).sort(
    (a, b) => b.score - a.score
  )

  return (
    <div className="mt-8 bg-gray-900 rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-fire-400 mb-4">לוח תוצאות</h3>
      <div className="space-y-2">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0
                ? 'bg-fire-900/30 border border-fire-700'
                : 'bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0
                    ? 'bg-fire-600 text-white'
                    : 'bg-gray-700 text-fire-300'
                }`}
              >
                {index + 1}
              </div>
              <div>
                <div className="text-white font-medium">
                  {player.displayName}
                </div>
                {player.isAI && (
                  <div className="text-xs text-fire-400">בינה מלאכותית</div>
                )}
              </div>
            </div>
            <div className="text-fire-500 font-bold text-lg">{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

