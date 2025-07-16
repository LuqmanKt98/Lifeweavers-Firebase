"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Trash2, 
  Clock,
  AlertCircle,
  Edit
} from 'lucide-react';
import { updateAppointment, deleteAppointment } from '@/lib/firebase/appointments';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, AppointmentStatus } from '@/lib/types';

interface AppointmentActionsProps {
  appointment: Appointment;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  onAppointmentDeleted?: (appointmentId: string) => void;
  compact?: boolean;
}

export function AppointmentActions({ 
  appointment, 
  onAppointmentUpdated, 
  onAppointmentDeleted,
  compact = false 
}: AppointmentActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    setIsLoading(true);
    try {
      await updateAppointment(appointment.id, { status: newStatus });
      
      const updatedAppointment = { ...appointment, status: newStatus };
      onAppointmentUpdated?.(updatedAppointment);

      toast({
        title: "✅ Status Updated",
        description: `Appointment marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteAppointment(appointment.id);
      onAppointmentDeleted?.(appointment.id);

      toast({
        title: "🗑️ Appointment Deleted",
        description: "Appointment has been removed from the calendar.",
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'tentative': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500 hover:bg-green-600';
      case 'tentative': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600';
      case 'completed': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Quick status buttons */}
        {appointment.status !== 'completed' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => handleStatusUpdate('completed')}
            disabled={isLoading}
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
        )}
        
        {appointment.status !== 'cancelled' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={isLoading}
          >
            <XCircle className="h-3 w-3" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Current status badge */}
        <Badge 
          variant="outline" 
          className={`${getStatusColor(appointment.status)} text-white border-none`}
        >
          <span className="flex items-center gap-1">
            {getStatusIcon(appointment.status)}
            {appointment.status}
          </span>
        </Badge>

        {/* Action buttons */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {appointment.status !== 'confirmed' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate('confirmed')}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Mark as Confirmed
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'completed' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate('completed')}>
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Mark as Completed
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'tentative' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate('tentative')}>
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                Mark as Tentative
              </DropdownMenuItem>
            )}
            
            {appointment.status !== 'cancelled' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate('cancelled')}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Cancel Appointment
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Appointment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment with {appointment.clientName}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
