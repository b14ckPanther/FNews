import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import { Game, Round, Player, ManipulationTechnique } from '@/types/game'

const GAMES_COLLECTION = 'games'

export async function createGame(hostId: string, hostName: string): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized. Please configure Firebase in .env.local')
  }
  const code = generateGameCode()
  const gameRef = doc(collection(db, GAMES_COLLECTION))
  const gameId = gameRef.id

  const game: Game = {
    id: gameId,
    code,
    hostId,
    status: 'lobby',
    totalRounds: 10,
    currentRoundNumber: 0,
    createdAt: Date.now(),
    players: {
      [hostId]: {
        id: hostId,
        displayName: hostName,
        isHost: true,
        isAI: false,
        score: 0,
      },
    },
    rounds: {},
  }

  await setDoc(gameRef, game)
  return gameId
}

export async function joinGame(
  gameCode: string,
  playerId: string,
  playerName: string
): Promise<string | null> {
  if (!db) {
    throw new Error('Firestore is not initialized. Please configure Firebase in .env.local')
  }
  
  try {
    const gamesRef = collection(db, GAMES_COLLECTION)
    const q = query(gamesRef, where('code', '==', gameCode))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No game found with code: ${gameCode}`)
      return null
    }

    // Get the most recent game (by createdAt) in case of duplicate codes
    let gameDoc = querySnapshot.docs[0]
    let latestGame = gameDoc.data() as Game
    
    if (querySnapshot.docs.length > 1) {
      // Find the most recent game (highest createdAt)
      querySnapshot.docs.forEach((doc) => {
        const game = doc.data() as Game
        if (game.createdAt > latestGame.createdAt) {
          gameDoc = doc
          latestGame = game
        }
      })
    }

    const gameData = latestGame

    // Only allow joining if game is in lobby status
    if (gameData.status !== 'lobby') {
      console.log(`Game ${gameDoc.id} status is ${gameData.status}, not lobby`)
      return null
    }

    // Check if player already exists in game
    if (gameData.players[playerId]) {
      console.log(`Player ${playerId} already in game`)
      return gameDoc.id
    }

    const gameRef = doc(db, GAMES_COLLECTION, gameDoc.id)
    await updateDoc(gameRef, {
      [`players.${playerId}`]: {
        id: playerId,
        displayName: playerName,
        isHost: false,
        isAI: false,
        score: 0,
      },
    })

    return gameDoc.id
  } catch (error) {
    console.error('Error in joinGame:', error)
    throw error
  }
}

export function subscribeToGame(
  gameId: string,
  callback: (game: Game | null) => void
): () => void {
  if (!db) {
    console.error('Firestore is not initialized')
    callback(null)
    return () => {}
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)

  return onSnapshot(
    gameRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Game)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error subscribing to game:', error)
      callback(null)
    }
  )
}

export async function startGame(gameId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  await updateDoc(gameRef, {
    status: 'playing',
    currentRoundNumber: 1,
  })
}

export async function createRound(
  gameId: string,
  roundNumber: number,
  topic: string,
  manipulativePost: string,
  correctTechniques: ManipulationTechnique[]
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  const roundId = `round-${roundNumber}`

  const round: Round = {
    id: roundId,
    roundNumber,
    topic,
    manipulativePost,
    correctTechniques,
    playerGuesses: {},
    phase: 'waiting',
  }

  await updateDoc(gameRef, {
    [`rounds.${roundId}`]: round,
    currentRoundId: roundId,
  })

  return roundId
}

export async function updateRoundPhase(
  gameId: string,
  roundId: string,
  phase: Round['phase'],
  guessingEndsAt?: number
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  const updateData: any = {
    [`rounds.${roundId}.phase`]: phase,
    [`rounds.${roundId}.startedAt`]: Date.now(),
  }

  if (guessingEndsAt) {
    updateData[`rounds.${roundId}.guessingEndsAt`] = guessingEndsAt
  }

  await updateDoc(gameRef, updateData)
}

export async function submitGuess(
  gameId: string,
  roundId: string,
  playerId: string,
  techniques: ManipulationTechnique[]
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  await updateDoc(gameRef, {
    [`rounds.${roundId}.playerGuesses.${playerId}`]: {
      techniques,
      timestamp: Date.now(),
    },
  })
}

export async function updateRoundAnalysis(
  gameId: string,
  roundId: string,
  analysis: any
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  await updateDoc(gameRef, {
    [`rounds.${roundId}.aiAnalysis`]: analysis,
  })
}

export async function updatePlayerScore(
  gameId: string,
  playerId: string,
  scoreDelta: number
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  const gameDoc = await getDoc(gameRef)
  if (!gameDoc.exists()) return

  const game = gameDoc.data() as Game
  const currentScore = game.players[playerId]?.score || 0
  await updateDoc(gameRef, {
    [`players.${playerId}.score`]: currentScore + scoreDelta,
  })
}

export async function incrementRoundNumber(gameId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  const gameRef = doc(db, GAMES_COLLECTION, gameId)
  const gameDoc = await getDoc(gameRef)
  if (!gameDoc.exists()) return

  const game = gameDoc.data() as Game
  await updateDoc(gameRef, {
    currentRoundNumber: game.currentRoundNumber + 1,
  })
}

function generateGameCode(): string {
  return '051097'
}

