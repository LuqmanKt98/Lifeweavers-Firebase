// src/lib/firebase/initialize.ts
import { initializeDefaultUsers, resetSuperAdminCredentials } from './users';
import { initializeDefaultNotifications } from './notifications';

/**
 * Initialize Firebase database with default data
 * This should be run once when setting up the application
 */
export const initializeFirebaseData = async (): Promise<void> => {
  try {
    console.log('Initializing Firebase database with default data...');

    // Initialize users first
    await initializeDefaultUsers();
    console.log('✓ Default users initialized');

    // Initialize notifications
    await initializeDefaultNotifications();
    console.log('✓ Default notifications initialized');

    // Initialize message collections (they will be created automatically when first message is sent)
    console.log('✓ Message collections ready');

    console.log('🎉 Firebase database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing Firebase database:', error);
    throw error;
  }
};

/**
 * Reset Super Admin credentials to new values
 * This can be run to update the Super Admin login
 */
export const resetSuperAdmin = async (): Promise<void> => {
  try {
    console.log('Resetting Super Admin credentials...');
    await resetSuperAdminCredentials();
    console.log('✓ Super Admin credentials reset successfully!');
  } catch (error) {
    console.error('❌ Error resetting Super Admin credentials:', error);
    throw error;
  }
};

/**
 * Check if the database has been initialized
 */
export const isDatabaseInitialized = async (): Promise<boolean> => {
  try {
    const { getAllUsers } = await import('./users');
    const { getAllNotifications } = await import('./notifications');

    const [users, notifications] = await Promise.all([
      getAllUsers(),
      getAllNotifications()
    ]);

    return users.length > 0 && notifications.length > 0;
  } catch (error) {
    console.error('Error checking database initialization:', error);
    return false;
  }
};
