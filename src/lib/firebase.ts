import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiozgHMJHW0ObLRB7m3xQGZf9fa_l1iEk",
  authDomain: "lifeweavers-aa9f2.firebaseapp.com",
  projectId: "lifeweavers-aa9f2",
  storageBucket: "lifeweavers-aa9f2.appspot.com",
  messagingSenderId: "794355369414",
  appId: "1:794355369414:web:3577880d5d31de83d71ec7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
