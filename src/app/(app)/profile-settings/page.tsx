"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Save,
  Loader2,
  Camera,
  Mail,
  Shield,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Key,
  Settings,
  AlertTriangle,
  Upload,
  X
} from 'lucide-react';
import { updateUser, getUserById } from '@/lib/firebase/users';

export default function ProfileSettingsPage() {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    vocation: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        setIsLoading(true);
        try {
          const userData = await getUserById(currentUser.id);
          if (userData) {
            setProfileData({
              name: userData.name || '',
              email: userData.email || '',
              vocation: userData.vocation || '',
              profileImage: userData.profileImage || '',
              currentPassword: userData.password || '',
              newPassword: '',
              confirmPassword: ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to currentUser data
          setProfileData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            vocation: currentUser.vocation || '',
            profileImage: currentUser.profileImage || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsPhotoUploading(true);
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        try {
          // Update user profile with new image
          await updateUser(currentUser.id, {
            profileImage: base64String
          });

          // Update local state
          setProfileData(prev => ({
            ...prev,
            profileImage: base64String
          }));

          // Refresh user data in AuthContext to update header avatar
          await refreshUser();

          toast({
            title: "Photo Updated",
            description: "Your profile photo has been successfully updated.",
          });
        } catch (error) {
          console.error('Error updating profile photo:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to update profile photo. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsPhotoUploading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive",
        });
        setIsPhotoUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling photo upload:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setIsPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser) return;

    setIsPhotoUploading(true);
    try {
      await updateUser(currentUser.id, {
        profileImage: ''
      });

      setProfileData(prev => ({
        ...prev,
        profileImage: ''
      }));

      // Refresh user data in AuthContext to update header avatar
      await refreshUser();

      toast({
        title: "Photo Removed",
        description: "Your profile photo has been removed.",
      });
    } catch (error) {
      console.error('Error removing profile photo:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const updateData: any = {
        name: profileData.name.trim(),
      };

      // Only include email if user is Super Admin
      if (currentUser.role === 'Super Admin' && profileData.email.trim()) {
        updateData.email = profileData.email.trim().toLowerCase();
      }

      // Only include vocation if user is a Clinician
      if (currentUser.role === 'Clinician' && profileData.vocation.trim()) {
        updateData.vocation = profileData.vocation.trim();
      }

      await updateUser(currentUser.id, updateData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentUser) return;

    // Validation
    if (!profileData.newPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (profileData.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordSaving(true);
    try {
      await updateUser(currentUser.id, {
        password: profileData.newPassword.trim()
      });

      // Update current password display and clear new password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: profileData.newPassword.trim(),
        newPassword: '',
        confirmPassword: ''
      }));

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile settings...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Please log in to access profile settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information, account settings, and security preferences.
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal details and profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section with Photo Upload */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={profileData.profileImage}
                alt={currentUser.name}
                data-ai-hint="person portrait"
              />
              <AvatarFallback className="text-lg">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{currentUser.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {currentUser.role}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPhotoUploading}
                >
                  {isPhotoUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {isPhotoUploading ? 'Uploading...' : 'Change Photo'}
                </Button>
                {profileData.profileImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={isPhotoUploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={currentUser?.role !== 'Super Admin' || isSaving}
                    className={`pl-10 ${currentUser?.role !== 'Super Admin' ? 'bg-muted' : ''}`}
                    placeholder={currentUser?.role === 'Super Admin' ? "Enter email address" : "Email can only be changed by Super Admin"}
                  />
                </div>
                {currentUser?.role !== 'Super Admin' && (
                  <p className="text-xs text-muted-foreground">
                    Only Super Admin can change email addresses.
                  </p>
                )}
              </div>
            </div>

            {/* Vocation field - only for Clinicians */}
            {currentUser.role === 'Clinician' && (
              <div className="space-y-2">
                <Label htmlFor="vocation">Vocation/Specialty</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vocation"
                    value={profileData.vocation}
                    onChange={(e) => setProfileData(prev => ({ ...prev, vocation: e.target.value }))}
                    placeholder="e.g., Physiotherapist, Occupational Therapist"
                    disabled={isSaving}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Role Information */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <span className="ml-2 font-medium">{currentUser.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className="ml-2 font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !profileData.name.trim()}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Management
          </CardTitle>
          <CardDescription>
            Update your password and manage security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Password Display */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={profileData.currentPassword}
                disabled
                className="pr-10 bg-muted"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* New Password Section */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Change Password
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    disabled={isPasswordSaving}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('new')}
                    disabled={isPasswordSaving}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    disabled={isPasswordSaving}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('confirm')}
                    disabled={isPasswordSaving}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Key className="h-4 w-4" />
                <p className="text-sm font-medium">Password Requirements</p>
              </div>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Must match confirmation password</li>
                <li>• Cannot be empty</li>
              </ul>
            </div>

            {/* Change Password Button */}
            <div className="flex justify-end">
              <Button
                onClick={handlePasswordChange}
                disabled={isPasswordSaving || !profileData.newPassword.trim() || !profileData.confirmPassword.trim()}
              >
                {isPasswordSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isPasswordSaving ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Account Secure</p>
                <p className="text-xs text-green-700 dark:text-green-300">Your account is protected and secure.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Role:</span>
                <span className="ml-2 font-medium">{currentUser.role}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Account Status:</span>
                <span className="ml-2 font-medium text-green-600">Active</span>
              </div>
              {currentUser.role === 'Super Admin' && (
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">Permissions:</span>
                  <span className="ml-2 font-medium text-amber-600">Full System Access</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
