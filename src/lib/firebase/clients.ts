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
    await deleteDoc(doc(db, COLLECTION_NAME, clientId));
  } catch (error) {
    console.error('Error deleting client:', error);
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
