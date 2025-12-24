import { NextResponse } from 'next/server'
import { analyzePost } from '@/lib/ai/geminiService'
import { calculateScore } from '@/lib/game/scoring'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'
import { Game, Round } from '@/types/game'

export async function POST(request: Request) {
  let gameId: string | undefined
  let roundId: string | undefined
  
  try {
    const body = await request.json()
    gameId = body.gameId as string
    roundId = body.roundId as string

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

    // Get correct techniques from round (stored when round was created)
    // Handle backwards compatibility: check both new location and old location
    let correctTechniques = round.correctTechniques || []
    
    // Fallback: check old location in aiAnalysis (for backwards compatibility)
    if (correctTechniques.length === 0 && round.aiAnalysis?.correctTechniques) {
      correctTechniques = round.aiAnalysis.correctTechniques
    }
    
    if (correctTechniques.length === 0) {
      console.error('No correct techniques found for round:', roundId, 'Round data:', JSON.stringify(round, null, 2))
      return NextResponse.json(
        { error: 'Correct techniques not found in round' },
        { status: 400 }
      )
    }

    // Analyze the post
    let analysis
    try {
      analysis = await analyzePost(
        round.manipulativePost,
        round.topic,
        correctTechniques
      )
    } catch (error) {
      console.error('Error calling analyzePost:', error)
      // Use fallback analysis instead of failing completely
      console.warn('Using fallback analysis due to AI error')
      analysis = {
        correctTechniques,
        explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
        neutralAlternative: 'גרסה ניטרלית של התוכן ללא מניפולציה',
        manipulationLevel: 50 + correctTechniques.length * 10,
        aiCommentary: 'מניפולציה מעניינת!',
      }
    }

    // Ensure correctTechniques is in the analysis (for consistency)
    analysis.correctTechniques = correctTechniques

    // Update round with analysis (use server-side Firestore directly)
    const gameRef = doc(db, 'games', gameId)
    try {
      await updateDoc(gameRef, {
        [`rounds.${roundId}.aiAnalysis`]: analysis,
      })
    } catch (error) {
      console.error('Error updating round analysis:', error)
      throw new Error(`Failed to update round analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Calculate scores for all players
    const totalTime = 60000 // 60 seconds
    const playerGuesses = round.playerGuesses

    // Calculate and update scores using server-side Firestore
    const gameDocAfter = await getDoc(gameRef)
    if (!gameDocAfter.exists()) {
      throw new Error('Game not found after analysis')
    }
    const currentGame = gameDocAfter.data() as Game

    for (const [playerId, guess] of Object.entries(playerGuesses)) {
      if (game.players[playerId]?.isAI) continue

      try {
        const timeRemaining = round.guessingEndsAt
          ? Math.max(0, round.guessingEndsAt - guess.timestamp)
          : 0

        const score = calculateScore(
          guess.techniques,
          analysis.correctTechniques,
          timeRemaining,
          totalTime
        )

        // Update score directly using server Firestore
        const currentScore = currentGame.players[playerId]?.score || 0
        await updateDoc(gameRef, {
          [`players.${playerId}.score`]: currentScore + score,
        })
      } catch (error) {
        console.error(`Error calculating score for player ${playerId}:`, error)
        // Continue with other players even if one fails
      }
    }

    // Handle AI player guess if exists
    const aiPlayer = Object.values(game.players).find((p) => p.isAI)
    if (aiPlayer && playerGuesses[aiPlayer.id]) {
      try {
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

        // Update AI score directly using server Firestore
        const currentScore = currentGame.players[aiPlayer.id]?.score || 0
        await updateDoc(gameRef, {
          [`players.${aiPlayer.id}.score`]: currentScore + score,
        })
      } catch (error) {
        console.error(`Error calculating score for AI player:`, error)
        // Continue even if AI score calculation fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error analyzing round:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', {
      gameId: gameId || 'unknown',
      roundId: roundId || 'unknown',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to analyze round',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

