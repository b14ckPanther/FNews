import { NextResponse } from 'next/server'
import { updateDoc, doc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'
import { ManipulationTechnique } from '@/types/game'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, roundId, techniques } = body as {
      gameId: string
      roundId: string
      techniques: ManipulationTechnique[]
    }

    const db = getServerFirestore()
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      )
    }
    const gameRef = doc(db, 'games', gameId)
    await updateDoc(gameRef, {
      [`rounds.${roundId}.aiAnalysis.correctTechniques`]: techniques,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing round techniques:', error)
    return NextResponse.json(
      { error: 'Failed to store techniques' },
      { status: 500 }
    )
  }
}

