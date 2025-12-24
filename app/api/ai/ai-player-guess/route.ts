import { NextResponse } from 'next/server'
import { generateAIPlayerGuess } from '@/lib/ai/geminiService'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { post, topic, shouldMakeMistake } = body as {
      post: string
      topic: string
      shouldMakeMistake: boolean
    }

    const guess = await generateAIPlayerGuess(post, topic, shouldMakeMistake)
    return NextResponse.json(guess)
  } catch (error) {
    console.error('Error generating AI player guess:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI player guess' },
      { status: 500 }
    )
  }
}

