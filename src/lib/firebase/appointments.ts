// src/lib/firebase/appointments.ts
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
  Timestamp,
} from 'firebase/firestore';
import type { Appointment } from '@/lib/types';

const COLLECTION_NAME = 'appointments';

export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...appointmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newDoc = await getDoc(docRef);
    return { 
      id: newDoc.id, 
      ...newDoc.data(),
      createdAt: newDoc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: newDoc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const updateAppointment = async (id: string, updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

export const getAppointment = async (id: string): Promise<Appointment | null> => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Appointment;
    }
    return null;
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw error;
  }
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('dateOfSession', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Appointment;
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
};

export const getAppointmentsByClient = async (clientId: string): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('clientId', '==', clientId),
      orderBy('dateOfSession', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Appointment;
    });
  } catch (error) {
    console.error('Error getting appointments by client:', error);
    throw error;
  }
};

export const getAppointmentsByClinician = async (clinicianId: string): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('attendingClinicianId', '==', clinicianId),
      orderBy('dateOfSession', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Appointment;
    });
  } catch (error) {
    console.error('Error getting appointments by clinician:', error);
    throw error;
  }
};

export const getAppointmentsByDateRange = async (startDate: string, endDate: string): Promise<Appointment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('dateOfSession', '>=', startDate),
      where('dateOfSession', '<=', endDate),
      orderBy('dateOfSession', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Appointment;
    });
  } catch (error) {
    console.error('Error getting appointments by date range:', error);
    throw error;
  }
};
