'use client'

import { Game, Round, ManipulationTechnique } from '@/types/game'
import { updateRoundPhase, incrementRoundNumber } from '@/lib/firebase/gameService'
import { useEffect, useState, useCallback } from 'react'

interface RevealPhaseProps {
  game: Game
  round: Round
  userId: string
  isHost: boolean
}

const techniqueLabels: Record<ManipulationTechnique, string> = {
  emotional_language: 'שפה רגשית',
  false_dilemma: 'דילמה כוזבת',
  scapegoating: 'העברת אשמה',
  ad_hominem: 'התקפה אישית',
  inconsistency: 'אי עקביות',
  appeal_to_authority: 'פניה לסמכות',
  bandwagon: 'אפקט העדר',
  slippery_slope: 'מדרון חלקלק',
}

export default function RevealPhase({
  game,
  round,
  userId,
  isHost,
}: RevealPhaseProps) {
  const analysis = round.aiAnalysis

  const handleNext = useCallback(async () => {
    if (!isHost) return
    await updateRoundPhase(game.id, round.id, 'comparison')
  }, [isHost, game.id, round.id])

  useEffect(() => {
    // Trigger analysis if not already done
    if (isHost && !analysis) {
      fetch('/api/game/analyze-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          roundId: round.id,
        }),
      })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to analyze round:', errorData)
          // Create fallback analysis to prevent getting stuck
          if (round.correctTechniques && round.correctTechniques.length > 0) {
            const fallbackAnalysis = {
              correctTechniques: round.correctTechniques,
              explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
              neutralAlternative: 'גרסה ניטרלית של התוכן ללא מניפולציה',
              manipulationLevel: 50 + round.correctTechniques.length * 10,
              aiCommentary: 'מניפולציה מעניינת!',
            }
            // Try to update with fallback
            fetch('/api/game/update-analysis-fallback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId: game.id,
                roundId: round.id,
                analysis: fallbackAnalysis,
              }),
            }).catch(console.error)
          }
        }
      })
      .catch((error) => {
        console.error('Error calling analyze-round:', error)
        // Create fallback analysis
        if (round.correctTechniques && round.correctTechniques.length > 0) {
          const fallbackAnalysis = {
            correctTechniques: round.correctTechniques,
            explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
            neutralAlternative: 'גרסה ניטרלית של התוכן ללא מניפולציה',
            manipulationLevel: 50 + round.correctTechniques.length * 10,
            aiCommentary: 'מניפולציה מעניינת!',
          }
          fetch('/api/game/update-analysis-fallback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: game.id,
              roundId: round.id,
              analysis: fallbackAnalysis,
            }),
          }).catch(console.error)
        }
      })
    }

    // Auto-advance after 8 seconds if analysis exists, or after 12 seconds if it doesn't (to allow time for fallback)
    if (isHost) {
      const delay = analysis ? 8000 : 12000
      const timer = setTimeout(() => {
        handleNext()
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [isHost, analysis, game.id, round.id, round.correctTechniques, handleNext])

  // Use fallback analysis if no analysis exists but we have correctTechniques
  // Note: This fallback should rarely be used as analysis should be generated
  // NEVER use manipulativePost as neutralAlternative - they must be different!
  const displayAnalysis = analysis || (round.correctTechniques && round.correctTechniques.length > 0 ? {
    correctTechniques: round.correctTechniques,
    explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
    neutralAlternative: `דיון מאוזן על ${round.topic} מבוסס עובדות וללא מניפולציה רגשית.`, // Temporary placeholder until analysis is generated
    manipulationLevel: 50 + round.correctTechniques.length * 10,
    aiCommentary: 'מניפולציה מעניינת!',
  } : null)

  const manipulationLevel = displayAnalysis?.manipulationLevel || 0
  const levelColor =
    manipulationLevel >= 80
      ? 'text-red-500'
      : manipulationLevel >= 50
      ? 'text-orange-500'
      : 'text-yellow-500'

  const getHeatColor = (level: number) => {
    if (level >= 80) return 'bg-red-600'
    if (level >= 60) return 'bg-orange-600'
    if (level >= 40) return 'bg-yellow-600'
    return 'bg-fire-600'
  }

  if (!displayAnalysis) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
        <div className="text-fire-500">מכין ניתוח...</div>
      </div>
    )
  }

  const playerGuess = round.playerGuesses[userId]
  const correctCount = playerGuess
    ? playerGuess.techniques.filter((t) =>
        displayAnalysis.correctTechniques.includes(t)
      ).length
    : 0
  const incorrectCount = playerGuess
    ? playerGuess.techniques.filter(
        (t) => !displayAnalysis.correctTechniques.includes(t)
      ).length
    : 0

  return (
    <div className="min-h-screen bg-black p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-fire-500 mb-4">תוצאות</h2>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <p className="text-xl text-white leading-relaxed mb-4">
              {round.manipulativePost}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-fire-400 mb-3">
              הטכניקות הנכונות:
            </h3>
            <div className="flex flex-wrap gap-2">
              {displayAnalysis.correctTechniques.map((technique) => {
                const isCorrect = playerGuess?.techniques.includes(technique)
                return (
                  <div
                    key={technique}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isCorrect
                        ? 'bg-green-900/50 border border-green-700 text-green-300'
                        : 'bg-red-900/50 border border-red-700 text-red-300'
                    }`}
                  >
                    {techniqueLabels[technique]}
                  </div>
                )
              })}
            </div>
          </div>

          {playerGuess && (
            <div className="mb-6 p-4 bg-fire-900/20 rounded-lg border border-fire-800">
              <div className="text-fire-300 mb-2">התשובה שלך:</div>
              <div className="space-y-2">
                <div className="text-green-400">
                  נכון: {correctCount} טכניקות
                </div>
                {incorrectCount > 0 && (
                  <div className="text-red-400">
                    לא נכון: {incorrectCount} טכניקות
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-fire-400">
                רמת מניפולציה
              </h3>
              <span className={`text-3xl font-bold ${levelColor}`}>
                {manipulationLevel}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${getHeatColor(
                  manipulationLevel
                )}`}
                style={{ width: `${manipulationLevel}%` }}
              />
            </div>
            <p className="text-sm text-fire-400 mt-2">
              מייצג עוצמת השפעה רגשית (0-100)
            </p>
          </div>

          {displayAnalysis.explanation && (
            <div className="mb-6 bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-fire-400 mb-3">
                הסבר
              </h3>
              <p className="text-white leading-relaxed">
                {displayAnalysis.explanation}
              </p>
            </div>
          )}

          {displayAnalysis.aiCommentary && (
            <div className="mb-6 bg-fire-900/20 rounded-lg p-4 border border-fire-800">
              <p className="text-fire-300 italic">{displayAnalysis.aiCommentary}</p>
            </div>
          )}

          {isHost && (
            <button
              onClick={handleNext}
              className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              המשך להשוואה
            </button>
          )}

          {!isHost && (
            <div className="text-center text-fire-400 py-4">
              ממתין למארח להמשיך...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

