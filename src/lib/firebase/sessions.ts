// src/lib/firebase/sessions.ts
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
} from 'firebase/firestore';
import type { SessionNote } from '@/lib/types';

const COLLECTION_NAME = 'sessions';

export const createSession = async (sessionData: Omit<SessionNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionNote> => {
  try {
    // Get the next session number for this client
    const clientSessionsQuery = query(
      collection(db, COLLECTION_NAME),
      where('clientId', '==', sessionData.clientId)
    );
    const clientSessionsSnapshot = await getDocs(clientSessionsQuery);
    const sessionNumber = clientSessionsSnapshot.size + 1;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...sessionData,
      sessionNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      attachments: sessionData.attachments || [],
    });

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return {
      id: newDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as SessionNote;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const updateSession = async (sessionId: string, updates: Partial<SessionNote>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, sessionId));
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

export const getSession = async (sessionId: string): Promise<SessionNote | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as SessionNote;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

export const getSessionsByClient = async (clientId: string): Promise<SessionNote[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('clientId', '==', clientId),
      orderBy('dateOfSession', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as SessionNote;
    });
  } catch (error) {
    console.error('Error getting sessions by client:', error);
    throw error;
  }
};

export const getSessionsByClinician = async (clinicianId: string): Promise<SessionNote[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('attendingClinicianId', '==', clinicianId),
      orderBy('dateOfSession', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as SessionNote;
    });
  } catch (error) {
    console.error('Error getting sessions by clinician:', error);
    throw error;
  }
};

export const getSessionById = async (sessionId: string): Promise<SessionNote | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, sessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        dateOfSession: data.dateOfSession || new Date().toISOString(),
        attachments: data.attachments || []
      } as SessionNote;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting session by ID:', error);
    throw error;
  }
};

export const getAllSessions = async (): Promise<SessionNote[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('dateOfSession', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as SessionNote;
    });
  } catch (error) {
    console.error('Error getting all sessions:', error);
    throw error;
  }
};

export const getRecentSessions = async (limit: number = 10): Promise<SessionNote[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('dateOfSession', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as SessionNote;
    });
  } catch (error) {
    console.error('Error getting recent sessions:', error);
    throw error;
  }
};
