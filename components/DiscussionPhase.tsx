'use client'

import { Game, Round } from '@/types/game'
import { updateRoundPhase } from '@/lib/firebase/gameService'
import { useEffect, useCallback } from 'react'

interface DiscussionPhaseProps {
  game: Game
  round: Round
  userId: string
  isHost: boolean
}

export default function DiscussionPhase({
  game,
  round,
  userId,
  isHost,
}: DiscussionPhaseProps) {
  const handleNext = useCallback(async () => {
    if (!isHost) return
    await updateRoundPhase(game.id, round.id, 'comparison')
  }, [isHost, game.id, round.id])

  useEffect(() => {
    // Auto-advance after 15 seconds for discussion
    if (isHost) {
      const timer = setTimeout(() => {
        handleNext()
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [isHost, handleNext])

  return (
    <div className="min-h-screen bg-black p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-fire-500 mb-6">
          זמן לדיון
        </h2>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <p className="text-xl text-white leading-relaxed mb-4">
            {round.manipulativePost}
          </p>
        </div>

        <div className="bg-fire-900/20 rounded-lg p-6 mb-6 border border-fire-800">
          <h3 className="text-xl font-semibold text-fire-400 mb-4">
            שאלות לדיון:
          </h3>
          <ul className="space-y-3 text-fire-300 list-disc list-inside">
            <li>אילו טכניקות זיהיתם? מה היה הכי ברור?</li>
            <li>איך הפוסט הזה גרם לכם להרגיש?</li>
            <li>מה הייתם משנים כדי להפוך אותו לניטרלי יותר?</li>
            <li>האם נתקלתם בתוכן דומה ברשתות חברתיות?</li>
          </ul>
        </div>

        <div className="text-center text-fire-400 text-sm mb-6">
          {isHost ? 'המארח ימשיך בעוד כמה שניות...' : 'ממתין למארח להמשיך...'}
        </div>

        {isHost && (
          <button
            onClick={handleNext}
            className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            המשך להשוואה
          </button>
        )}
      </div>
    </div>
  )
}

