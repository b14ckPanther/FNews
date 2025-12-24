import { NextResponse } from 'next/server'
import { analyzePost } from '@/lib/ai/geminiService'
import { calculateScore } from '@/lib/game/scoring'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { getServerFirestore } from '@/lib/firebase/serverConfig'
import { Game, Round, ManipulationTechnique } from '@/types/game'

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
      // Use a default fallback instead of failing completely
      console.warn('Using default fallback techniques due to missing correctTechniques')
      correctTechniques = ['emotional_language', 'false_dilemma'] as ManipulationTechnique[]
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
      // Use fallback analysis - analyzePost already handles generating neutral alternative in its catch block
      // But if it completely fails, create a basic one based on the topic
      console.warn('Using fallback analysis due to AI error')
      analysis = {
        correctTechniques,
        explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
        neutralAlternative: `דיון מאוזן על ${round.topic} מבוסס עובדות וללא מניפולציה רגשית.`,
        manipulationLevel: 50 + correctTechniques.length * 10,
        aiCommentary: 'מניפולציה מעניינת!',
      }
    }

    // Ensure correctTechniques is in the analysis (for consistency)
    analysis.correctTechniques = correctTechniques

    // Update round with analysis (use server-side Firestore directly)
    // Reuse gameRef that was already created above
    try {
      await updateDoc(gameRef, {
        [`rounds.${roundId}.aiAnalysis`]: analysis,
      })
    } catch (error) {
      console.error('Error updating round analysis:', error)
      // Don't throw - we still have the analysis object to return
      // The client can retry or use the fallback
      console.warn('Continuing despite update error - analysis will be returned but may not be persisted')
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

        // Get fresh game state to ensure we have the latest score
        const freshGameDoc = await getDoc(gameRef)
        if (!freshGameDoc.exists()) {
          console.error(`Game ${gameId} not found when updating score for player ${playerId}`)
          continue
        }
        const freshGame = freshGameDoc.data() as Game
        const currentScore = freshGame.players[playerId]?.score || 0
        const newScore = currentScore + score

        console.log(`Updating score for player ${playerId}:`, {
          playerTechniques: guess.techniques,
          correctTechniques: analysis.correctTechniques,
          correctCount: guess.techniques.filter(t => analysis.correctTechniques.includes(t)).length,
          incorrectCount: guess.techniques.filter(t => !analysis.correctTechniques.includes(t)).length,
          timeRemaining,
          roundScore: score,
          currentScore,
          newScore
        })

        // Update score directly using server Firestore
        await updateDoc(gameRef, {
          [`players.${playerId}.score`]: newScore,
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

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Error analyzing round:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', {
      gameId: gameId || 'unknown',
      roundId: roundId || 'unknown',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Try to provide a fallback analysis instead of completely failing
    try {
      const db = getServerFirestore()
      if (db && gameId && roundId) {
        const gameRef = doc(db, 'games', gameId)
        const gameDoc = await getDoc(gameRef)
        if (gameDoc.exists()) {
          const game = gameDoc.data() as Game
          const round = game.rounds[roundId]
          if (round) {
            const fallbackTechniques = round.correctTechniques || ['emotional_language', 'false_dilemma'] as ManipulationTechnique[]
            // Try to generate a proper neutral alternative using the fallback function
            let neutralAlternative = round.manipulativePost // Default to original if generation fails
            try {
              const { generateNeutralAlternativeFallback } = await import('@/lib/ai/geminiService')
              const generated = await generateNeutralAlternativeFallback(round.manipulativePost, round.topic)
              if (generated && generated.length > 20 && !generated.includes('דיון מאוזן על')) {
                neutralAlternative = generated
              }
            } catch (genError) {
              console.error('Failed to generate neutral alternative in catch block:', genError)
            }
            
            const fallbackAnalysis = {
              correctTechniques: fallbackTechniques,
              explanation: 'הפוסט משתמש בטכניקות מניפולציה רגשית להטיית הדעה',
              neutralAlternative,
              manipulationLevel: 50 + fallbackTechniques.length * 10,
              aiCommentary: 'מניפולציה מעניינת!',
            }
            
            try {
              await updateDoc(gameRef, {
                [`rounds.${roundId}.aiAnalysis`]: fallbackAnalysis,
              })
              return NextResponse.json({ success: true, analysis: fallbackAnalysis, fallback: true })
            } catch (updateError) {
              console.error('Failed to save fallback analysis:', updateError)
            }
          }
        }
      }
    } catch (fallbackError) {
      console.error('Failed to create fallback analysis:', fallbackError)
    }
    
    // If all else fails, return error but with a message that client can handle
    return NextResponse.json(
      { 
        error: 'Failed to analyze round',
        details: errorMessage,
        fallback: false
      },
      { status: 500 }
    )
  }
}

