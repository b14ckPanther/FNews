export type ManipulationTechnique =
  | 'emotional_language'
  | 'false_dilemma'
  | 'scapegoating'
  | 'ad_hominem'
  | 'inconsistency'
  | 'appeal_to_authority'
  | 'bandwagon'
  | 'slippery_slope'

export interface Player {
  id: string
  displayName: string
  isHost: boolean
  isAI: boolean
  score: number
  guesses?: {
    roundId: string
    techniques: ManipulationTechnique[]
    timestamp: number
  }[]
}

export interface AIAnalysis {
  correctTechniques: ManipulationTechnique[]
  explanation: string
  neutralAlternative: string
  manipulationLevel: number // 0-100
  aiCommentary: string
  aiPlayerGuess?: {
    techniques: ManipulationTechnique[]
    analysis: string
  }
}

export interface Round {
  id: string
  roundNumber: number
  topic: string
  manipulativePost: string
  correctTechniques: ManipulationTechnique[] // Stored when round is created
  aiAnalysis?: AIAnalysis
  playerGuesses: Record<string, {
    techniques: ManipulationTechnique[]
    timestamp: number
  }>
  phase: 'waiting' | 'guessing' | 'reveal' | 'comparison' | 'complete'
  startedAt?: number
  guessingEndsAt?: number
}

export interface Game {
  id: string
  code: string
  hostId: string
  status: 'lobby' | 'playing' | 'finished'
  currentRoundId?: string
  totalRounds: number
  currentRoundNumber: number
  createdAt: number
  players: Record<string, Player>
  rounds: Record<string, Round>
}

