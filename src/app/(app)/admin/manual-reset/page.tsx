// src/app/(app)/admin/manual-reset/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, AlertTriangle, Code } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore';

export default function ManualResetPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleManualReset = async () => {
    setIsResetting(true);
    setError(null);
    setLogs([]);
    
    try {
      addLog('🔄 Starting Super Admin credentials reset...');
      
      // Find existing super admin by old email
      const usersRef = collection(db, 'users');
      const oldEmailQuery = query(usersRef, where('email', '==', 'superadmin@lifeweaver.com'));
      const oldEmailSnapshot = await getDocs(oldEmailQuery);
      
      // Delete old super admin if exists
      if (!oldEmailSnapshot.empty) {
        for (const docSnapshot of oldEmailSnapshot.docs) {
          await deleteDoc(doc(db, 'users', docSnapshot.id));
          addLog('🗑️ Deleted old Super Admin account');
        }
      } else {
        addLog('ℹ️ No old Super Admin account found');
      }
      
      // Also check for any existing account with new email
      const newEmailQuery = query(usersRef, where('email', '==', 'hello@lifeweavers.org'));
      const newEmailSnapshot = await getDocs(newEmailQuery);
      
      if (!newEmailSnapshot.empty) {
        for (const docSnapshot of newEmailSnapshot.docs) {
          await deleteDoc(doc(db, 'users', docSnapshot.id));
          addLog('🗑️ Deleted existing account with new email');
        }
      }
      
      // Create new Super Admin
      const newSuperAdmin = {
        email: 'hello@lifeweavers.org',
        name: 'Super Admin',
        role: 'Super Admin',
        password: 'super123',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'users'), newSuperAdmin);
      addLog(`✅ Created new Super Admin account with ID: ${docRef.id}`);
      
      addLog('🎉 Super Admin credentials reset successfully!');
      addLog('📧 Email: hello@lifeweavers.org');
      addLog('🔑 Password: super123');
      
      setResetComplete(true);
      
    } catch (err) {
      console.error('Reset failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            Manual Super Admin Reset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will manually reset the Super Admin credentials in Firebase:
              <br />
              <strong>Email:</strong> hello@lifeweavers.org
              <br />
              <strong>Password:</strong> super123
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetComplete && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Super Admin credentials have been reset successfully! 
                You can now login with the new credentials.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleManualReset} 
              disabled={isResetting || resetComplete}
              variant={resetComplete ? "outline" : "default"}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : resetComplete ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reset Complete
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Manual Reset Super Admin
                </>
              )}
            </Button>

            {resetComplete && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/login'}
              >
                Go to Login
              </Button>
            )}
          </div>

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operation Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>This operation will:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Delete any existing Super Admin accounts</li>
              <li>Create a new Super Admin with email: hello@lifeweavers.org</li>
              <li>Set the password to: super123</li>
              <li>Show detailed logs of the operation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
