// src/app/reset-admin/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { resetSuperAdmin, initializeDefaultUsers } from '@/lib/firebase/users';
import { initializeFirebaseData } from '@/lib/firebase/initialize';
import { Shield, RefreshCw, Database, Users } from 'lucide-react';

export default function ResetAdminPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitializingAll, setIsInitializingAll] = useState(false);
  const { toast } = useToast();

  const handleResetSuperAdmin = async () => {
    setIsResetting(true);
    try {
      await resetSuperAdmin();
      toast({
        title: "Super Admin Reset Successfully",
        description: "You can now login with: superadmin@lifeweaver.com / password123",
      });
    } catch (error) {
      console.error('Error resetting Super Admin:', error);
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset Super Admin",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleInitializeUsers = async () => {
    setIsInitializing(true);
    try {
      await initializeDefaultUsers();
      toast({
        title: "Default Users Initialized",
        description: "All default users have been created with password123",
      });
    } catch (error) {
      console.error('Error initializing users:', error);
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize users",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleInitializeAll = async () => {
    setIsInitializingAll(true);
    try {
      await initializeFirebaseData();
      toast({
        title: "Firebase Data Initialized",
        description: "All default data has been initialized successfully",
      });
    } catch (error) {
      console.error('Error initializing Firebase data:', error);
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize Firebase data",
        variant: "destructive",
      });
    } finally {
      setIsInitializingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Shield className="h-8 w-8 text-primary" />
              Admin Reset Utility
            </CardTitle>
            <CardDescription>
              Use these tools to reset admin credentials and initialize Firebase data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Reset Super Admin */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Reset Super Admin
              </h3>
              <p className="text-sm text-muted-foreground">
                This will delete the existing Super Admin and create a new one with default credentials.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  New Credentials:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Email: superadmin@lifeweaver.com<br />
                  Password: password123
                </p>
              </div>
              <Button 
                onClick={handleResetSuperAdmin} 
                disabled={isResetting}
                className="w-full"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Super Admin...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Reset Super Admin
                  </>
                )}
              </Button>
            </div>

            {/* Initialize Default Users */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Initialize Default Users
              </h3>
              <p className="text-sm text-muted-foreground">
                Create all default users (Super Admin, Admin, Clinicians) with password123.
              </p>
              <Button 
                onClick={handleInitializeUsers} 
                disabled={isInitializing}
                variant="outline"
                className="w-full"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Initializing Users...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Initialize Default Users
                  </>
                )}
              </Button>
            </div>

            {/* Initialize All Firebase Data */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                Initialize All Firebase Data
              </h3>
              <p className="text-sm text-muted-foreground">
                Initialize all Firebase collections (users, notifications, etc.) with default data.
              </p>
              <Button 
                onClick={handleInitializeAll} 
                disabled={isInitializingAll}
                variant="secondary"
                className="w-full"
              >
                {isInitializingAll ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Initializing All Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Initialize All Firebase Data
                  </>
                )}
              </Button>
            </div>

            {/* Navigation */}
            <div className="pt-4 border-t">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="ghost"
                className="w-full"
              >
                Go to Login Page
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
