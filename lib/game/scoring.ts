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

  // Base score: 10 points per correct technique
  let score = correctCount * 10

  // Bonus for identifying all techniques correctly
  if (
    correctCount === correctTechniques.length &&
    incorrectCount === 0
  ) {
    score += 20
  }

  // Speed bonus: up to 10 points based on how fast they answered
  const timeRatio = Math.max(0, timeRemaining / totalTime)
  const speedBonus = Math.floor(timeRatio * 10)
  score += speedBonus

  // Penalty for incorrect guesses: -5 points per wrong technique
  score -= incorrectCount * 5

  return Math.max(0, score)
}

