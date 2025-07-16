import { db, auth } from "./firebase";
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
  type DocumentData,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  updateEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import type { Attachment } from "@/lib/types";

// Generic type for Firestore documents
export interface FirestoreDocument extends DocumentData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types for firebase-utils specific operations
export interface KnowledgeBaseArticleExtended extends FirestoreDocument {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  tags: string[];
  isPublished: boolean;
  coverImageUrl?: string;
  attachments?: Attachment[];
}

export interface ResourceExtended extends FirestoreDocument {
  title: string;
  description: string;
  type: "document" | "video" | "link" | "other";
  url: string;
  category: string;
  tags: string[];
  accessLevel: "all" | "admin" | "clinician";
}

export interface UserProfileExtended extends FirestoreDocument {
  email: string;
  name: string;
  role: "Super Admin" | "Admin" | "Clinician" | "New User";
  status: "active" | "inactive" | "pending";
  vocation?: string;
  lastActive?: Date;
}

// Generic CRUD operations
export const createDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<T> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  return { id: newDoc.id, ...newDoc.data() } as T;
};

export const updateDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  await deleteDoc(doc(db, collectionName, id));
};

export const getDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
};

export const getDocuments = async <T extends FirestoreDocument>(
  collectionName: string,
  conditions?: {
    field: string;
    operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
    value: any;
  }[],
  orderByField?: string,
  orderDirection?: "asc" | "desc"
): Promise<T[]> => {
  let q = collection(db, collectionName);

  if (conditions) {
    q = query(q, ...conditions.map((c) => where(c.field, c.operator, c.value)));
  }

  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection || "desc"));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// Knowledge Base specific operations
export const getKnowledgeBaseArticles = async (onlyPublished = false) => {
  const conditions = onlyPublished
    ? [{ field: "isPublished", operator: "==", value: true }]
    : undefined;
  return getDocuments<KnowledgeBaseArticleExtended>(
    "knowledgeBase",
    conditions,
    "updatedAt",
    "desc"
  );
};

export const createKnowledgeBaseArticle = async (
  data: Omit<KnowledgeBaseArticleExtended, "id" | "createdAt" | "updatedAt">
) => {
  return createDocument<KnowledgeBaseArticleExtended>("knowledgeBase", data);
};

// Resources specific operations
export const getResources = async (
  accessLevel?: "all" | "admin" | "clinician"
) => {
  const conditions = accessLevel
    ? [{ field: "accessLevel", operator: "==", value: accessLevel }]
    : undefined;
  return getDocuments<ResourceExtended>("resources", conditions, "updatedAt", "desc");
};

export const createResource = async (
  data: Omit<ResourceExtended, "id" | "createdAt" | "updatedAt">
) => {
  return createDocument<ResourceExtended>("resources", data);
};

// Updated User Management specific operations
export const getUserProfiles = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserProfileExtended[];
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    throw error;
  }
};

export const createUserProfile = async (
  data: Omit<UserProfileExtended, "id" | "createdAt" | "updatedAt">
) => {
  try {
    // Create user in Firebase Auth with a default password
    const defaultPassword = "LifeWeaverTemp123!"; // This should be changed by the user on first login
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      defaultPassword
    );

    // Create user profile in Firestore
    const userProfile = {
      ...data,
      uid: userCredential.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    // Use the auth UID as the document ID in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), userProfile);

    return {
      id: userCredential.user.uid,
      ...userProfile,
    } as UserProfile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (
  id: string,
  data: Partial<UserProfile>
) => {
  try {
    const userRef = doc(db, "users", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);

    // If email is being updated, update it in Firebase Auth as well
    if (data.email) {
      const user = auth.currentUser;
      if (user) {
        await updateEmail(user, data.email);
      }
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const deleteUserProfile = async (id: string) => {
  try {
    // Delete from Firestore first
    await deleteDoc(doc(db, "users", id));

    // Then delete from Firebase Auth
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    }
  } catch (error) {
    console.error("Error deleting user profile:", error);
    throw error;
  }
};
