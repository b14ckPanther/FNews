import { NextResponse } from 'next/server'
import {
  updateRoundAnalysis,
  updatePlayerScore,
  submitGuess,
} from '@/lib/firebase/gameService'
import { analyzePost } from '@/lib/ai/geminiService'
import { calculateScore } from '@/lib/game/scoring'
import { getDoc, doc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'
import { Game, Round } from '@/types/game'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, roundId } = body as { gameId: string; roundId: string }

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
    const round = game.rounds[roundId]

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    // Get correct techniques from round (stored separately)
    const correctTechniques = round.aiAnalysis?.correctTechniques || []
    
    if (correctTechniques.length === 0) {
      return NextResponse.json(
        { error: 'Correct techniques not found' },
        { status: 400 }
      )
    }

    // Analyze the post
    const analysis = await analyzePost(
      round.manipulativePost,
      round.topic,
      correctTechniques
    )

    // Update round with analysis
    await updateRoundAnalysis(gameId, roundId, analysis)

    // Calculate scores for all players
    const totalTime = 60000 // 60 seconds
    const playerGuesses = round.playerGuesses

    for (const [playerId, guess] of Object.entries(playerGuesses)) {
      if (game.players[playerId]?.isAI) continue

      const timeRemaining = round.guessingEndsAt
        ? Math.max(0, round.guessingEndsAt - guess.timestamp)
        : 0

      const score = calculateScore(
        guess.techniques,
        analysis.correctTechniques,
        timeRemaining,
        totalTime
      )

      await updatePlayerScore(gameId, playerId, score)
    }

    // Handle AI player guess if exists
    const aiPlayer = Object.values(game.players).find((p) => p.isAI)
    if (aiPlayer && playerGuesses[aiPlayer.id]) {
      const aiGuess = playerGuesses[aiPlayer.id]
      const timeRemaining = round.guessingEndsAt
        ? Math.max(0, round.guessingEndsAt - aiGuess.timestamp)
        : 0

      const score = calculateScore(
        aiGuess.techniques,
        analysis.correctTechniques,
        timeRemaining,
        totalTime
      )

      await updatePlayerScore(gameId, aiPlayer.id, score)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error analyzing round:', error)
    return NextResponse.json(
      { error: 'Failed to analyze round' },
      { status: 500 }
    )
  }
}

