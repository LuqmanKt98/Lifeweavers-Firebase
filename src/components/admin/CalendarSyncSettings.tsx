// src/components/admin/CalendarSyncSettings.tsx
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Settings, 
  RefreshCw, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';

interface CalendarSyncSettingsProps {
  onSyncTriggered?: () => void;
}

export default function CalendarSyncSettings({ onSyncTriggered }: CalendarSyncSettingsProps) {
  const { toast } = useToast();
  
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: 15, // minutes
    includeRecurring: true,
    syncPastEvents: false,
    syncFutureEvents: true,
    futureDays: 30,
    eventTypes: {
      appointment: true,
      consultation: true,
      'follow-up': true,
      assessment: true,
      meeting: true,
    },
    defaultDuration: 60, // minutes
    defaultLocation: 'Therapy Room A',
  });

  const [lastSyncStatus, setLastSyncStatus] = useState({
    lastSync: new Date().toISOString(),
    status: 'success' as 'success' | 'error' | 'pending',
    eventsCount: 12,
    message: 'Successfully synced 12 events from Google Calendar'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for persistence
      localStorage.setItem('calendar_sync_settings', JSON.stringify(syncSettings));
      
      toast({
        title: "Settings Saved",
        description: "Calendar sync settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save calendar sync settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = () => {
    setLastSyncStatus(prev => ({ ...prev, status: 'pending' }));
    toast({
      title: "Manual Sync Started",
      description: "Triggering calendar synchronization...",
    });
    
    if (onSyncTriggered) {
      onSyncTriggered();
    }
    
    // Simulate sync completion
    setTimeout(() => {
      setLastSyncStatus({
        lastSync: new Date().toISOString(),
        status: 'success',
        eventsCount: Math.floor(Math.random() * 20) + 5,
        message: 'Manual sync completed successfully'
      });
    }, 3000);
  };

  const getStatusIcon = () => {
    switch (lastSyncStatus.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (lastSyncStatus.status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Sync Status
          </CardTitle>
          <CardDescription>
            Current synchronization status and quick actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">
                  Last sync: {new Date(lastSyncStatus.lastSync).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastSyncStatus.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor()}>
                {lastSyncStatus.eventsCount} events
              </Badge>
              <Button 
                onClick={handleManualSync} 
                disabled={lastSyncStatus.status === 'pending'}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Manual Sync
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sync Configuration
          </CardTitle>
          <CardDescription>
            Configure how calendar events are synchronized with Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Basic Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync calendar events at regular intervals
                </p>
              </div>
              <Switch
                checked={syncSettings.autoSync}
                onCheckedChange={(checked) => 
                  setSyncSettings(prev => ({ ...prev, autoSync: checked }))
                }
              />
            </div>

            {syncSettings.autoSync && (
              <div className="space-y-2">
                <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min="5"
                  max="1440"
                  value={syncSettings.syncInterval}
                  onChange={(e) => 
                    setSyncSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 15 }))
                  }
                  className="w-32"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Recurring Events</Label>
                <p className="text-sm text-muted-foreground">
                  Sync recurring calendar events
                </p>
              </div>
              <Switch
                checked={syncSettings.includeRecurring}
                onCheckedChange={(checked) => 
                  setSyncSettings(prev => ({ ...prev, includeRecurring: checked }))
                }
              />
            </div>
          </div>

          {/* Date Range Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Date Range</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sync Past Events</Label>
                <p className="text-sm text-muted-foreground">
                  Include events from the past
                </p>
              </div>
              <Switch
                checked={syncSettings.syncPastEvents}
                onCheckedChange={(checked) => 
                  setSyncSettings(prev => ({ ...prev, syncPastEvents: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sync Future Events</Label>
                <p className="text-sm text-muted-foreground">
                  Include upcoming events
                </p>
              </div>
              <Switch
                checked={syncSettings.syncFutureEvents}
                onCheckedChange={(checked) => 
                  setSyncSettings(prev => ({ ...prev, syncFutureEvents: checked }))
                }
              />
            </div>

            {syncSettings.syncFutureEvents && (
              <div className="space-y-2">
                <Label htmlFor="futureDays">Future Days to Sync</Label>
                <Input
                  id="futureDays"
                  type="number"
                  min="1"
                  max="365"
                  value={syncSettings.futureDays}
                  onChange={(e) => 
                    setSyncSettings(prev => ({ ...prev, futureDays: parseInt(e.target.value) || 30 }))
                  }
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Event Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Event Types to Sync</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(syncSettings.eventTypes).map(([type, enabled]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => 
                      setSyncSettings(prev => ({
                        ...prev,
                        eventTypes: { ...prev.eventTypes, [type]: checked }
                      }))
                    }
                  />
                  <Label className="capitalize">{type.replace('-', ' ')}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Default Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Default Event Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                <Input
                  id="defaultDuration"
                  type="number"
                  min="15"
                  max="480"
                  value={syncSettings.defaultDuration}
                  onChange={(e) => 
                    setSyncSettings(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) || 60 }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultLocation">Default Location</Label>
                <Input
                  id="defaultLocation"
                  value={syncSettings.defaultLocation}
                  onChange={(e) => 
                    setSyncSettings(prev => ({ ...prev, defaultLocation: e.target.value }))
                  }
                  placeholder="e.g., Therapy Room A"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
