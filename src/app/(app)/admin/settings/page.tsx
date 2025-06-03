// src/app/(app)/admin/settings/page.tsx
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  User,
  Shield,
  Bell,
  Database,
  Save,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { getAllUsers } from '@/lib/firebase/users';
import CalendarSyncSettings from '@/components/admin/CalendarSyncSettings';

export default function SystemSettingsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    vocation: currentUser?.vocation || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableNotifications: true,
    enableAuditLog: true
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!currentUser || currentUser.role !== 'Super Admin') {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            Only Super Administrators can access system settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      // Validate passwords if changing
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "New password and confirmation do not match.",
            variant: "destructive"
          });
          return;
        }
        if (profileData.newPassword.length < 6) {
          toast({
            title: "Password Too Short",
            description: "Password must be at least 6 characters long.",
            variant: "destructive"
          });
          return;
        }
      }

      // Update user in mock database
      const userIndex = MOCK_ALL_USERS_DATABASE.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        MOCK_ALL_USERS_DATABASE[userIndex] = {
          ...MOCK_ALL_USERS_DATABASE[userIndex],
          name: profileData.name,
          vocation: profileData.vocation
        };

        // Update localStorage
        const storedUser = localStorage.getItem("lifeweaver_user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.name = profileData.name;
          userData.vocation = profileData.vocation;
          localStorage.setItem("lifeweaver_user", JSON.stringify(userData));
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSystemSettingsUpdate = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to backend
      localStorage.setItem('system_settings', JSON.stringify(systemSettings));

      toast({
        title: "System Settings Updated",
        description: "System configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update system settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </CardTitle>
          <CardDescription>
            Manage your profile and system-wide configurations as Super Administrator.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Update your personal information and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-muted"
                placeholder="Email cannot be changed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vocation">Vocation/Title</Label>
            <Input
              id="vocation"
              value={profileData.vocation}
              onChange={(e) => setProfileData(prev => ({ ...prev, vocation: e.target.value }))}
              placeholder="e.g., Lead Therapist, Clinical Director"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleProfileUpdate} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and security options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Settings
              </h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to restrict system access
                  </p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register
                  </p>
                </div>
                <Switch
                  checked={systemSettings.allowNewRegistrations}
                  onCheckedChange={(checked) =>
                    setSystemSettings(prev => ({ ...prev, allowNewRegistrations: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Verification Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  checked={systemSettings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setSystemSettings(prev => ({ ...prev, requireEmailVerification: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                System Preferences
              </h4>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="480"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) =>
                    setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="3"
                  max="10"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow system-generated notifications
                  </p>
                </div>
                <Switch
                  checked={systemSettings.enableNotifications}
                  onCheckedChange={(checked) =>
                    setSystemSettings(prev => ({ ...prev, enableNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all system activities
                  </p>
                </div>
                <Switch
                  checked={systemSettings.enableAuditLog}
                  onCheckedChange={(checked) =>
                    setSystemSettings(prev => ({ ...prev, enableAuditLog: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSystemSettingsUpdate} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save System Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Calendar Sync Settings */}
      <CalendarSyncSettings />
    </div>
  );
}
