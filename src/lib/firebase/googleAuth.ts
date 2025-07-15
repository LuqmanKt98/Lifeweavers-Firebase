// src/lib/firebase/googleAuth.ts
import { auth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { getUserByEmail, addUser } from './users';
import type { User } from '@/lib/types';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google using popup
 */
export const signInWithGooglePopup = async (): Promise<User> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    return await handleGoogleAuthResult(firebaseUser);
  } catch (error: any) {
    console.error('Google popup sign-in error:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Please allow popups and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open.');
    }
    
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

/**
 * Sign in with Google using redirect (better for mobile)
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Google redirect sign-in error:', error);
    throw new Error('Failed to initiate Google sign-in. Please try again.');
  }
};

/**
 * Handle redirect result after Google sign-in
 */
export const handleGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    
    if (!result) {
      return null; // No redirect result
    }
    
    return await handleGoogleAuthResult(result.user);
  } catch (error) {
    console.error('Google redirect result error:', error);
    throw new Error('Failed to complete Google sign-in. Please try again.');
  }
};

/**
 * Handle Google authentication result (common logic for popup and redirect)
 */
const handleGoogleAuthResult = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    const email = firebaseUser.email?.toLowerCase();
    const displayName = firebaseUser.displayName;
    const photoURL = firebaseUser.photoURL;
    
    if (!email) {
      throw new Error('No email found in Google account');
    }
    
    // Check if user exists in our database
    let user = await getUserByEmail(email);
    
    if (!user) {
      // Create new user if doesn't exist
      const newUserData = {
        email,
        name: displayName || email.split('@')[0],
        role: 'Clinician' as const, // Default role for Google sign-ups
        profileImage: photoURL || undefined,
        vocation: undefined
      };

      user = await addUser(newUserData, true); // Pass true for isGoogleAuth
      console.log('Created new user from Google auth:', user.id);
    } else {
      // Update existing user's profile image if available
      if (photoURL && user.profileImage !== photoURL) {
        // Note: You might want to implement updateUser function to update profile image
        console.log('User profile image could be updated:', photoURL);
      }
    }
    
    // Remove password from user data for security
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Error handling Google auth result:', error);
    throw error;
  }
};

/**
 * Check if current user signed in with Google
 */
export const isGoogleUser = (): boolean => {
  const user = auth.currentUser;
  if (!user) return false;
  
  return user.providerData.some(provider => provider.providerId === 'google.com');
};

/**
 * Get Google user info
 */
export const getGoogleUserInfo = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const googleProvider = user.providerData.find(provider => provider.providerId === 'google.com');
  
  return googleProvider ? {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified
  } : null;
};
