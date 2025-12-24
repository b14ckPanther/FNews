import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth'
import { auth } from './config'

export async function signInAnonymous(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please configure Firebase in .env.local')
  }
  const userCredential = await signInAnonymously(auth)
  return userCredential.user
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    // Return a no-op unsubscribe function if auth is not initialized
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized')
  }
  await signOut(auth)
}

