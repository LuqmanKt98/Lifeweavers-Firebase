// src/contexts/AuthContext.tsx
"use client";

import type { User, AuthContextType } from "@/lib/types";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getUserByEmail, getUserById } from "@/lib/firebase/users";

// Define role-based email mappings
const ROLE_EMAILS = {
  SUPER_ADMIN: ["superadmin@lifeweaver.com", "hello@lifeweavers.org"],
  ADMIN: ["admin@lifeweaver.com"],
  CLINICIAN: ["clinician@lifeweaver.com", "clinician2@lifeweaver.com"],
  NEW_USER: ["new.user1@example.com", "new.user2@example.com"],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatingUser, setImpersonatingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Check localStorage first for existing session
    const initializeAuth = async () => {
      try {
        const sessionActive = localStorage.getItem("lifeweaver_session");
        const storedUser = localStorage.getItem("lifeweaver_user");

        if (sessionActive === "active" && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          const storedImpersonatingUser = localStorage.getItem(
            "lifeweaver_impersonating_user"
          );
          if (storedImpersonatingUser && parsedUser.role === "Super Admin") {
            setImpersonatingUser(JSON.parse(storedImpersonatingUser));
          }
        } else {
          // Clear any stale data if session is not active
          localStorage.removeItem("lifeweaver_user");
          localStorage.removeItem("lifeweaver_impersonating_user");
          localStorage.removeItem("lifeweaver_session");
        }
      } catch (error) {
        console.error("Error initializing auth from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem("lifeweaver_user");
        localStorage.removeItem("lifeweaver_impersonating_user");
        localStorage.removeItem("lifeweaver_session");
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to Firebase auth changes but don't depend on them for session management
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      // Firebase auth state changes don't affect our custom session management
      // This is just for compatibility with any Firebase features we might use
    });

    return () => unsubscribe();
  }, []);

  const currentUser = impersonatingUser || user;
  const isImpersonating = !!impersonatingUser;

  useEffect(() => {
    if (!loading && !currentUser && pathname !== "/login") {
      router.push("/login");
    } else if (!loading && currentUser && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [currentUser, loading, router, pathname]);

  const getUserRole = (email: string): string => {
    const lowerEmail = email.toLowerCase();
    if (ROLE_EMAILS.SUPER_ADMIN.includes(lowerEmail)) return "Super Admin";
    if (ROLE_EMAILS.ADMIN.includes(lowerEmail)) return "Admin";
    if (ROLE_EMAILS.CLINICIAN.includes(lowerEmail)) return "Clinician";
    if (ROLE_EMAILS.NEW_USER.includes(lowerEmail)) return "New User";
    return "Unknown";
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // First check if user exists in our database
      const userData = await getUserByEmail(email.toLowerCase());
      if (!userData) {
        throw new Error("Invalid email or password");
      }

      // Check password (in a real app, this would be hashed)
      if (userData.password !== password) {
        throw new Error("Invalid email or password");
      }

      // Remove password from user data for security
      const { password: _, ...userWithoutPassword } = userData;

      // Set user state and localStorage
      setUser(userWithoutPassword);
      localStorage.setItem("lifeweaver_user", JSON.stringify(userWithoutPassword));

      // Also set a session flag to indicate successful login
      localStorage.setItem("lifeweaver_session", "active");

      // Optional: Try to sign in with Firebase for additional features, but don't depend on it
      try {
        await signInWithEmailAndPassword(auth, email.toLowerCase(), "dummypassword123");
      } catch (firebaseError) {
        // Firebase auth is optional - we proceed with our custom auth
        console.log("Firebase auth failed, proceeding with custom auth");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startImpersonation = async (targetUser: User) => {
    if (user?.role !== "Super Admin" || user.id === targetUser.id) {
      toast({
        title: "Impersonation Denied",
        description: "Cannot impersonate this user.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setImpersonatingUser(targetUser);
    localStorage.setItem(
      "lifeweaver_impersonating_user",
      JSON.stringify(targetUser)
    );
    toast({
      title: "Impersonation Started",
      description: `You are now viewing as ${targetUser.name}.`,
    });
    router.push("/dashboard");
    setLoading(false);
  };

  const stopImpersonation = async () => {
    if (!impersonatingUser) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const originalUserName = impersonatingUser.name;
    setImpersonatingUser(null);
    localStorage.removeItem("lifeweaver_impersonating_user");
    toast({
      title: "Impersonation Ended",
      description: `Stopped impersonating ${originalUserName}. Resumed as ${user?.name}.`,
    });
    router.push("/dashboard");
    setLoading(false);
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const updatedUser = await getUserById(user.id);
      if (updatedUser) {
        // Remove password from user data for security
        const { password: _, ...userWithoutPassword } = updatedUser;
        setUser(userWithoutPassword);
        localStorage.setItem("lifeweaver_user", JSON.stringify(userWithoutPassword));

        // If we're impersonating and the impersonated user is the one being updated
        if (impersonatingUser && impersonatingUser.id === user.id) {
          setImpersonatingUser(userWithoutPassword);
          localStorage.setItem("lifeweaver_impersonating_user", JSON.stringify(userWithoutPassword));
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Clear all session data
      setUser(null);
      setImpersonatingUser(null);
      localStorage.removeItem("lifeweaver_user");
      localStorage.removeItem("lifeweaver_impersonating_user");
      localStorage.removeItem("lifeweaver_session");

      // Sign out from Firebase (optional, but good practice)
      try {
        await firebaseSignOut(auth);
      } catch (firebaseError) {
        console.log("Firebase signout failed, but proceeding with logout");
      }

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !pathname.startsWith("/login")) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Loading application...
      </div>
    );
  }

  if (pathname === "/login" && !user) {
    return (
      <AuthContext.Provider
        value={{
          user,
          currentUser,
          loading,
          isImpersonating,
          login,
          logout,
          startImpersonation,
          stopImpersonation,
          refreshUser,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Loading application...
      </div>
    );
  }

  if (!currentUser && pathname !== "/login") {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        loading,
        isImpersonating,
        login,
        logout,
        startImpersonation,
        stopImpersonation,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
