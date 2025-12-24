import { NextResponse } from 'next/server'
import { updateDoc, doc, getDoc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'
import { Game } from '@/types/game'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId } = body as { gameId: string }

    const db = getServerFirestore()
    if (!db) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      )
    }
    const gameRef = doc(db, 'games', gameId)
    const gameDoc = await getDoc(gameRef)
    if (!gameDoc.exists()) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const game = gameDoc.data() as Game

    // Check if AI player already exists
    const existingAI = Object.values(game.players).find((p) => p.isAI)
    if (existingAI) {
      return NextResponse.json({ success: true, aiPlayerId: existingAI.id })
    }

    // Create AI player
    const aiPlayerId = `ai-${Date.now()}`
    await updateDoc(gameRef, {
      [`players.${aiPlayerId}`]: {
        id: aiPlayerId,
        displayName: 'בינה מלאכותית',
        isHost: false,
        isAI: true,
        score: 0,
      },
    })

    return NextResponse.json({ success: true, aiPlayerId })
  } catch (error) {
    console.error('Error adding AI player:', error)
    return NextResponse.json(
      { error: 'Failed to add AI player' },
      { status: 500 }
    )
  }
}

