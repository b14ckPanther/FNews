'use client'

import { useEffect, useState } from 'react'

interface IntroSequenceProps {
  onComplete: () => void
}

export default function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState<'title' | 'subtitle' | 'description' | 'credits' | 'complete'>('title')
  const [opacity, setOpacity] = useState(0)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    if (skipped) {
      onComplete()
      return
    }

    // Phase timings
    const timings: Record<string, { fadeIn: number; fadeOut: number; nextPhase?: IntroSequenceProps['onComplete'] extends () => void ? 'title' | 'subtitle' | 'description' | 'credits' | 'complete' : never }> = {
      title: { fadeIn: 300, fadeOut: 2500, nextPhase: 'subtitle' },
      subtitle: { fadeIn: 300, fadeOut: 2000, nextPhase: 'description' },
      description: { fadeIn: 300, fadeOut: 2500, nextPhase: 'credits' },
      credits: { fadeIn: 300, fadeOut: 2000, nextPhase: 'complete' },
    }

    const timing = timings[phase]
    if (!timing) return

    // Fade in
    setTimeout(() => setOpacity(1), timing.fadeIn)

    // Hold
    const holdDuration = timing.fadeOut - timing.fadeIn

    // Fade out and transition
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0)
      setTimeout(() => {
        if (timing.nextPhase === 'complete') {
          onComplete()
        } else {
          setPhase(timing.nextPhase as typeof phase)
        }
      }, 500)
    }, timing.fadeIn + holdDuration)

    return () => clearTimeout(fadeOutTimer)
  }, [phase, skipped, onComplete])

  const handleSkip = () => {
    setSkipped(true)
    onComplete()
  }

  const getContent = () => {
    switch (phase) {
      case 'title':
        return {
          main: 'Manipulation Factory',
          secondary: '',
        }
      case 'subtitle':
        return {
          main: 'Manipulation Factory',
          secondary: 'Interactive Prebunking Experience',
        }
      case 'description':
        return {
          main: 'Manipulation Factory',
          secondary: 'חוויית הכשרה אינטראקטיבית לזיהוי טכניקות מניפולציה רטורית',
          tertiary: 'דרך משחק, הומור ובינה מלאכותית',
        }
      case 'credits':
        return {
          main: 'A collaborative project by',
          secondary: 'Mahmud Mokary & Abdelkarim Khalil',
        }
      default:
        return { main: '', secondary: '' }
    }
  }

  const content = getContent()

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      dir="ltr"
    >
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-fire-400 hover:text-fire-300 transition-colors text-sm uppercase tracking-wider"
      >
        Skip
      </button>

      <div
        className="text-center transition-opacity duration-500"
        style={{ opacity }}
      >
        {phase === 'description' ? (
          <div dir="rtl" className="max-w-2xl mx-auto px-6">
            <h1 className="text-5xl md:text-7xl font-bold text-fire-500 mb-6">
              {content.main}
            </h1>
            <p className="text-xl md:text-2xl text-fire-300 mb-4">
              {content.secondary}
            </p>
            <p className="text-lg md:text-xl text-fire-400">
              {content.tertiary}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6">
            <h1 className="text-5xl md:text-7xl font-bold text-fire-500 mb-6">
              {content.main}
            </h1>
            {content.secondary && (
              <p className="text-xl md:text-2xl text-fire-300">
                {content.secondary}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

