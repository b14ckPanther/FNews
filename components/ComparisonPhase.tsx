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

  // No auto-advance - admin controls when to proceed

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

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  const getRankStyle = (index: number) => {
    if (index === 0) {
      return {
        bg: 'bg-yellow-900/40 border-yellow-600',
        badge: 'bg-yellow-600 text-white',
        text: 'text-yellow-300',
        medal: '🥇'
      }
    }
    if (index === 1) {
      return {
        bg: 'bg-gray-700/40 border-gray-500',
        badge: 'bg-gray-500 text-white',
        text: 'text-gray-300',
        medal: '🥈'
      }
    }
    if (index === 2) {
      return {
        bg: 'bg-orange-900/40 border-orange-600',
        badge: 'bg-orange-600 text-white',
        text: 'text-orange-300',
        medal: '🥉'
      }
    }
    return {
      bg: 'bg-gray-800',
      badge: 'bg-gray-700 text-fire-300',
      text: 'text-white',
      medal: ''
    }
  }

  return (
    <div className="mt-8 bg-gray-900 rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-fire-400 mb-4">לוח תוצאות</h3>
      
      {/* Top 3 */}
      {top3.length > 0 && (
        <div className="mb-6 space-y-3">
          {top3.map((player, index) => {
            const style = getRankStyle(index)
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${style.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${style.badge}`}>
                    {style.medal || index + 1}
                  </div>
                  <div>
                    <div className={`font-semibold text-lg ${style.text}`}>
                      {player.displayName}
                    </div>
                    {player.isAI && (
                      <div className="text-xs text-fire-400">בינה מלאכותית</div>
                    )}
                  </div>
                </div>
                <div className={`font-bold text-2xl ${style.text}`}>
                  {player.score}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <div className="text-fire-400 text-sm mb-2 font-medium">יתר השחקנים:</div>
          {rest.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-700 text-fire-300 text-sm">
                  {index + 4}
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
              <div className="text-fire-500 font-bold">{player.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

