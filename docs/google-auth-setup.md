# Google Authentication Setup Guide

This guide will help you set up Google Authentication for your LWV CLINIC E-DOC application using Firebase Authentication.

## 🔥 Firebase Console Setup

### Step 1: Enable Google Authentication

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/lifeweavers-aa9f2/authentication/providers
   - Or navigate: Firebase Console → Your Project → Authentication → Sign-in method

2. **Enable Google Provider**
   - Click on "Google" in the Sign-in providers list
   - Toggle "Enable" to ON
   - Enter your project's support email
   - Click "Save"

### Step 2: Configure OAuth Consent Screen

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials/consent
   - Make sure you're in the correct project (lifeweavers-aa9f2)

2. **Configure OAuth Consent Screen**
   - Choose "External" user type (for public access)
   - Fill in required fields:
     - App name: "LWV CLINIC E-DOC"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed

### Step 3: Configure Authorized Domains

1. **In Firebase Console**
   - Go to Authentication → Settings → Authorized domains
   - Add your domains:
     - `localhost` (for development)
     - Your production domain (e.g., `your-app.com`)

## 🔧 Application Integration

### Features Implemented

✅ **Google Sign-in Button Component**
- Located: `src/components/auth/GoogleSignInButton.tsx`
- Supports both popup and redirect methods
- Includes proper loading states and error handling

✅ **Authentication Context Integration**
- Added `loginWithGoogle()` method to AuthContext
- Handles user creation for new Google users
- Maintains session consistency with existing auth system

✅ **Login Form Integration**
- Google sign-in button added to login page
- Proper separation between email/password and Google auth
- Responsive design with "Or continue with" divider

✅ **Direct Firebase Console Configuration**
- Configure Google Auth directly in Firebase Console
- Manual setup through Google Cloud Console for OAuth consent
- Test authentication through login page

### Code Structure

```
src/
├── lib/firebase/
│   └── googleAuth.ts          # Google Auth implementation
├── components/auth/
│   ├── GoogleSignInButton.tsx # Reusable Google sign-in button
│   └── LoginForm.tsx          # Updated with Google auth
├── components/admin/
│   └── (Firebase UI components removed)
└── contexts/
    └── AuthContext.tsx        # Updated with Google auth methods
```

## 🚀 How It Works

### User Flow

1. **New Google User**
   - User clicks "Continue with Google"
   - Google OAuth popup/redirect opens
   - User authorizes the application
   - New user account created in Firestore with role "Clinician"
   - User logged in and redirected to dashboard

2. **Existing Google User**
   - Same OAuth flow
   - User matched by email in Firestore
   - Existing user data loaded
   - User logged in with existing role/permissions

### Security Features

- ✅ Email verification through Google
- ✅ Secure token handling via Firebase
- ✅ Role-based access control maintained
- ✅ Session management consistent with existing system
- ✅ Automatic user creation with default permissions

## 🧪 Testing

### Test the Implementation

1. **Go to Admin Settings**
   - Navigate: Admin → Settings
   - Scroll to "Google Authentication Setup"

2. **Check Status**
   - Verify "Google Auth Provider Status" shows "Enabled"
   - Check Firebase Console links work

3. **Test Sign-in Methods**
   - Test popup method (desktop)
   - Test redirect method (mobile)
   - Verify error handling

### Test Users

You can test with any Google account. New users will be automatically created with:
- **Role:** Clinician (default)
- **Name:** From Google profile or email prefix
- **Email:** From Google account
- **Profile Image:** From Google account (if available)

## 🔒 Security Considerations

### Production Checklist

- [ ] Configure OAuth consent screen for production
- [ ] Add production domains to authorized domains
- [ ] Review and limit OAuth scopes to minimum required
- [ ] Set up proper error monitoring
- [ ] Configure rate limiting if needed
- [ ] Review user creation permissions

### Privacy & Compliance

- User data from Google (email, name, profile image) is stored in Firestore
- Users can revoke access through their Google account settings
- Application only requests essential scopes (email, profile)
- No sensitive data is stored in localStorage beyond session tokens

## 🛠️ Troubleshooting

### Common Issues

1. **"Popup blocked" Error**
   - Solution: Use redirect method instead
   - Code: `<GoogleSignInButton useRedirect={true} />`

2. **"Unauthorized domain" Error**
   - Solution: Add domain to Firebase authorized domains
   - Check: Firebase Console → Authentication → Settings

3. **OAuth consent screen not configured**
   - Solution: Complete OAuth consent screen setup in Google Cloud Console
   - Required for external users

4. **User creation fails**
   - Check: Firestore security rules allow user creation
   - Verify: `createUser` function in `src/lib/firebase/users.ts`

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('debug', 'firebase:*');
```

## 📱 Mobile Considerations

For mobile devices, use redirect method instead of popup:

```tsx
<GoogleSignInButton useRedirect={true} />
```

This provides better user experience on mobile browsers where popups may be blocked or behave inconsistently.

## 🔄 Migration Notes

Existing users can link their Google accounts by:
1. Signing in with email/password
2. Going to profile settings (when implemented)
3. Linking Google account

This maintains backward compatibility with existing authentication system.
