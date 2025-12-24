# Deployment Guide

## Vercel Deployment

### Prerequisites
- GitHub repository set up
- Vercel account (free tier works)

### Steps

1. **Push to GitHub**
   ```bash
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables and add:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_GEMINI_API_KEY`

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Or click "Deploy" button

5. **Firebase Configuration**
   - Make sure Firebase allows your Vercel domain
   - Update Firebase Console → Authentication → Authorized domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

## Important Notes

- ✅ `.env.local` is in `.gitignore` - never commit secrets
- ✅ Use Vercel Environment Variables for production
- ✅ All `NEXT_PUBLIC_*` variables are exposed to client-side (by design)
- ✅ Firebase API keys are safe to expose (they're protected by security rules)

