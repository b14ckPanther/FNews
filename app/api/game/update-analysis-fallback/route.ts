import { NextResponse } from 'next/server'
import { updateRoundAnalysis } from '@/lib/firebase/gameService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, roundId, analysis } = body

    await updateRoundAnalysis(gameId, roundId, analysis)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating fallback analysis:', error)
    return NextResponse.json(
      { error: 'Failed to update analysis' },
      { status: 500 }
    )
  }
}

