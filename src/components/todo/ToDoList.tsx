
// src/components/todo/ToDoList.tsx
"use client";

import { useState, FormEvent } from 'react';
import type { ToDoTask, User } from '@/lib/types';
import ToDoItem from './ToDoItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, ListChecks, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem, // For "No team members" case
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface ToDoListProps {
  clientId: string;
  tasks: ToDoTask[];
  currentUser: User;
  onAddTask: (description: string, dueDate?: string, assignedToUserIds: string[]) => void;
  onToggleTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  canModify: boolean; // General permission to interact (add, toggle)
  canDeleteSystemGenerated: boolean; // Specific permission for SuperAdmin to delete system tasks
  assignableTeamMembers: Pick<User, 'id' | 'name'>[]; // List of users who can be assigned tasks
}

export default function ToDoList({ 
    clientId, 
    tasks, 
    currentUser, 
    onAddTask, 
    onToggleTask, 
    onRemoveTask,
    canModify,
    canDeleteSystemGenerated,
    assignableTeamMembers
}: ToDoListProps) {
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignedToUserIds, setNewTaskAssignedToUserIds] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAssigneeToggle = (userId: string) => {
    setNewTaskAssignedToUserIds(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectedAssigneeNames = newTaskAssignedToUserIds
    .map(id => assignableTeamMembers.find(member => member.id === id)?.name)
    .filter(Boolean) as string[];

  const handleSubmitNewTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;
    if (newTaskAssignedToUserIds.length === 0) {
        toast({
            title: "Assignee Required",
            description: "Please select at least one assignee for the task.",
            variant: "destructive",
        });
        return;
    }
    onAddTask(newTaskDescription.trim(), newTaskDueDate || undefined, newTaskAssignedToUserIds);
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setNewTaskAssignedToUserIds([]); 
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isDone !== b.isDone) {
      return a.isDone ? 1 : -1; // Incomplete tasks first
    }
    const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (aDueDate !== bDueDate) {
      return aDueDate - bDueDate; // Sort by due date (earliest first)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Then by creation date (newest first within same due date/status)
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-primary">
            <ListChecks className="h-6 w-6"/> Things To Do
        </CardTitle>
        <CardDescription>
            Manage tasks for this client. Track progress and upcoming deadlines. Assign tasks to team members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canModify && (
          <form onSubmit={handleSubmitNewTask} className="space-y-4 mb-6 p-4 border rounded-lg bg-secondary/20">
            <div className="space-y-2">
                <Label htmlFor="newTaskDescription">Task Description</Label>
                <Input
                id="newTaskDescription"
                type="text"
                placeholder="Enter new task..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="bg-background"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="newTaskDueDate">Due Date (Optional)</Label>
                    <Input
                    id="newTaskDueDate"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="bg-background text-sm"
                    min={new Date().toISOString().split('T')[0]} // Optional: Prevent past dates
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newTaskAssignees">Assign To</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" id="newTaskAssignees" className={cn("w-full justify-between text-left font-normal bg-background", selectedAssigneeNames.length === 0 && "text-muted-foreground")}>
                                <span className="truncate">
                                    {selectedAssigneeNames.length > 0 ? selectedAssigneeNames.join(', ') : "Select Assignee(s)"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto" align="start">
                            {assignableTeamMembers.length > 0 ? assignableTeamMembers.map(member => (
                                <DropdownMenuCheckboxItem
                                    key={member.id}
                                    checked={newTaskAssignedToUserIds.includes(member.id)}
                                    onCheckedChange={() => handleAssigneeToggle(member.id)}
                                    onSelect={(e) => e.preventDefault()} // Prevent menu closing on item select
                                >
                                    {member.name}
                                </DropdownMenuCheckboxItem>
                            )) : (
                                <DropdownMenuItem disabled>No team members available for assignment.</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Button type="submit" disabled={!newTaskDescription.trim()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </form>
        )}

        {sortedTasks.length > 0 ? (
          <ScrollArea className="h-[300px] pr-3"> {/* Added pr-3 for scrollbar spacing */}
            <ul className="space-y-3">
              {sortedTasks.map(task => (
                <ToDoItem 
                  key={task.id} 
                  task={task} 
                  currentUser={currentUser} 
                  onToggleTask={onToggleTask}
                  onRemoveTask={onRemoveTask}
                  canModify={canModify}
                  canDeleteSystemGenerated={canDeleteSystemGenerated}
                />
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="mx-auto h-10 w-10 mb-2"/>
            <p>No tasks yet for this client.</p>
            {canModify && <p className="text-sm">Add a task using the form above.</p>}
          </div>
        )}
      </CardContent>
      { tasks.length > 0 && 
        <CardFooter className="text-xs text-muted-foreground border-t pt-3">
            {tasks.filter(t => !t.isDone).length} task(s) pending.
        </CardFooter>
      }
    </Card>
  );
}

