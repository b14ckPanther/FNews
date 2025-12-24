import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

let serverApp: FirebaseApp | undefined
let serverDb: Firestore | undefined

export function getServerFirestore(): Firestore | undefined {
  if (typeof window !== 'undefined') {
    // Don't use this on client side
    return undefined
  }

  if (serverDb) {
    return serverDb
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase config missing for server-side operations')
    return undefined
  }

  try {
    if (!getApps().length) {
      serverApp = initializeApp(firebaseConfig)
    } else {
      serverApp = getApps()[0]
    }
    serverDb = getFirestore(serverApp)
    return serverDb
  } catch (error) {
    console.error('Error initializing server Firebase:', error)
    return undefined
  }
}

