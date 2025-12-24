'use client'

import { useRouter } from 'next/navigation'

export default function LobbyScreen() {
  const router = useRouter()

  const handleGoToAdmin = () => {
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-fire-500 mb-4">
            Manipulation Factory
          </h1>
          <p className="text-fire-300 text-lg mb-8">
            חוויית הכשרה אינטראקטיבית לזיהוי מניפולציה
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoToAdmin}
            className="w-full bg-fire-600 hover:bg-fire-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            התחבר כמנהל
          </button>
        </div>
      </div>
    </div>
  )
}

