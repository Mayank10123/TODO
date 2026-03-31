# Vercel Deployment Guide

This document explains how to deploy **Tabbie** to Vercel.

## Prerequisites

- GitHub account with the repository pushed
- Firebase project with authentication enabled
- Vercel account (free at [vercel.com](https://vercel.com))

## Step 1: Prepare Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable **Email/Password Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"

4. Get your **Web API credentials**:
   - Project Settings → Your apps → Select your web app
   - Copy the config object with `apiKey`, `authDomain`, `projectId`, etc.

5. Get your **Service Account credentials** (for backend):
   - Project Settings → Service Accounts → Node.js
   - Click "Generate New Private Key"
   - Save the JSON file (contains `projectId`, `clientEmail`, `privateKey`)

## Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select "Import Git Repository"
3. Choose your GitHub repository
4. Click "Import"

## Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

### Frontend Variables (Public - visible in browser)
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:your_app_id:web:your_web_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID
```

### Backend Variables (Private - Server only)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
VITE_API_URL=/api
```

⚠️ **Important**: Make sure `FIREBASE_PRIVATE_KEY` has proper newlines. If copying from JSON, the `\n` should be actual newlines in the value.

## Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically:
   - Install dependencies
   - Run `npm run build`
   - Deploy frontend to Vercel CDN
   - Deploy API functions
   - Set up auto-scaling

## Step 5: Verify

1. Visit your deployment at `https://your-project.vercel.app`
2. Try signing up with an email
3. Check Vercel's **Functions** tab to see backend logs
4. Monitor real-time logs in Vercel dashboard

## Troubleshooting

### "Firebase credentials not found"
- Check that `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are set in Vercel dashboard
- Redeploy after adding variables

### CORS errors
- The CORS is automatically allowed from your Vercel domain
- Make sure frontend and backend are on the same deployment

### Private key format error
- Ensure newlines in `FIREBASE_PRIVATE_KEY` are proper newlines, not literal `\n`
- The key should start with `-----BEGIN PRIVATE KEY-----`

### Build fails with TypeScript errors
- Run `npm run build` locally to debug
- Check tsconfig.json for compilation settings

## Auto-Deployments

Every push to your main branch will automatically:
1. Run tests (if any)
2. Build the project
3. Deploy to preview URL (if branch)
4. Deploy to production (if main branch)

## Scaling

Vercel automatically handles:
- ✅ Request scaling (automatic)
- ✅ Function execution time (30 seconds max)
- ✅ Cold start optimization
- ✅ Global CDN distribution

## Cost

- **Frontend hosting**: Usually free tier covers most usage
- **API functions**: 1 million invocations free per month
- **Bandwidth**: Free tier includes 100GB bandwidth

See [vercel.com/pricing](https://vercel.com/pricing) for details.

## Security Best Practices

1. ✅ Never commit `.env.local` to git
2. ✅ Use Vercel dashboard for sensitive variables
3. ✅ Enable "Require HTTPS" in Vercel settings
4. ✅ Monitor function logs for suspicious activity
5. ✅ Rotate Firebase private keys periodically

## Support

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- GitHub: https://github.com/yourusername/tabbie
