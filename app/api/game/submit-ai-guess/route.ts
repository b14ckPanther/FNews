import { NextResponse } from 'next/server'
import { submitGuess } from '@/lib/firebase/gameService'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Game, Round } from '@/types/game'

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

    await submitGuess(gameId, roundId, aiPlayerId, techniques)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting AI guess:', error)
    return NextResponse.json(
      { error: 'Failed to submit AI guess' },
      { status: 500 }
    )
  }
}

