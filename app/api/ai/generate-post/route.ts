import { NextResponse } from 'next/server'
import { generateManipulativePost } from '@/lib/ai/geminiService'

export async function POST() {
  try {
    const result = await generateManipulativePost()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating post:', error)
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    )
  }
}

