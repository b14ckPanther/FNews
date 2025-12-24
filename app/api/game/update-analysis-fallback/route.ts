import { NextResponse } from 'next/server'
import { updateDoc, doc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, roundId, analysis } = body

    const db = getServerFirestore()
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      )
    }

    const gameRef = doc(db, 'games', gameId)
    await updateDoc(gameRef, {
      [`rounds.${roundId}.aiAnalysis`]: analysis,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating fallback analysis:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

