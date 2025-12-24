'use client'

import { useEffect, useState } from 'react'
import IntroSequence from '@/components/IntroSequence'
import LobbyScreen from '@/components/LobbyScreen'

export default function Home() {
  const [showIntro, setShowIntro] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenIntro = localStorage.getItem('manipulation-factory-intro')
      setShowIntro(!hasSeenIntro)
    }
  }, [])

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('manipulation-factory-intro', 'true')
    }
    setShowIntro(false)
  }

  if (showIntro) {
    return <IntroSequence onComplete={handleIntroComplete} />
  }

  return <LobbyScreen />
}

