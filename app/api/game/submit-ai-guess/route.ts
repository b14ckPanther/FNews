import { NextResponse } from 'next/server'
import { submitGuess } from '@/lib/firebase/gameService'
import { ManipulationTechnique } from '@/types/game'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, roundId, aiPlayerId, techniques } = body as {
      gameId: string
      roundId: string
      aiPlayerId: string
      techniques: string[]
    }

    // Add some random delay to make AI feel more natural (1-3 seconds)
    const delay = Math.random() * 2000 + 1000
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Type assertion - validate techniques are valid ManipulationTechnique values
    const validTechniques = techniques.filter((t): t is ManipulationTechnique =>
      ['emotional_language', 'false_dilemma', 'scapegoating', 'ad_hominem', 'inconsistency', 'appeal_to_authority', 'bandwagon', 'slippery_slope'].includes(t)
    ) as ManipulationTechnique[]

    await submitGuess(gameId, roundId, aiPlayerId, validTechniques)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting AI guess:', error)
    return NextResponse.json(
      { error: 'Failed to submit AI guess' },
      { status: 500 }
    )
  }
}

