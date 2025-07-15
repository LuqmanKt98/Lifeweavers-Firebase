// src/lib/firebase/clients.ts
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { Client } from '@/lib/types';

const COLLECTION_NAME = 'clients';

export const createClient = async (clientData: Omit<Client, 'id' | 'dateAdded'>): Promise<Client> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...clientData,
      dateAdded: serverTimestamp(),
      teamMemberIds: clientData.teamMemberIds || [],
    });

    const newDoc = await getDoc(docRef);
    return { 
      id: newDoc.id, 
      ...newDoc.data(),
      dateAdded: newDoc.data()?.dateAdded?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Client;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (clientId: string): Promise<void> => {
  try {
    // First, delete all related data
    await deleteAllClientRelatedData(clientId);

    // Then delete the client
    await deleteDoc(doc(db, COLLECTION_NAME, clientId));
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Helper function to delete all client-related data (CASCADE DELETE)
const deleteAllClientRelatedData = async (clientId: string): Promise<void> => {
  try {
    // Delete all sessions for this client
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('clientId', '==', clientId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessionDeletePromises = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));

    // Delete all appointments for this client
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('clientId', '==', clientId)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointmentDeletePromises = appointmentsSnapshot.docs.map(doc => deleteDoc(doc.ref));

    // Delete all tasks for this client
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('clientId', '==', clientId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const taskDeletePromises = tasksSnapshot.docs.map(doc => deleteDoc(doc.ref));

    // Delete all progress reports for this client
    const reportsQuery = query(
      collection(db, 'progressReports'),
      where('clientId', '==', clientId)
    );
    const reportsSnapshot = await getDocs(reportsQuery);
    const reportDeletePromises = reportsSnapshot.docs.map(doc => deleteDoc(doc.ref));

    // Execute all deletions in parallel
    await Promise.all([
      ...sessionDeletePromises,
      ...appointmentDeletePromises,
      ...taskDeletePromises,
      ...reportDeletePromises
    ]);

    console.log(`✅ Cascade delete completed for client ${clientId}: deleted ${sessionDeletePromises.length} sessions, ${appointmentDeletePromises.length} appointments, ${taskDeletePromises.length} tasks, ${reportDeletePromises.length} reports`);
  } catch (error) {
    console.error('Error deleting client related data:', error);
    throw error;
  }
};

// Utility function to clean up orphaned data (data without valid client references)
export const cleanupOrphanedData = async (): Promise<{
  deletedSessions: number;
  deletedAppointments: number;
  deletedTasks: number;
  deletedReports: number;
}> => {
  try {
    // Get all existing client IDs
    const clientsSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const existingClientIds = clientsSnapshot.docs.map(doc => doc.id);

    let deletedSessions = 0;
    let deletedAppointments = 0;
    let deletedTasks = 0;
    let deletedReports = 0;

    // Clean up orphaned sessions
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      if (!existingClientIds.includes(sessionData.clientId)) {
        await deleteDoc(sessionDoc.ref);
        deletedSessions++;
      }
    }

    // Clean up orphaned appointments
    const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
    for (const appointmentDoc of appointmentsSnapshot.docs) {
      const appointmentData = appointmentDoc.data();
      if (!existingClientIds.includes(appointmentData.clientId)) {
        await deleteDoc(appointmentDoc.ref);
        deletedAppointments++;
      }
    }

    // Clean up orphaned tasks
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();
      if (!existingClientIds.includes(taskData.clientId)) {
        await deleteDoc(taskDoc.ref);
        deletedTasks++;
      }
    }

    // Clean up orphaned reports
    const reportsSnapshot = await getDocs(collection(db, 'progressReports'));
    for (const reportDoc of reportsSnapshot.docs) {
      const reportData = reportDoc.data();
      if (!existingClientIds.includes(reportData.clientId)) {
        await deleteDoc(reportDoc.ref);
        deletedReports++;
      }
    }

    console.log(`🧹 Orphaned data cleanup completed: ${deletedSessions} sessions, ${deletedAppointments} appointments, ${deletedTasks} tasks, ${deletedReports} reports`);

    return {
      deletedSessions,
      deletedAppointments,
      deletedTasks,
      deletedReports
    };
  } catch (error) {
    console.error('Error cleaning up orphaned data:', error);
    throw error;
  }
};

export const getClient = async (clientId: string): Promise<Client | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      dateAdded: data.dateAdded?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Client;
  } catch (error) {
    console.error('Error getting client:', error);
    throw error;
  }
};

// Alias for compatibility
export const getClientById = getClient;

export const getAllClients = async (): Promise<Client[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('dateAdded', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateAdded: data.dateAdded?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Client;
    });
  } catch (error) {
    console.error('Error getting all clients:', error);
    throw error;
  }
};

export const getClientsByTeamMember = async (userId: string): Promise<Client[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('teamMemberIds', 'array-contains', userId),
      orderBy('dateAdded', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateAdded: data.dateAdded?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Client;
    });
  } catch (error) {
    console.error('Error getting clients by team member:', error);
    throw error;
  }
};

export const addTeamMemberToClient = async (clientId: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    await updateDoc(docRef, {
      teamMemberIds: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding team member to client:', error);
    throw error;
  }
};

export const removeTeamMemberFromClient = async (clientId: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    await updateDoc(docRef, {
      teamMemberIds: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing team member from client:', error);
    throw error;
  }
};
