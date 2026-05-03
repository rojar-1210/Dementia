# 🧠 Memory Care Assistant

A React Native (Expo) app for dementia patients and their caregivers.

## 📁 Project Structure

```
├── app/
│   ├── _layout.js          # Root layout with AuthProvider + routing
│   ├── index.js            # Splash screen
│   ├── (auth)/
│   │   ├── _layout.js
│   │   ├── login.js        # Login screen
│   │   └── signup.js       # Signup with role selection
│   └── (tabs)/
│       ├── _layout.js      # Bottom tab navigator
│       ├── dashboard.js    # Home screen
│       ├── reminders.js    # Smart reminders
│       ├── appointments.js # Doctor appointments
│       ├── emergency.js    # SOS emergency screen
│       ├── activities.js   # Memory games
│       └── caregiver.js    # Caregiver panel
├── config/
│   └── firebase.js         # Firebase config
├── services/
│   ├── authService.js      # Auth (login/signup/logout)
│   ├── firestoreService.js # DB operations
│   └── notificationService.js # Push notifications
├── hooks/
│   └── useAuth.js          # Auth context + hook
└── constants/
    └── theme.js            # Colors, fonts, spacing
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Copy your config into `config/firebase.js`

### 3. Firestore Collections (auto-created on first use)
- `users` — Patient & Caregiver profiles
- `reminders` — Scheduled reminders
- `appointments` — Doctor appointments
- `activityLogs` — Patient activity history

### 4. Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /reminders/{id} {
      allow read, write: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /appointments/{id} {
      allow read, write: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /activityLogs/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.data.uid == request.auth.uid;
    }
  }
}
```

### 5. Update Caregiver Phone Number
In `app/(tabs)/emergency.js`, update:
```js
const CAREGIVER_PHONE = '+1234567890'; // ← your caregiver's number
```

### 6. Run the App
```bash
npx expo start
```

## 📱 Features

| Feature | Screen |
|---|---|
| Login / Signup with roles | `(auth)/login`, `(auth)/signup` |
| Dashboard with today's info | `(tabs)/dashboard` |
| Smart reminders + notifications | `(tabs)/reminders` |
| Doctor appointments | `(tabs)/appointments` |
| SOS emergency button | `(tabs)/emergency` |
| Memory games & activities | `(tabs)/activities` |
| Caregiver monitoring panel | `(tabs)/caregiver` |

## 🎨 Design Principles
- Large fonts (16–40px) for easy reading
- High contrast colors
- Simple 5-tab navigation
- Icon-first UI
