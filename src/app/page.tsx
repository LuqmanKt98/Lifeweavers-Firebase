// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // You can render a loading spinner here if preferred
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <p className="text-foreground">Loading LWV CLINIC E-DOC...</p>
      {/* Optionally, add a spinner icon here */}
    </div>
  );
}
