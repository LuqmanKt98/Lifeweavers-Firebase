// src/lib/firebase/resources.ts
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
  increment,
} from 'firebase/firestore';
import type { Resource } from '@/lib/types';

const COLLECTION_NAME = 'resources';

export const createResource = async (resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<Resource> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...resourceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewCount: 0,
      attachments: resourceData.attachments || [],
      tags: resourceData.tags || [],
    });

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return { 
      id: newDoc.id, 
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      publishedAt: data?.publishedAt?.toDate?.()?.toISOString() || null,
    } as Resource;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

export const updateResource = async (resourceId: string, updates: Partial<Resource>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, resourceId);
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // If publishing for the first time, set publishedAt
    if (updates.isPublished && !updates.publishedAt) {
      updateData.publishedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, resourceId));
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

export const getResource = async (resourceId: string): Promise<Resource | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, resourceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
    } as Resource;
  } catch (error) {
    console.error('Error getting resource:', error);
    throw error;
  }
};

export const getResourceBySlug = async (slug: string): Promise<Resource | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
    } as Resource;
  } catch (error) {
    console.error('Error getting resource by slug:', error);
    throw error;
  }
};

export const getAllResources = async (onlyPublished: boolean = false): Promise<Resource[]> => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    
    if (onlyPublished) {
      q = query(collection(db, COLLECTION_NAME), where('isPublished', '==', true), orderBy('updatedAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
      } as Resource;
    });
  } catch (error) {
    console.error('Error getting all resources:', error);
    throw error;
  }
};

export const getResourcesByAuthor = async (authorId: string): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('authorId', '==', authorId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
      } as Resource;
    });
  } catch (error) {
    console.error('Error getting resources by author:', error);
    throw error;
  }
};

export const getResourcesByType = async (resourceType: string, onlyPublished: boolean = true): Promise<Resource[]> => {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('resourceType', '==', resourceType),
      orderBy('updatedAt', 'desc')
    );
    
    if (onlyPublished) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('resourceType', '==', resourceType),
        where('isPublished', '==', true),
        orderBy('updatedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
      } as Resource;
    });
  } catch (error) {
    console.error('Error getting resources by type:', error);
    throw error;
  }
};

export const searchResources = async (searchTerm: string, onlyPublished: boolean = true): Promise<Resource[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that searches in title and tags
    // For production, consider using Algolia or similar service
    
    let q = query(collection(db, COLLECTION_NAME));
    if (onlyPublished) {
      q = query(collection(db, COLLECTION_NAME), where('isPublished', '==', true));
    }
    
    const querySnapshot = await getDocs(q);
    const searchTermLower = searchTerm.toLowerCase();
    
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
        } as Resource;
      })
      .filter(resource => 
        resource.title.toLowerCase().includes(searchTermLower) ||
        resource.excerpt.toLowerCase().includes(searchTermLower) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
      );
  } catch (error) {
    console.error('Error searching resources:', error);
    throw error;
  }
};

export const incrementResourceViewCount = async (resourceId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, resourceId);
    await updateDoc(docRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing resource view count:', error);
    throw error;
  }
};
