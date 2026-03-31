# Tabbie - Personal Task Companion

A modern, feature-rich task management application built with React, TypeScript, and Firebase.

## Features

- 🔐 **Secure Authentication** - Firebase-based user authentication with custom tokens
- 📌 **Task Management** - Create, organize, and track your tasks with ease
- ⏲️ **Pomodoro Timer** - Built-in timer for focused work sessions
- 🎨 **Dark Mode** - Eye-friendly interface with automatic theme switching
- 📊 **Activity Tracking** - Monitor your productivity and task completion
- 🔄 **Real-time Sync** - Instant synchronization across devices
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Vercel Functions (Node.js) + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + Radix UI
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (get one free at [firebase.google.com](https://firebase.google.com))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tabbie
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Firebase credentials to `.env.local`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=/api
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Building for Production

```bash
npm run build
```

This command:
- Builds the TypeScript code
- Optimizes the React bundle with Vite
- Prepares Vercel Functions for deployment

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_MESSAGING_SENDER_ID`

4. Vercel will automatically build and deploy your app

## Project Structure

```
src/
  components/          # React components
    ui/               # Reusable UI components
    onboarding/       # Onboarding flow components
  contexts/           # React Context providers
  hooks/              # Custom React hooks
  lib/                # Utility functions
  services/           # API service layer
  config/             # Configuration files
  types/              # TypeScript types

api/
  auth.ts            # Authentication endpoint
  verify-token.ts    # Token verification
  user-data.ts       # User data operations
  firebase-admin.ts  # Firebase Admin SDK
```

## Security

- Authentication is handled server-side through Vercel Functions
- Private Firebase keys are never exposed to the frontend
- All API endpoints validate user tokens before processing
- CORS is configured to accept only trusted origins
- Passwords are never stored or logged

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.
    ...reactDom.configs.recommended.rules,
  },
})
```
