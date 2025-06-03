# Firebase Setup Instructions

## 1. Firestore Security Rules

Copy the contents of `firestore.rules` to your Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lifeweavers-aa9f2`
3. Navigate to Firestore Database > Rules
4. Replace the existing rules with the content from `firestore.rules`
5. Click "Publish"

## 2. Firestore Indexes ⚠️ **CRITICAL**

The application uses complex queries that require composite indexes. You MUST create these indexes for the app to work properly.

### Method 1: Automatic Creation (Recommended)
1. **Run the application** and use each feature
2. **Firebase will show error messages** with direct links to create indexes
3. **Click the links** in the error messages to auto-create indexes
4. **Wait for indexes to build** (usually takes 2-10 minutes)

### Method 2: Manual Creation
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lifeweavers-aa9f2`
3. Navigate to **Firestore Database** → **Indexes**
4. Click **"Create Index"**
5. Create each index from the list below

### Method 3: Firebase CLI (Advanced)
```bash
firebase deploy --only firestore:indexes
```

### Required Composite Indexes:

#### **Message System** (URGENT - Fixes current error)
- **Collection**: `messageThreads`
  - `participantIds` (Array)
  - `lastMessageTimestamp` (Descending)

- **Collection**: `messages`
  - `threadId` (Ascending)
  - `timestamp` (Ascending)

#### **Client Management**
- **Collection**: `clients`
  - `teamMemberIds` (Array)
  - `dateAdded` (Descending)

#### **Session Notes**
- **Collection**: `sessions`
  - `clientId` (Ascending) + `dateOfSession` (Descending)
  - `attendingClinicianId` (Ascending) + `dateOfSession` (Descending)

#### **Task Management**
- **Collection**: `tasks`
  - `clientId` (Ascending) + `createdAt` (Descending)
  - `assignedToUserIds` (Array) + `createdAt` (Descending)
  - `assignedToUserIds` (Array) + `isDone` (Ascending) + `createdAt` (Descending)

#### **Knowledge Base**
- **Collection**: `knowledgeBase`
  - `isPublished` (Ascending) + `updatedAt` (Descending)
  - `authorId` (Ascending) + `updatedAt` (Descending)

#### **Resources**
- **Collection**: `resources`
  - `isPublished` (Ascending) + `updatedAt` (Descending)
  - `authorId` (Ascending) + `updatedAt` (Descending)
  - `resourceType` (Ascending) + `updatedAt` (Descending)
  - `resourceType` (Ascending) + `isPublished` (Ascending) + `updatedAt` (Descending)

### Single Field Indexes (Auto-created):
- `notifications` collection: `timestamp` (descending)
- `users` collection: `name` (ascending)

## 3. Database Initialization

The application will automatically prompt you to initialize the database with default data when you first run it.

### Default Users Created:
- **Super Admin**: superadmin@lifeweaver.com
- **Admin**: admin@lifeweaver.com
- **Clinician**: clinician@lifeweaver.com
- **Clinician 2**: clinician2@lifeweaver.com
- **New User 1**: new.user1@example.com
- **New User 2**: new.user2@example.com

### Default Notifications Created:
- Welcome message (admin_broadcast)
- System maintenance notice (admin_broadcast)
- New feature announcement (admin_broadcast)
- Password policy update (system_update)

## 4. Authentication Setup

For production use, you'll want to set up proper authentication:

1. Go to Firebase Console > Authentication
2. Enable your preferred sign-in methods
3. Update the application to use Firebase Auth instead of mock authentication

## 5. Environment Variables

Make sure your Firebase configuration is properly set in `src/lib/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Testing

1. Start the application: `npm run dev`
2. Navigate to `http://localhost:9002`
3. The Firebase Initializer will prompt you to set up the database
4. Click "Initialize Database" to populate with default data
5. Test user management and notifications functionality

## Troubleshooting

### Index Errors
If you see index-related errors, the application now uses client-side filtering to avoid complex composite indexes. The errors should be resolved.

### Permission Errors
Make sure the Firestore security rules are properly deployed and allow read/write access for authenticated users.

### Connection Issues
Verify your Firebase configuration and ensure the project ID matches your actual Firebase project.
