// src/lib/firebase/knowledge-base.ts
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
import type { KnowledgeBaseArticle } from '@/lib/types';

const COLLECTION_NAME = 'knowledgeBase';

export const createArticle = async (articleData: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<KnowledgeBaseArticle> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...articleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewCount: 0,
      attachments: articleData.attachments || [],
      tags: articleData.tags || [],
    });

    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    return { 
      id: newDoc.id, 
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      publishedAt: data?.publishedAt?.toDate?.()?.toISOString() || null,
    } as KnowledgeBaseArticle;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

export const updateArticle = async (articleId: string, updates: Partial<KnowledgeBaseArticle>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, articleId);
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
    console.error('Error updating article:', error);
    throw error;
  }
};

export const deleteArticle = async (articleId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, articleId));
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
};

export const getArticle = async (articleId: string): Promise<KnowledgeBaseArticle | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, articleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
    } as KnowledgeBaseArticle;
  } catch (error) {
    console.error('Error getting article:', error);
    throw error;
  }
};

export const getArticleBySlug = async (slug: string): Promise<KnowledgeBaseArticle | null> => {
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
    } as KnowledgeBaseArticle;
  } catch (error) {
    console.error('Error getting article by slug:', error);
    throw error;
  }
};

export const getAllArticles = async (onlyPublished: boolean = false): Promise<KnowledgeBaseArticle[]> => {
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
      } as KnowledgeBaseArticle;
    });
  } catch (error) {
    console.error('Error getting all articles:', error);
    throw error;
  }
};

export const getArticlesByAuthor = async (authorId: string): Promise<KnowledgeBaseArticle[]> => {
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
      } as KnowledgeBaseArticle;
    });
  } catch (error) {
    console.error('Error getting articles by author:', error);
    throw error;
  }
};

export const searchArticles = async (searchTerm: string, onlyPublished: boolean = true): Promise<KnowledgeBaseArticle[]> => {
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
        } as KnowledgeBaseArticle;
      })
      .filter(article => 
        article.title.toLowerCase().includes(searchTermLower) ||
        article.excerpt.toLowerCase().includes(searchTermLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
      );
  } catch (error) {
    console.error('Error searching articles:', error);
    throw error;
  }
};

export const incrementArticleViewCount = async (articleId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, articleId);
    await updateDoc(docRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing article view count:', error);
    throw error;
  }
};
