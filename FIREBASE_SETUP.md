# Firebase Setup Guide

## 1. Install Firebase Packages

```bash
npm install firebase
# or
yarn add firebase
```

## 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it: `sourdough-tracker`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 3. Set Up Firestore Database

1. In your Firebase project, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for now)
4. Select a location (choose closest to you)
5. Click "Enable"

## 4. Get Firebase Configuration

1. Go to Project Settings (gear icon ⚙️)
2. Scroll down to "Firebase SDK snippet"
3. Copy the config object
4. Update the `firebaseConfig` in `src/utils/firebaseStorage.ts`

## 5. Update Firebase Config

Replace the placeholder config in `src/utils/firebaseStorage.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Security Rules (Important!)

Go to Firestore → Rules and update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Integration Options

### Option A: Use Firebase as Primary Storage
- Replace localStorage calls with Firebase
- Data syncs automatically across devices
- Requires internet connection

### Option B: Hybrid Approach (Recommended)
- Keep localStorage for offline use
- Add sync buttons to backup/restore from Firebase
- Best of both worlds

### Option C: Firebase as Backup Only
- Use localStorage normally
- Periodically backup to Firebase
- Manual restore when needed

## 8. Next Steps

After setup, I can help you:

1. **Create Firebase hooks** - Replace useStorage with Firebase version
2. **Add sync UI** - Buttons to sync data
3. **Handle offline mode** - Graceful fallback when offline
4. **Real-time updates** - Live sync across multiple tabs/devices

## Benefits of Firebase

✅ **Automatic sync** across devices  
✅ **Real-time updates**  
✅ **Offline support** (with caching)  
✅ **No server maintenance**  
✅ **Free tier** (1GB storage, 50k reads/day)  
✅ **User authentication** built-in  
✅ **Data security** with rules  

## Costs

Free tier includes:
- 1GB storage
- 50k document reads/day
- 20k document writes/day
- 20k document deletes/day

This should be more than enough for personal use!
