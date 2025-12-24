import { NextResponse } from 'next/server'
import { updateDoc, doc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'
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

    const db = getServerFirestore()
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      )
    }

    // Add some random delay to make AI feel more natural (1-3 seconds)
    const delay = Math.random() * 2000 + 1000
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Type assertion - validate techniques are valid ManipulationTechnique values
    const validTechniques = techniques.filter((t): t is ManipulationTechnique =>
      ['emotional_language', 'false_dilemma', 'scapegoating', 'ad_hominem', 'inconsistency', 'appeal_to_authority', 'bandwagon', 'slippery_slope'].includes(t)
    ) as ManipulationTechnique[]

    // Submit guess directly using server Firestore
    const gameRef = doc(db, 'games', gameId)
    await updateDoc(gameRef, {
      [`rounds.${roundId}.playerGuesses.${aiPlayerId}`]: {
        techniques: validTechniques,
        timestamp: Date.now(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting AI guess:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit AI guess',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

