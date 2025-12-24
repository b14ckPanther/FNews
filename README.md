# Manipulation Factory

חוויית הכשרה אינטראקטיבית לזיהוי טכניקות מניפולציה רטורית דרך משחק, הומור ובינה מלאכותית.

An interactive multiplayer prebunking experience designed to train users in recognizing rhetorical manipulation techniques through humor, gameplay and AI-generated content.

## Overview

Manipulation Factory is a psychological inoculation system that builds long-term resistance to manipulation through experiential learning. Unlike fact-checking tools, this application focuses on identifying manipulation tactics rather than verifying facts, using neutral, educational examples from topics like coffee, studies, technology, animals, and weather.

## Features

- **Cinematic Introduction**: Elegant 5-7 second intro sequence on first load
- **Multiplayer Lobby**: Create or join games with 5-6 digit codes
- **Real-time Synchronization**: All players updated instantly via Firebase Firestore
- **AI-Generated Content**: Dynamic Hebrew manipulative posts using Google Gemini
- **Interactive Rounds**: Players identify manipulation techniques within time limits
- **Scoring System**: Points based on correctness and response speed
- **AI Player**: Participates as an additional player, sometimes making intentional mistakes
- **Manipulation Level**: Visual heat indicator (0-100) showing emotional influence intensity
- **Comparison Phase**: Side-by-side view of manipulative vs. neutral content
- **Live Leaderboard**: Real-time scoring between rounds
- **Full RTL Support**: Right-to-left layout for Hebrew interface

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (fire-based theme)
- **Backend**: Firebase Firestore (real-time database)
- **Authentication**: Firebase Anonymous Auth
- **AI**: Google Gemini API
- **Language**: Hebrew-first with RTL support

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Google Gemini API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual keys:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Anonymous Authentication:
   - Go to Authentication → Sign-in method
   - Enable Anonymous authentication
3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode (you'll need to set up security rules)
   - Create a collection named `games`

4. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Note: These are basic rules. For production, implement more restrictive rules based on player permissions and game state.

### Google Gemini API Setup

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the key to your `.env.local` file

### Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. **Start the App**: On first load, you'll see the cinematic intro (skippable, shown only once)

2. **Enter Lobby**:
   - Enter your display name
   - Click "התחבר והמשך" (Connect and Continue)

3. **Create or Join Game**:
   - **Create**: Click "צור משחק חדש" (Create New Game) to host
   - **Join**: Enter a 6-digit game code and click "הצטרף למשחק" (Join Game)

4. **Wait in Lobby**:
   - Host sees all players
   - When ready (minimum 2 players), host clicks "התחל משחק" (Start Game)

5. **Play Rounds**:
   - Each round shows an AI-generated manipulative post in Hebrew
   - Select which manipulation techniques you identify (2-4 techniques per post)
   - Submit your answer before time runs out (60 seconds)

6. **Reveal Phase**:
   - See correct techniques
   - View your score and "Manipulation Level" (0-100 heat indicator)
   - Read AI explanation and humorous commentary

7. **Comparison Phase**:
   - Compare manipulative version vs. neutral alternative
   - Reflect on which version triggered more emotion
   - View leaderboard

8. **Continue**:
   - Game consists of 5 rounds
   - After each round, proceed to the next
   - Final leaderboard shows winner

## Manipulation Techniques

The game identifies 8 types of rhetorical manipulation:

- **שפה רגשית** (Emotional Language): Using emotionally charged words
- **דילמה כוזבת** (False Dilemma): Presenting only two options when more exist
- **העברת אשמה** (Scapegoating): Blaming a specific target
- **התקפה אישית** (Ad Hominem): Attacking the person instead of the argument
- **אי עקביות** (Inconsistency): Contradictory statements or logic
- **פניה לסמכות** (Appeal to Authority): Citing authority without proper context
- **אפקט העדר** (Bandwagon): "Everyone is doing it" argument
- **מדרון חלקלק** (Slippery Slope): Extreme extrapolation of consequences

## Content Guidelines

- **Neutral Topics Only**: Coffee, studies, technology, animals, weather, sports, music, restaurants
- **No Political Content**: Real groups, conflicts, or controversial topics excluded
- **Educational Focus**: Examples designed for learning, not offense
- **Humor with Purpose**: Exaggerated but non-offensive manipulative content

## Project Structure

```
├── app/
│   ├── api/           # API routes for AI and game logic
│   ├── game/          # Game page routes
│   ├── layout.tsx     # Root layout with RTL support
│   ├── page.tsx       # Main entry point
│   └── globals.css    # Global styles
├── components/        # React components
│   ├── IntroSequence.tsx
│   ├── LobbyScreen.tsx
│   ├── GameLobby.tsx
│   ├── GameRound.tsx
│   ├── GuessingPhase.tsx
│   ├── RevealPhase.tsx
│   └── ComparisonPhase.tsx
├── lib/
│   ├── ai/           # Gemini AI service
│   ├── firebase/     # Firebase configuration and services
│   └── game/         # Game logic (scoring, etc.)
├── types/            # TypeScript type definitions
└── README.md
```

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Principles

This application is designed as a **psychological inoculation system**, not a trivia quiz or fact-checking tool. The focus is on:

- **Experiential Learning**: Learn by doing, not just reading
- **Humor**: Make learning engaging and memorable
- **Reflection**: Compare manipulative vs. neutral content
- **Group Interaction**: Real-time multiplayer experience
- **Long-term Resistance**: Build cognitive immunity to manipulation

## License

This is a collaborative project by Mahmud Mokary & Abdelkarim Khalil.

## Support

For issues or questions, please check the codebase documentation or create an issue in the repository.

