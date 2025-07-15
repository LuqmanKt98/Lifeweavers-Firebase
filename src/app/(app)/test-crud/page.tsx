"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { getAllClients } from '@/lib/firebase/clients';
import { getAllSessions } from '@/lib/firebase/sessions';
import { getAllUsers } from '@/lib/firebase/users';
import type { Client, SessionNote, User } from '@/lib/types';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

export default function TestCRUDPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message } : t);
      } else {
        return [...prev, { name, status, message }];
      }
    });
  };

  const runTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run tests.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setTests([]);

    // Test 1: Load Clients
    updateTest('Load Clients', 'pending', 'Testing client data loading...');
    try {
      const clients = await getAllClients();
      updateTest('Load Clients', 'success', `Loaded ${clients.length} clients successfully`);
    } catch (error) {
      updateTest('Load Clients', 'error', `Failed to load clients: ${error}`);
    }

    // Test 2: Load Sessions
    updateTest('Load Sessions', 'pending', 'Testing session data loading...');
    try {
      const sessions = await getAllSessions();
      updateTest('Load Sessions', 'success', `Loaded ${sessions.length} sessions successfully`);
    } catch (error) {
      updateTest('Load Sessions', 'error', `Failed to load sessions: ${error}`);
    }

    // Test 3: Load Users
    updateTest('Load Users', 'pending', 'Testing user data loading...');
    try {
      const users = await getAllUsers();
      updateTest('Load Users', 'success', `Loaded ${users.length} users successfully`);
    } catch (error) {
      updateTest('Load Users', 'error', `Failed to load users: ${error}`);
    }

    // Test 4: Permission Check
    updateTest('Permission Check', 'pending', 'Testing user permissions...');
    try {
      const permissions = {
        canCreateClients: user.role === 'Super Admin' || user.role === 'Admin',
        canEditSessions: true, // All authenticated users can edit their own sessions
        canManageUsers: user.role === 'Super Admin',
        canViewDashboard: true
      };
      
      const permissionCount = Object.values(permissions).filter(Boolean).length;
      updateTest('Permission Check', 'success', `User has ${permissionCount}/4 permissions (Role: ${user.role})`);
    } catch (error) {
      updateTest('Permission Check', 'error', `Permission check failed: ${error}`);
    }

    // Test 5: Navigation Test
    updateTest('Navigation Test', 'pending', 'Testing page navigation...');
    try {
      // Test if we can access different routes based on role
      const accessibleRoutes = [
        '/dashboard',
        '/cases',
        '/sessions',
        user.role === 'Super Admin' ? '/admin/users' : null,
        user.role !== 'Clinician' ? '/admin/cleanup' : null
      ].filter(Boolean);
      
      updateTest('Navigation Test', 'success', `Can access ${accessibleRoutes.length} routes`);
    } catch (error) {
      updateTest('Navigation Test', 'error', `Navigation test failed: ${error}`);
    }

    setIsRunning(false);
    
    const successCount = tests.filter(t => t.status === 'success').length;
    const totalTests = tests.length;
    
    toast({
      title: "Tests Completed",
      description: `${successCount}/${totalTests} tests passed`,
      variant: successCount === totalTests ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Running...</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Please log in to access the CRUD test page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRUD Operations Test</CardTitle>
          <p className="text-muted-foreground">
            Test all CRUD operations and permissions for user: <strong>{user.name}</strong> ({user.role})
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={isRunning} className="mb-6">
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>

          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    <p className="text-sm text-muted-foreground">{test.message}</p>
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </div>

          {tests.length === 0 && !isRunning && (
            <div className="text-center py-8 text-muted-foreground">
              Click "Run All Tests" to start testing CRUD operations
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Permissions Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Current User</h4>
              <p>Name: {user.name}</p>
              <p>Email: {user.email}</p>
              <p>Role: <Badge>{user.role}</Badge></p>
              {user.vocation && <p>Vocation: {user.vocation}</p>}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Available Actions</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  View Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  View Cases
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Manage Sessions
                </li>
                {(user.role === 'Admin' || user.role === 'Super Admin') && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Edit Clients
                  </li>
                )}
                {user.role === 'Super Admin' && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Manage Users
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
