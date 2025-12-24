import { ManipulationTechnique } from '@/types/game'

export function calculateScore(
  playerTechniques: ManipulationTechnique[],
  correctTechniques: ManipulationTechnique[],
  timeRemaining: number,
  totalTime: number
): number {
  const correctCount = playerTechniques.filter((t) =>
    correctTechniques.includes(t)
  ).length
  const incorrectCount = playerTechniques.filter(
    (t) => !correctTechniques.includes(t)
  ).length

  // Base score: 15 points per correct technique (increased to reward partial correctness)
  let score = correctCount * 15

  // Bonus for identifying all techniques correctly
  if (
    correctCount === correctTechniques.length &&
    incorrectCount === 0
  ) {
    score += 30 // Increased bonus for perfect answer
  }

  // Speed bonus: up to 15 points based on how fast they answered
  const timeRatio = Math.max(0, timeRemaining / totalTime)
  const speedBonus = Math.floor(timeRatio * 15)
  score += speedBonus

  // Reduced penalty for incorrect guesses: -3 points per wrong technique (was -5)
  // This allows partial credit to still result in positive scores
  score -= incorrectCount * 3

  // Ensure minimum score of 0, but allow partial credit to show
  return Math.max(0, score)
}

