// src/app/(app)/admin/reset-super-admin/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { resetSuperAdmin } from '@/lib/firebase/initialize';

export default function ResetSuperAdminPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);
    
    try {
      await resetSuperAdmin();
      setResetComplete(true);
    } catch (err) {
      console.error('Reset failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset Super Admin credentials');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Reset Super Admin Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will reset the Super Admin credentials to:
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
              onClick={handleReset} 
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
                  Reset Super Admin
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

          <div className="text-sm text-muted-foreground">
            <p><strong>Note:</strong> This action will:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Delete the existing Super Admin account</li>
              <li>Create a new Super Admin with updated credentials</li>
              <li>Allow you to login with the new email and password</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
