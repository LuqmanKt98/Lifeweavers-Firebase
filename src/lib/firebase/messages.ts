// src/lib/firebase/messages.ts
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
  Timestamp,
  limit,
  and,
  or,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MessageThread, Message, MessageReaction } from '@/lib/types';

const MESSAGE_THREADS_COLLECTION = 'messageThreads';
const MESSAGES_COLLECTION = 'messages';

// Helper function to convert timestamp to ISO string
const convertTimestamp = (timestamp: any): string => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  } else if (typeof timestamp === 'string') {
    return timestamp;
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString();
  } else {
    return new Date().toISOString();
  }
};

// Get all message threads for a user
export const getUserMessageThreads = async (userId: string): Promise<MessageThread[]> => {
  try {
    const threadsRef = collection(db, MESSAGE_THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastMessageTimestamp: convertTimestamp(doc.data().lastMessageTimestamp)
    })) as MessageThread[];
  } catch (error) {
    console.error('Error fetching user message threads:', error);
    throw new Error('Failed to fetch message threads');
  }
};

// Get messages for a specific thread
export const getThreadMessages = async (threadId: string): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp)
    })) as Message[];
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    throw new Error('Failed to fetch messages');
  }
};

// Create a new message thread
export const createMessageThread = async (threadData: Omit<MessageThread, 'id'>): Promise<MessageThread> => {
  try {
    // Ensure unreadCounts is initialized for all participants
    const initialUnreadCounts: { [userId: string]: number } = {};
    if (threadData.participantIds) {
      threadData.participantIds.forEach(participantId => {
        initialUnreadCounts[participantId] = 0;
      });
    }

    const threadToAdd = {
      ...threadData,
      unreadCounts: threadData.unreadCounts || initialUnreadCounts,
      lastMessageTimestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, MESSAGE_THREADS_COLLECTION), threadToAdd);

    return {
      id: docRef.id,
      ...threadData,
      unreadCounts: threadToAdd.unreadCounts,
      lastMessageTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating message thread:', error);
    throw new Error('Failed to create message thread');
  }
};

// Send a message
export const sendMessage = async (messageData: Omit<Message, 'id'>): Promise<Message> => {
  try {
    // Clean up undefined values to avoid Firestore errors
    const cleanedData: any = {};
    Object.entries(messageData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    const messageToAdd = {
      ...cleanedData,
      timestamp: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageToAdd);

    // Get thread data to update unread counts
    const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, cleanedData.threadId);
    const threadDoc = await getDoc(threadRef);

    if (threadDoc.exists()) {
      const threadData = threadDoc.data();
      const participantIds = threadData.participantIds || [];
      const currentUnreadCounts = threadData.unreadCounts || {};
      const deletedForUsers = threadData.deletedForUsers || [];

      // Update unread counts for all participants except the sender
      const updatedUnreadCounts = { ...currentUnreadCounts };
      participantIds.forEach((participantId: string) => {
        if (participantId !== cleanedData.senderId) {
          updatedUnreadCounts[participantId] = (updatedUnreadCounts[participantId] || 0) + 1;
        }
      });

      // Create appropriate snippet based on message type
      let snippet = cleanedData.content.substring(0, 100);
      if (cleanedData.replyTo) {
        snippet = `Replied: ${snippet}`;
      }

      // Make thread visible for all participants but preserve deletion timestamps
      // This ensures message history filtering is maintained per user
      const updatedDeletedForUsers: string[] = []; // Make thread visible to all

      // Update thread's last message info, unread counts, and restore visibility
      // Note: We keep deletedAtTimestamps intact to preserve message filtering per user
      await updateDoc(threadRef, {
        lastMessageTimestamp: messageToAdd.timestamp,
        lastMessageSnippet: snippet,
        unreadCounts: updatedUnreadCounts,
        deletedForUsers: updatedDeletedForUsers, // Clear deleted status for visibility
        // deletedAtTimestamps: Keep existing timestamps for message filtering
        updatedAt: Timestamp.now()
      });
    }

    return {
      id: docRef.id,
      ...cleanedData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

// Delete a message thread for a specific user (WhatsApp-like behavior)
export const deleteThreadForUser = async (threadId: string, userId: string): Promise<void> => {
  try {
    const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, threadId);
    const threadDoc = await getDoc(threadRef);

    if (!threadDoc.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadDoc.data();
    const deletedForUsers = threadData.deletedForUsers || [];
    const deletedAtTimestamps = threadData.deletedAtTimestamps || {};

    // Add user to deletedForUsers array if not already present
    if (!deletedForUsers.includes(userId)) {
      deletedForUsers.push(userId);
    }

    // Store the deletion timestamp for this user
    deletedAtTimestamps[userId] = new Date().toISOString();

    await updateDoc(threadRef, {
      deletedForUsers,
      deletedAtTimestamps,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting thread for user:', error);
    throw new Error('Failed to delete thread for user');
  }
};

// Delete a message thread completely (for admin use)
export const deleteMessageThread = async (threadId: string): Promise<void> => {
  try {
    // Delete all messages in the thread first
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const messagesQuery = query(messagesRef, where('threadId', '==', threadId));
    const messagesSnapshot = await getDocs(messagesQuery);

    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the thread
    const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, threadId);
    await deleteDoc(threadRef);
  } catch (error) {
    console.error('Error deleting message thread:', error);
    throw new Error('Failed to delete message thread');
  }
};

// Mark thread as read for a user
export const markThreadAsRead = async (threadId: string, userId: string): Promise<void> => {
  try {
    const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, {
      [`unreadCounts.${userId}`]: 0,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marking thread as read:', error);
    throw new Error('Failed to mark thread as read');
  }
};

// Subscribe to user's message threads with user-specific data
export const subscribeToUserMessageThreads = (
  userId: string,
  callback: (threads: MessageThread[]) => void
): (() => void) => {
  const threadsRef = collection(db, MESSAGE_THREADS_COLLECTION);
  const q = query(
    threadsRef,
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const allThreads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastMessageTimestamp: convertTimestamp(doc.data().lastMessageTimestamp)
    })) as MessageThread[];

    // Filter out threads that are deleted for this user
    const visibleThreads = allThreads.filter(thread => {
      const deletedForUsers = thread.deletedForUsers || [];
      return !deletedForUsers.includes(userId);
    });

    // For each visible thread, get the user-specific last message snippet
    const threadsWithUserSpecificData = await Promise.all(
      visibleThreads.map(async (thread) => {
        const deletedAtTimestamps = thread.deletedAtTimestamps || {};
        const userDeletedAt = deletedAtTimestamps[userId];

        // Get the last message that this user can see
        const messagesRef = collection(db, MESSAGES_COLLECTION);
        const messagesQuery = query(
          messagesRef,
          where('threadId', '==', thread.id),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        try {
          const messagesSnapshot = await getDocs(messagesQuery);
          let lastVisibleMessage = null;

          if (!messagesSnapshot.empty) {
            const lastMessage = messagesSnapshot.docs[0].data();
            const messageTimestamp = new Date(convertTimestamp(lastMessage.timestamp));

            // Check if user can see this message (after their deletion timestamp)
            if (!userDeletedAt || messageTimestamp > new Date(userDeletedAt)) {
              lastVisibleMessage = lastMessage;
            } else {
              // User deleted thread before this message, find the last message they can see
              const userMessagesQuery = query(
                messagesRef,
                where('threadId', '==', thread.id),
                where('timestamp', '>', Timestamp.fromDate(new Date(userDeletedAt))),
                orderBy('timestamp', 'desc'),
                limit(1)
              );

              const userMessagesSnapshot = await getDocs(userMessagesQuery);
              if (!userMessagesSnapshot.empty) {
                lastVisibleMessage = userMessagesSnapshot.docs[0].data();
              }
            }
          }

          // Update thread with user-specific last message snippet
          let userSpecificSnippet = thread.lastMessageSnippet;
          if (lastVisibleMessage) {
            userSpecificSnippet = lastVisibleMessage.content?.substring(0, 100) || 'New message';
            if (lastVisibleMessage.replyTo) {
              userSpecificSnippet = `Replied: ${userSpecificSnippet}`;
            }
          } else if (userDeletedAt) {
            // User has deleted the thread and no new messages
            userSpecificSnippet = 'Start typing to send a message...';
          } else {
            // New thread with no messages yet
            userSpecificSnippet = 'Start typing to send a message...';
          }

          return {
            ...thread,
            lastMessageSnippet: userSpecificSnippet,
            unreadCount: thread.unreadCounts?.[userId] || 0
          };
        } catch (error) {
          console.error('Error getting user-specific thread data:', error);
          return {
            ...thread,
            unreadCount: thread.unreadCounts?.[userId] || 0
          };
        }
      })
    );

    callback(threadsWithUserSpecificData);
  }, (error) => {
    console.error('Error in message threads subscription:', error);
  });
};

// Subscribe to messages in a thread
export const subscribeToThreadMessages = (
  threadId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where('threadId', '==', threadId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp)
    })) as Message[];

    callback(messages);
  }, (error) => {
    console.error('Error in thread messages subscription:', error);
  });
};

// Subscribe to messages in a thread with user-specific filtering (for deleted threads)
export const subscribeToThreadMessagesForUser = (
  threadId: string,
  userId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  let messagesUnsubscribe: (() => void) | null = null;

  // Subscribe to thread changes to get deletion timestamps
  const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, threadId);

  const threadUnsubscribe = onSnapshot(threadRef, (threadSnapshot) => {
    if (!threadSnapshot.exists()) {
      callback([]);
      return;
    }

    const threadData = threadSnapshot.data();
    const deletedAtTimestamps = threadData.deletedAtTimestamps || {};
    const userDeletedAt = deletedAtTimestamps[userId];

    // Clean up previous messages subscription
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }

    // Subscribe to messages
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );

    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: convertTimestamp(doc.data().timestamp)
      })) as Message[];

      let filteredMessages = allMessages;

      // If user had deleted the thread, only show messages after the deletion timestamp
      if (userDeletedAt) {
        const deletedTimestamp = new Date(userDeletedAt);
        filteredMessages = allMessages.filter(message => {
          const messageTimestamp = new Date(message.timestamp);
          return messageTimestamp > deletedTimestamp;
        });
      }

      callback(filteredMessages);
    }, (error) => {
      console.error('Error in thread messages subscription for user:', error);
    });
  }, (error) => {
    console.error('Error in thread subscription for user:', error);
  });

  // Return cleanup function for both subscriptions
  return () => {
    threadUnsubscribe();
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }
  };
};

// Get unread message count for a user
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const threadsRef = collection(db, MESSAGE_THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('participantIds', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);

    let totalUnread = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const unreadCounts = data.unreadCounts || {};
      totalUnread += unreadCounts[userId] || 0;
    });

    return totalUnread;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};

// Check if a DM thread already exists between two users (considering user deletions)
export const findExistingDMThread = async (userId1: string, userId2: string): Promise<MessageThread | null> => {
  try {
    const threadsRef = collection(db, MESSAGE_THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('type', '==', 'dm'),
      where('participantIds', 'array-contains', userId1)
    );
    const snapshot = await getDocs(q);

    // Find thread that contains both users and only those two users
    const existingThread = snapshot.docs.find(doc => {
      const data = doc.data();
      const participants = data.participantIds || [];
      const deletedForUsers = data.deletedForUsers || [];

      return participants.includes(userId2) &&
             participants.length === 2 &&
             participants.includes(userId1) &&
             !deletedForUsers.includes(userId1); // Thread should not be deleted for the requesting user
    });

    if (existingThread) {
      const data = existingThread.data();
      return {
        id: existingThread.id,
        ...data,
        lastMessageTimestamp: convertTimestamp(data.lastMessageTimestamp)
      } as MessageThread;
    }

    return null;
  } catch (error) {
    console.error('Error finding existing DM thread:', error);
    return null;
  }
};

// Make thread visible for a user (remove from deletedForUsers but keep deletion timestamp)
export const restoreThreadForUser = async (threadId: string, userId: string): Promise<void> => {
  try {
    const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, threadId);
    const threadDoc = await getDoc(threadRef);

    if (!threadDoc.exists()) {
      throw new Error('Thread not found');
    }

    const threadData = threadDoc.data();
    const deletedForUsers = threadData.deletedForUsers || [];

    // Remove user from deletedForUsers array if present (make thread visible)
    const updatedDeletedForUsers = deletedForUsers.filter((id: string) => id !== userId);

    // Keep deletion timestamp intact for message filtering
    // This ensures user only sees messages after their deletion time
    // Update lastMessageTimestamp to make thread appear at top of list
    await updateDoc(threadRef, {
      deletedForUsers: updatedDeletedForUsers,
      lastMessageTimestamp: Timestamp.now(),
      // Don't change lastMessageSnippet - let the user-specific subscription handle it
      // deletedAtTimestamps: Keep existing timestamps for permanent message filtering
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error restoring thread for user:', error);
    throw new Error('Failed to restore thread for user');
  }
};

// Find existing DM thread regardless of deletion status (for restoring when new message is sent)
export const findExistingDMThreadIncludingDeleted = async (userId1: string, userId2: string): Promise<MessageThread | null> => {
  try {
    const threadsRef = collection(db, MESSAGE_THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('type', '==', 'dm'),
      where('participantIds', 'array-contains', userId1)
    );
    const snapshot = await getDocs(q);

    // Find thread that contains both users and only those two users (regardless of deletion status)
    const existingThread = snapshot.docs.find(doc => {
      const data = doc.data();
      const participants = data.participantIds || [];

      return participants.includes(userId2) &&
             participants.length === 2 &&
             participants.includes(userId1);
    });

    if (existingThread) {
      const data = existingThread.data();
      return {
        id: existingThread.id,
        ...data,
        lastMessageTimestamp: convertTimestamp(data.lastMessageTimestamp)
      } as MessageThread;
    }

    return null;
  } catch (error) {
    console.error('Error finding existing DM thread including deleted:', error);
    return null;
  }
};

// Add reaction to a message
export const addMessageReaction = async (messageId: string, emoji: string, userId: string, userName: string): Promise<void> => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data();
    const reactions = messageData.reactions || [];

    // Find existing reaction with this emoji
    const existingReactionIndex = reactions.findIndex((r: MessageReaction) => r.emoji === emoji);

    if (existingReactionIndex >= 0) {
      // Reaction exists, toggle user's reaction
      const existingReaction = reactions[existingReactionIndex];
      const userIndex = existingReaction.userIds.indexOf(userId);

      if (userIndex >= 0) {
        // User already reacted, remove their reaction
        existingReaction.userIds.splice(userIndex, 1);
        existingReaction.userNames.splice(userIndex, 1);

        // If no users left, remove the reaction entirely
        if (existingReaction.userIds.length === 0) {
          reactions.splice(existingReactionIndex, 1);
        }
      } else {
        // User hasn't reacted, add their reaction
        existingReaction.userIds.push(userId);
        existingReaction.userNames.push(userName);
      }
    } else {
      // New reaction, add it
      reactions.push({
        emoji,
        userIds: [userId],
        userNames: [userName]
      });
    }

    await updateDoc(messageRef, {
      reactions,
      updatedAt: Timestamp.now()
    });

    // Update thread's unread counts for reactions (only if it's a new reaction)
    if (existingReactionIndex < 0 || (existingReactionIndex >= 0 && !reactions[existingReactionIndex]?.userIds.includes(userId))) {
      const threadRef = doc(db, MESSAGE_THREADS_COLLECTION, messageData.threadId);
      const threadDoc = await getDoc(threadRef);

      if (threadDoc.exists()) {
        const threadData = threadDoc.data();
        const participantIds = threadData.participantIds || [];
        const currentUnreadCounts = threadData.unreadCounts || {};

        // Update unread counts for all participants except the reactor
        const updatedUnreadCounts = { ...currentUnreadCounts };
        participantIds.forEach((participantId: string) => {
          if (participantId !== userId) {
            updatedUnreadCounts[participantId] = (updatedUnreadCounts[participantId] || 0) + 1;
          }
        });

        await updateDoc(threadRef, {
          unreadCounts: updatedUnreadCounts,
          lastMessageTimestamp: Timestamp.now(),
          lastMessageSnippet: `${userName} reacted with ${emoji}`,
          updatedAt: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('Error adding message reaction:', error);
    throw new Error('Failed to add reaction');
  }
};

// Remove reaction from a message
export const removeMessageReaction = async (messageId: string, emoji: string, userId: string): Promise<void> => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data();
    const reactions = messageData.reactions || [];

    // Find existing reaction with this emoji
    const existingReactionIndex = reactions.findIndex((r: MessageReaction) => r.emoji === emoji);

    if (existingReactionIndex >= 0) {
      const existingReaction = reactions[existingReactionIndex];
      const userIndex = existingReaction.userIds.indexOf(userId);

      if (userIndex >= 0) {
        // Remove user's reaction
        existingReaction.userIds.splice(userIndex, 1);
        existingReaction.userNames.splice(userIndex, 1);

        // If no users left, remove the reaction entirely
        if (existingReaction.userIds.length === 0) {
          reactions.splice(existingReactionIndex, 1);
        }
      }
    }

    await updateDoc(messageRef, {
      reactions,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error removing message reaction:', error);
    throw new Error('Failed to remove reaction');
  }
};

// Delete message for me only
export const deleteMessageForMe = async (messageId: string, userId: string): Promise<void> => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data();
    const deletedForUsers = messageData.deletedForUsers || [];

    if (!deletedForUsers.includes(userId)) {
      deletedForUsers.push(userId);
    }

    await updateDoc(messageRef, {
      deletedForUsers,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting message for user:', error);
    throw new Error('Failed to delete message');
  }
};

// Delete message for everyone
export const deleteMessageForEveryone = async (messageId: string, userId: string): Promise<void> => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data();

    // Check if user is the sender
    if (messageData.senderId !== userId) {
      throw new Error('Only the sender can delete message for everyone');
    }

    await updateDoc(messageRef, {
      isDeleted: true,
      deletedFor: 'everyone',
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting message for everyone:', error);
    throw new Error('Failed to delete message for everyone');
  }
};
