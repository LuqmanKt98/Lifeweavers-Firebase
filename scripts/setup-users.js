// scripts/setup-users.js
require("dotenv").config();
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} = require("firebase/auth");
const {
  getFirestore,
  setDoc,
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} = require("firebase/firestore");

// Validate environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  console.error("Error: Missing required environment variables:");
  missingEnvVars.forEach((varName) => console.error(`- ${varName}`));
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log config for debugging (without sensitive values)
console.log("Firebase configuration loaded:", {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    email: "hello@lifeweavers.org",
    password: "super123",
    role: "Super Admin",
    vocation: "Super Admin",
    privileges: [
      "all_access",
      "user_management",
      "system_configuration",
      "impersonation",
    ],
  },
];

async function deleteExistingUser(email) {
  try {
    // Try to sign in with default password
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      "lifeweavers2024"
    );
    // Delete the user from Authentication
    await deleteUser(userCredential.user);

    // Delete user data from Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (document) => {
      await deleteDoc(doc(db, "users", document.id));
    });

    console.log(`Successfully deleted user: ${email}`);
  } catch (error) {
    console.log(
      `User ${email} doesn't exist or couldn't be deleted:`,
      error.message
    );
  }
}

async function createUser(userInfo) {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userInfo.email,
      userInfo.password
    );

    // Add user data to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userInfo.email,
      role: userInfo.role,
      vocation: userInfo.vocation,
      privileges: userInfo.privileges,
      dateJoined: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: "active",
      name: userInfo.email
        .split("@")[0]
        .replace(".", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    });

    console.log(`Successfully created user: ${userInfo.email}`);
  } catch (error) {
    console.error(`Error creating user ${userInfo.email}:`, error.message);
  }
}

async function setupUsers() {
  console.log("Starting user cleanup...");
  // First, delete all existing users
  for (const user of users) {
    await deleteExistingUser(user.email);
  }

  console.log("\nStarting user creation...");
  // Then create new users
  for (const user of users) {
    await createUser(user);
  }
  console.log("\nUser setup completed!");
  process.exit(0);
}

setupUsers();
