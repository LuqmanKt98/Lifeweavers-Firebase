// src/lib/firebase/notifications.ts
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
  or,
  and
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Helper function to convert timestamp to ISO string
const convertTimestamp = (timestamp: any): string => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    // Firestore Timestamp
    return timestamp.toDate().toISOString();
  } else if (typeof timestamp === 'string') {
    // Already a string
    return timestamp;
  } else if (timestamp instanceof Date) {
    // JavaScript Date
    return timestamp.toISOString();
  } else {
    // Fallback to current time
    return new Date().toISOString();
  }
};

// Get all notifications (Super Admin view)
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp)
    })) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

// Get notifications for a specific user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

    // Get all notifications and filter client-side to avoid complex indexes
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    const allNotifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp)
    })) as Notification[];

    // Filter client-side for user-specific notifications
    const userNotifications = allNotifications.filter(notification => {
      // Admin broadcasts and system updates are visible to all
      if (notification.type === 'admin_broadcast' || notification.type === 'system_update') {
        return true;
      }

      // Team alerts are for specific users
      if (notification.type === 'team_alert' && notification.recipientUserIds) {
        return notification.recipientUserIds.includes(userId);
      }

      return false;
    });

    return userNotifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw new Error('Failed to fetch user notifications');
  }
};

// Add new notification
export const addNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification> => {
  try {
    // Clean up undefined values to avoid Firestore errors
    const cleanedData: any = {};
    Object.entries(notificationData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    const notificationToAdd = {
      ...cleanedData,
      timestamp: Timestamp.now(),
      read: false
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationToAdd);

    return {
      id: docRef.id,
      ...cleanedData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding notification:', error);
    throw new Error('Failed to add notification');
  }
};

// Update notification (mark as read, etc.)
export const updateNotification = async (notificationId: string, updates: Partial<Omit<Notification, 'id' | 'timestamp'>>): Promise<void> => {
  try {
    // Clean up undefined values to avoid Firestore errors
    const cleanedUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedUpdates[key] = value;
      }
    });

    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, cleanedUpdates);
  } catch (error) {
    console.error('Error updating notification:', error);
    throw new Error('Failed to update notification');
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateNotification(notificationId, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Mark multiple notifications as read
export const markMultipleNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
  try {
    const updatePromises = notificationIds.map(id => markNotificationAsRead(id));
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    throw new Error('Failed to mark notifications as read');
  }
};

// Mark all user notifications as read
export const markAllUserNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    // Get all user notifications
    const userNotifications = await getUserNotifications(userId);

    // Filter unread notifications
    const unreadNotifications = userNotifications.filter(notification => !notification.read);

    if (unreadNotifications.length === 0) {
      return; // No unread notifications to mark
    }

    // Mark all unread notifications as read
    const updatePromises = unreadNotifications.map(notification =>
      markNotificationAsRead(notification.id)
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all user notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

// Subscribe to all notifications (Super Admin)
export const subscribeToAllNotifications = (callback: (notifications: Notification[]) => void): (() => void) => {
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(notificationsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp)
    })) as Notification[];

    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
  });
};

// Subscribe to user notifications
export const subscribeToUserNotifications = (userId: string, callback: (notifications: Notification[]) => void): (() => void) => {
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

  // Subscribe to all notifications and filter client-side
  const q = query(notificationsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const allNotifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp)
    })) as Notification[];

    // Filter client-side for user-specific notifications
    const userNotifications = allNotifications.filter(notification => {
      // Admin broadcasts and system updates are visible to all
      if (notification.type === 'admin_broadcast' || notification.type === 'system_update') {
        return true;
      }

      // Team alerts are for specific users
      if (notification.type === 'team_alert' && notification.recipientUserIds) {
        return notification.recipientUserIds.includes(userId);
      }

      return false;
    });

    callback(userNotifications);
  }, (error) => {
    console.error('Error in user notifications subscription:', error);
  });
};

// Initialize default notifications (run once to populate database)
export const initializeDefaultNotifications = async (): Promise<void> => {
  try {
    const existingNotifications = await getAllNotifications();
    if (existingNotifications.length > 0) {
      console.log('Notifications already exist, skipping initialization');
      return;
    }

    const defaultNotifications = [
      {
        type: 'admin_broadcast' as const,
        title: 'Welcome to LWV CLINIC E-DOC!',
        content: 'We are excited to have you on board. Explore the features and let us know if you have any questions.',
        read: false
      },
      {
        type: 'admin_broadcast' as const,
        title: 'System Maintenance Scheduled',
        content: 'LWV CLINIC E-DOC will be undergoing scheduled maintenance on Sunday at 2 AM for approximately 1 hour.',
        read: false
      },
      {
        type: 'admin_broadcast' as const,
        title: 'New Feature: Enhanced User Management',
        content: 'Super Admins can now edit user information directly from the User Management page. Check out the new edit functionality!',
        read: false
      },
      {
        type: 'system_update' as const,
        title: 'Password Policy Update',
        content: 'Password requirements have been updated. Please ensure your password meets the new criteria.',
        read: false
      }
    ];

    for (const notification of defaultNotifications) {
      await addNotification(notification);
    }

    console.log('Default notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing default notifications:', error);
  }
};
