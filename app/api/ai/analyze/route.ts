import { NextResponse } from 'next/server'
import { analyzePost } from '@/lib/ai/geminiService'
import { ManipulationTechnique } from '@/types/game'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { post, topic, techniques } = body as {
      post: string
      topic: string
      techniques: ManipulationTechnique[]
    }

    const analysis = await analyzePost(post, topic, techniques)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing post:', error)
    return NextResponse.json(
      { error: 'Failed to analyze post' },
      { status: 500 }
    )
  }
}

