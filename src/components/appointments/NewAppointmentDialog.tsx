"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createAppointment } from '@/lib/firebase/appointments';
import { getAllClients } from '@/lib/firebase/clients';
import { getAllUsers } from '@/lib/firebase/users';
import { useAppointments } from '@/hooks/useAppointments';
import { checkAppointmentConflicts, validateAppointmentTiming, suggestAlternativeSlots } from '@/lib/utils/appointmentConflicts';
import type { Appointment, AppointmentType, AppointmentStatus, Client, User } from '@/lib/types';
import { format, addMinutes } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

interface NewAppointmentDialogProps {
  onAppointmentCreated?: (appointment?: Appointment) => void;
}

interface AppointmentFormData {
  clientId: string;
  attendingClinicianId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  dateOfSession: string;
  timeOfSession: string;
  duration: number;
  location: string;
  content: string;
}

export function NewAppointmentDialog({ onAppointmentCreated }: NewAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clinicians, setClinicians] = useState<User[]>([]);
  const [conflicts, setConflicts] = useState<any>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Get existing appointments for conflict checking
  const { appointments: existingAppointments } = useAppointments({ realtime: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    defaultValues: {
      type: 'appointment',
      status: 'confirmed',
      duration: 60,
      location: 'Therapy Room A',
      attendingClinicianId: currentUser?.id || '',
    },
  });

  // Watch form values for real-time conflict checking
  const watchedValues = watch(['dateOfSession', 'timeOfSession', 'duration', 'attendingClinicianId', 'clientId']);

  const loadData = async () => {
    try {
      const [clientsData, usersData] = await Promise.all([
        getAllClients(),
        getAllUsers(),
      ]);
      setClients(clientsData);
      setClinicians(usersData.filter(user => user.role === 'Clinician'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load clients and clinicians.",
        variant: "destructive",
      });
    }
  };

  // Check for conflicts when form values change
  useEffect(() => {
    const [dateOfSession, timeOfSession, duration, attendingClinicianId, clientId] = watchedValues;

    if (dateOfSession && timeOfSession && duration && attendingClinicianId) {
      const startTime = new Date(`${dateOfSession}T${timeOfSession}`);
      const endTime = addMinutes(startTime, duration);

      // Validate timing
      const timingValidation = validateAppointmentTiming(startTime, duration);

      if (!timingValidation.isValid) {
        setConflicts({ errors: timingValidation.errors });
        setShowConflictWarning(true);
        return;
      }

      // Check for conflicts
      const conflictCheck = checkAppointmentConflicts(
        {
          startTime,
          endTime,
          clinicianId: attendingClinicianId,
          clientId,
          location: watch('location')
        },
        existingAppointments
      );

      if (conflictCheck.hasConflict) {
        setConflicts(conflictCheck);
        setShowConflictWarning(true);
      } else {
        setConflicts(null);
        setShowConflictWarning(false);
      }
    }
  }, [watchedValues, existingAppointments, watch]);

  const onSubmit = async (data: AppointmentFormData) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const selectedClient = clients.find(c => c.id === data.clientId);
      const selectedClinician = clinicians.find(c => c.id === data.attendingClinicianId);

      if (!selectedClient || !selectedClinician) {
        throw new Error('Selected client or clinician not found');
      }

      // Combine date and time
      const dateTime = new Date(`${data.dateOfSession}T${data.timeOfSession}`);

      // Final conflict check before submission
      const finalConflictCheck = checkAppointmentConflicts(
        {
          startTime: dateTime,
          endTime: addMinutes(dateTime, data.duration),
          clinicianId: data.attendingClinicianId,
          clientId: data.clientId,
          location: data.location
        },
        existingAppointments
      );

      if (finalConflictCheck.hasConflict) {
        toast({
          title: "⚠️ Scheduling Conflict",
          description: finalConflictCheck.message,
          variant: "destructive",
        });
        setConflicts(finalConflictCheck);
        setShowConflictWarning(true);
        return;
      }

      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: data.clientId,
        clientName: selectedClient.name,
        attendingClinicianId: data.attendingClinicianId,
        attendingClinicianName: selectedClinician.name,
        attendingClinicianVocation: selectedClinician.vocation,
        type: data.type,
        status: data.status,
        dateOfSession: dateTime.toISOString(),
        duration: data.duration,
        location: data.location,
        content: data.content,
        createdByUserId: currentUser.id,
        createdByUserName: currentUser.name,
      };

      const newAppointment = await createAppointment(appointmentData);

      toast({
        title: "✅ Appointment Created",
        description: `Appointment with ${selectedClient.name} has been scheduled successfully.`,
      });

      reset();
      setOpen(false);
      onAppointmentCreated?.(newAppointment);

      // Note: Real-time listeners will automatically update the calendar
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadData();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment with a client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select onValueChange={(value) => setValue('clientId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendingClinicianId">Clinician *</Label>
              <Select 
                onValueChange={(value) => setValue('attendingClinicianId', value)}
                defaultValue={currentUser?.id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a clinician" />
                </SelectTrigger>
                <SelectContent>
                  {clinicians.map((clinician) => (
                    <SelectItem key={clinician.id} value={clinician.id}>
                      {clinician.name} {clinician.vocation && `(${clinician.vocation})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select onValueChange={(value) => setValue('type', value as AppointmentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={(value) => setValue('status', value as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="tentative">Tentative</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfSession">Date *</Label>
              <Input
                type="date"
                {...register('dateOfSession', { required: 'Date is required' })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.dateOfSession && (
                <p className="text-sm text-destructive">{errors.dateOfSession.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeOfSession">Time *</Label>
              <Input
                type="time"
                {...register('timeOfSession', { required: 'Time is required' })}
              />
              {errors.timeOfSession && (
                <p className="text-sm text-destructive">{errors.timeOfSession.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                type="number"
                min="15"
                max="480"
                step="15"
                {...register('duration', { 
                  required: 'Duration is required',
                  min: { value: 15, message: 'Minimum 15 minutes' },
                  max: { value: 480, message: 'Maximum 8 hours' }
                })}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              {...register('location')}
              placeholder="e.g., Therapy Room A, Online, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Notes</Label>
            <Textarea
              {...register('content')}
              placeholder="Additional notes or description for the appointment..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
