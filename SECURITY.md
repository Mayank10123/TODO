# 🔒 Security Guide - Tabbie TO-DO App

## Current Security Architecture

### Frontend (Safe to expose)
- **VITE_FIREBASE_API_KEY** - Public browser key restricted to your domain in Firebase Console
- **Auth Domain, Project ID, etc.** - Configuration only (not secrets)

### Backend (NEVER expose)
- **FIREBASE_PRIVATE_KEY** - Service account private key
- **FIREBASE_CLIENT_EMAIL** - Service account email
- **API Tokens & Session Keys** - Vercel environment only

---

## ⚠️ CRITICAL SECURITY RULES

### 1. **Environment Variables**
```
✅ DO: Set backend secrets in Vercel Dashboard
❌ DON'T: Put .env.local in git
❌ DON'T: Hardcode credentials in source files
❌ DON'T: Log sensitive data in browser console
```

### 2. **Frontend vs Backend**
```
Frontend Code (Browser - Public)
├── Only VITE_FIREBASE_* public keys
├── Only configuration values
└── API calls to your backend

Backend Code (Vercel - Private)
├── FIREBASE_PRIVATE_KEY
├── FIREBASE_CLIENT_EMAIL
├── Database credentials
└── API secrets
```

### 3. **Firebase API Key Security**
Your Firebase API key is restricted by:
- ✅ **Domain Whitelist** - Only works from your domain (set in Firebase Console)
- ✅ **API Restrictions** - Limited to specific APIs (set in API Console)
- ❌ Cannot create accounts (requires backend verification)
- ❌ Cannot access admin operations (requires Admin SDK)

**Your current key:** Restricted to production domain only ✓

---

## 🔐 Authentication Flow (Secure)

### Signup/Login Flow
```
User (Browser)
    ↓ [POST] /api/auth {email, password}
    ↓
Backend (Vercel)
    ├─ Validate email/password format
    ├─ Use Firebase Admin SDK (private key)
    ├─ Create user or verify credentials
    └─ Return session token (never expose ID token)
    ↓ [JSON Response] {sessionToken, user}
    ↓
Client Auth Context
    ├─ Store session token only
    ├─ Use token for API calls
    └─ Verify token on backend for user data
```

### Why This Is Secure
- ✅ Passwords never sent to frontend Firebase SDK
- ✅ Private keys never leave backend
- ✅ Frontend can't create fake authentication
- ✅ Session tokens scoped to specific user

---

## 📋 Checklist - Before Deploying to Production

### Local Development
- [ ] .env.local exists (never committed)
- [ ] .env.local in .gitignore (already configured)
- [ ] npm run dev works without errors
- [ ] Test signup/login/logout in browser

### Firebase Console
- [ ] Email/Password authentication enabled ✓
- [ ] Google OAuth configured ✓
- [ ] API Key domain restrictions set to your domain
- [ ] Enable Firestore with security rules

### Vercel Dashboard
- [ ] Set all FIREBASE_* environment variables
- [ ] Set FRONTEND_URL to your production domain
- [ ] Add all VITE_* variables for build
- [ ] Verify environment variables in deployment settings

### Security Settings
- [ ] CORS configured for your domain only (in auth.ts)
- [ ] No console.log with sensitive data (removed from firebase.ts)
- [ ] SSL/TLS enabled on Vercel (automatic ✓)
- [ ] All API endpoints require authentication header

### Firebase Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Prevent unauthorized access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚨 If You Exposed Your Private Key

If you accidentally committed `.env.local` or `firebase-key.json`:

1. **Immediately rotate your Firebase credentials:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Delete old key
   - Generate new private key
   - Update Vercel environment variables

2. **Update your git history:**
   ```bash
   # Remove file from git history
   git rm --cached .env.local
   git commit -m "Remove exposed env vars"
   ```

3. **Check git history for exposure:**
   ```bash
   git log --all -- .env.local
   ```

---

## 🔒 Environment Configuration

### .env.local (Local Development Only)
Save this file locally, NEVER commit it:
```env
# Public Firebase keys (see Firebase Console)
VITE_FIREBASE_API_KEY=your_public_key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... etc

# Backend only (NEVER share)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your-project-id
```

### Vercel Dashboard Environment Variables
Set these in Vercel project settings (Dashboard → Settings → Environment Variables):

```
VITE_FIREBASE_API_KEY = [your public key]
VITE_FIREBASE_AUTH_DOMAIN = [your domain]
VITE_FIREBASE_PROJECT_ID = [your project id]
VITE_FIREBASE_STORAGE_BUCKET = [your bucket]
VITE_FIREBASE_MESSAGING_SENDER_ID = [your sender id]
VITE_FIREBASE_APP_ID = [your app id]
VITE_FIREBASE_MEASUREMENT_ID = [your measurement id]

FIREBASE_PROJECT_ID = [your project id]
FIREBASE_CLIENT_EMAIL = [service account email]
FIREBASE_PRIVATE_KEY = [full private key with newlines]
FRONTEND_URL = https://yourdomain.com
```

---

## ✅ Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Firebase Config | ✅ Secure | Using env vars, no hardcoded keys |
| Backend Auth Endpoint | ✅ Created | /api/auth for signup/login |
| Session Tokens | ✅ Implemented | Custom tokens for frontend |
| CORS Protection | ✅ Configured | Domain-restricted |
| .gitignore | ✅ Complete | Blocks .env.local |
| Firebase Security Rules | 📝 Pending | Add to Firestore |

---

## 🔗 Additional Resources

- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/firestore/security/quickstart)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)

---

## 💡 Tips for Long-term Security

1. **Rotate credentials regularly** - Refresh keys every 90 days
2. **Monitor API usage** - Check Firebase Console for unusual activity
3. **Enable audit logs** - Set up Cloud Audit Logs in GCP Console
4. **Use secret management** - Consider services like 1Password/Vault for team
5. **Regular security audits** - Review access logs and permissions quarterly
6. **Keep dependencies updated** - Run `npm audit` weekly
