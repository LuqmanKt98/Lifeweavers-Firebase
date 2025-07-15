// src/lib/firebase/users.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

const USERS_COLLECTION = 'users';

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      } as User;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as User;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new Error('Failed to fetch user by email');
  }
};

// Add new user
export const addUser = async (userData: Omit<User, 'id'>, isGoogleAuth: boolean = false): Promise<User> => {
  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Validate password is provided (not required for Google auth users)
    if (!isGoogleAuth && !userData.password) {
      throw new Error('Password is required');
    }

    // Clean up undefined values to avoid Firestore errors
    const cleanedUserData: any = {};
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedUserData[key] = value;
      }
    });

    const userToAdd = {
      ...cleanedUserData,
      email: userData.email.toLowerCase(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, USERS_COLLECTION), userToAdd);

    // Return user without password for security
    const { password, ...userWithoutPassword } = userData;
    return {
      id: docRef.id,
      ...userWithoutPassword
    };
  } catch (error) {
    console.error('Error adding user:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add user');
  }
};

// Update user
export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<void> => {
  try {
    // If email is being updated, check for duplicates
    if (userData.email) {
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('A user with this email already exists');
      }
      userData.email = userData.email.toLowerCase();
    }

    // Clean up undefined values to avoid Firestore errors
    const cleanedData: any = {};
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData = {
      ...cleanedData,
      updatedAt: Timestamp.now()
    };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update user');
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // First get the user to check if it's the protected main Super Admin
    const userToDelete = await getUserById(userId);
    if (userToDelete && userToDelete.email === 'hello@lifeweavers.org') {
      throw new Error('The main Super Admin account (hello@lifeweavers.org) cannot be deleted. This account is protected to ensure system integrity.');
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete user');
  }
};

// Subscribe to users changes
export const subscribeToUsers = (callback: (users: User[]) => void): (() => void) => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('name'));

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    callback(users);
  }, (error) => {
    console.error('Error in users subscription:', error);
  });
};

// Get users by role
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', role), orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw new Error('Failed to fetch users by role');
  }
};

// Reset Super Admin credentials
export const resetSuperAdminCredentials = async (): Promise<void> => {
  try {
    // Find existing super admin
    const existingSuperAdmin = await getUserByEmail('superadmin@lifeweaver.com');

    if (existingSuperAdmin) {
      // Delete the old super admin
      await deleteUser(existingSuperAdmin.id);
      console.log('Deleted old Super Admin');
    }

    // Create new super admin with updated credentials
    const newSuperAdmin = {
      email: 'hello@lifeweavers.org',
      name: 'Super Admin',
      role: 'Super Admin' as const,
      password: 'super123'
    };

    await addUser(newSuperAdmin);
    console.log('Created new Super Admin with updated credentials');
  } catch (error) {
    console.error('Error resetting Super Admin credentials:', error);
    throw error;
  }
};

// Initialize default users (run once to populate database)
export const initializeDefaultUsers = async (): Promise<void> => {
  try {
    const existingUsers = await getAllUsers();
    if (existingUsers.length > 0) {
      console.log('Users already exist, skipping initialization');
      return;
    }

    const defaultUsers = [
      { email: 'hello@lifeweavers.org', name: 'Super Admin', role: 'Super Admin' as const, password: 'super123' },
      { email: 'admin@lifeweaver.com', name: 'Alex Admin', role: 'Admin' as const, password: 'password123' },
      { email: 'clinician@lifeweaver.com', name: 'Casey Clinician', role: 'Clinician' as const, vocation: 'Physiotherapist', password: 'password123' },
      { email: 'clinician2@lifeweaver.com', name: 'Jamie Therapist', role: 'Clinician' as const, vocation: 'Occupational Therapist', password: 'password123' },
      { email: 'new.user1@example.com', name: 'Taylor New', role: 'Clinician' as const, vocation: 'Speech Therapist', password: 'password123' },
      { email: 'new.user2@example.com', name: 'Morgan Recruit', role: 'Admin' as const, password: 'password123' },
    ];

    for (const user of defaultUsers) {
      await addUser(user);
    }

    console.log('Default users initialized successfully');
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Reset Super Admin user (for troubleshooting)
export const resetSuperAdmin = async (): Promise<void> => {
  try {
    // Delete existing super admin if exists
    const existingSuperAdmin = await getUserByEmail('superadmin@lifeweaver.com');
    if (existingSuperAdmin) {
      await deleteUser(existingSuperAdmin.id);
      console.log('Existing Super Admin deleted');
    }

    // Create new super admin
    const superAdminData = {
      email: 'superadmin@lifeweaver.com',
      name: 'Dr. Super Admin',
      role: 'Super Admin' as const,
      password: 'password123'
    };

    const newSuperAdmin = await addUser(superAdminData);
    console.log('Super Admin reset successfully:', newSuperAdmin);
  } catch (error) {
    console.error('Error resetting Super Admin:', error);
    throw error;
  }
};
