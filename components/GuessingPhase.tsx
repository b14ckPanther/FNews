'use client'

import { Game, Round, ManipulationTechnique } from '@/types/game'
import { submitGuess } from '@/lib/firebase/gameService'
import { useState, useEffect } from 'react'

interface GuessingPhaseProps {
  game: Game
  round: Round
  userId: string
  isHost: boolean
}

const techniqueOptions: { value: ManipulationTechnique; label: string }[] = [
  { value: 'emotional_language', label: 'שפה רגשית' },
  { value: 'false_dilemma', label: 'דילמה כוזבת' },
  { value: 'scapegoating', label: 'העברת אשמה' },
  { value: 'ad_hominem', label: 'התקפה אישית' },
  { value: 'inconsistency', label: 'אי עקביות' },
  { value: 'appeal_to_authority', label: 'פניה לסמכות' },
  { value: 'bandwagon', label: 'אפקט העדר' },
  { value: 'slippery_slope', label: 'מדרון חלקלק' },
]

export default function GuessingPhase({
  game,
  round,
  userId,
  isHost,
}: GuessingPhaseProps) {
  const [selectedTechniques, setSelectedTechniques] = useState<
    ManipulationTechnique[]
  >([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (round.guessingEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, round.guessingEndsAt! - Date.now())
        setTimeRemaining(Math.ceil(remaining / 1000))
        if (remaining <= 0) {
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [round.guessingEndsAt])

  const handleToggleTechnique = (technique: ManipulationTechnique) => {
    if (submitted) return

    setSelectedTechniques((prev) =>
      prev.includes(technique)
        ? prev.filter((t) => t !== technique)
        : [...prev, technique]
    )
  }

  const handleSubmit = async () => {
    if (selectedTechniques.length === 0 || submitted) return

    try {
      await submitGuess(game.id, round.id, userId, selectedTechniques)
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting guess:', error)
    }
  }

  const hasGuessed = round.playerGuesses[userId] !== undefined

  return (
    <div className="min-h-screen bg-black p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-fire-500">נושא: {round.topic}</h2>
            {timeRemaining !== null && (
              <div
                className={`text-2xl font-mono font-bold ${
                  timeRemaining <= 10
                    ? 'text-red-500 animate-pulse'
                    : 'text-fire-400'
                }`}
              >
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <p className="text-xl text-white leading-relaxed whitespace-pre-wrap">
              {round.manipulativePost}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-fire-400 mb-4">
              אילו טכניקות מניפולציה זיהית בפוסט?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {techniqueOptions.map((option) => {
                const isSelected = selectedTechniques.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleToggleTechnique(option.value)}
                    disabled={submitted}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-fire-600 border-fire-500 text-white'
                        : 'bg-gray-900 border-fire-800 text-fire-300 hover:border-fire-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {!submitted && !hasGuessed && (
            <button
              onClick={handleSubmit}
              disabled={selectedTechniques.length === 0}
              className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              שלח תשובה
            </button>
          )}

          {(submitted || hasGuessed) && (
            <div className="bg-fire-900/30 border border-fire-700 text-fire-300 px-4 py-3 rounded-lg text-center">
              התשובה נשלחה! ממתין לשחקנים אחרים...
            </div>
          )}

          <div className="mt-6">
            <div className="text-fire-400 mb-2">
              שחקנים שענו ({Object.keys(round.playerGuesses).length}/
              {Object.keys(game.players).length})
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(round.playerGuesses).map(([playerId]) => {
                const player = game.players[playerId]
                return (
                  <div
                    key={playerId}
                    className="px-3 py-1 bg-fire-900/30 rounded-full text-fire-300 text-sm"
                  >
                    {player?.displayName || 'שחקן'}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

