// src/components/firebase/FirebaseInitializer.tsx
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { initializeFirebaseData, isDatabaseInitialized } from '@/lib/firebase/initialize';

interface FirebaseInitializerProps {
  children: React.ReactNode;
}

export default function FirebaseInitializer({ children }: FirebaseInitializerProps) {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    try {
      const initialized = await isDatabaseInitialized();
      setIsInitialized(initialized);
    } catch (error) {
      console.error('Error checking initialization:', error);
      setIsInitialized(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initializeFirebaseData();
      setIsInitialized(true);
      toast({
        title: "Database Initialized",
        description: "Firebase database has been set up with default data.",
      });
    } catch (error) {
      console.error('Initialization error:', error);
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Show loading while checking initialization
  if (isInitialized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking database status...</p>
        </div>
      </div>
    );
  }

  // Show initialization prompt if not initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
              <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">Database Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p>The Firebase database needs to be initialized with default data.</p>
              <p className="text-sm mt-2">This includes:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Default user accounts</li>
                <li>• Sample notifications</li>
                <li>• System configuration</li>
              </ul>
            </div>

            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Database
                </>
              )}
            </Button>

            {isInitializing && (
              <div className="text-center text-sm text-muted-foreground">
                <p>This may take a few moments...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Database is initialized, show the app
  return <>{children}</>;
}
