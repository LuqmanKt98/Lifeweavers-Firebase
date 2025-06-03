// src/lib/firebase/tasks.ts
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
import type { ToDoTask } from '@/lib/types';

const COLLECTION_NAME = 'tasks';

export const createTask = async (taskData: Omit<ToDoTask, 'id' | 'createdAt'>): Promise<ToDoTask> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...taskData,
      createdAt: serverTimestamp(),
      isDone: false,
      assignedToUserIds: taskData.assignedToUserIds || [],
      assignedToUserNames: taskData.assignedToUserNames || [],
    });

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return { 
      id: newDoc.id, 
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as ToDoTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<ToDoTask>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getTask = async (taskId: string): Promise<ToDoTask | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, taskId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as ToDoTask;
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
};

export const getTasksByClient = async (clientId: string): Promise<ToDoTask[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as ToDoTask;
    });
  } catch (error) {
    console.error('Error getting tasks by client:', error);
    throw error;
  }
};

export const getTasksByUser = async (userId: string): Promise<ToDoTask[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('assignedToUserIds', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as ToDoTask;
    });
  } catch (error) {
    console.error('Error getting tasks by user:', error);
    throw error;
  }
};

export const getPendingTasksByUser = async (userId: string): Promise<ToDoTask[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('assignedToUserIds', 'array-contains', userId),
      where('isDone', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as ToDoTask;
    });
  } catch (error) {
    console.error('Error getting pending tasks by user:', error);
    throw error;
  }
};

export const markTaskComplete = async (taskId: string, completedByUserId: string, completedByUserName: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(docRef, {
      isDone: true,
      completedAt: serverTimestamp(),
      completedByUserId,
      completedByUserName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking task complete:', error);
    throw error;
  }
};

export const markTaskIncomplete = async (taskId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, taskId);
    await updateDoc(docRef, {
      isDone: false,
      completedAt: null,
      completedByUserId: null,
      completedByUserName: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking task incomplete:', error);
    throw error;
  }
};
