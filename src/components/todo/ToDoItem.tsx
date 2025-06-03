
// src/components/todo/ToDoItem.tsx
"use client";

import type { ToDoTask, User } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Trash2, UserCircle2 } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToDoItemProps {
  task: ToDoTask;
  currentUser: User;
  onToggleTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  canModify: boolean; // If current user can toggle or remove
  canDeleteSystemGenerated: boolean; // If current user (SuperAdmin) can delete system tasks
}

const getInitials = (name?: string) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0][0].toUpperCase();
  return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
};

export default function ToDoItem({ task, currentUser, onToggleTask, onRemoveTask, canModify, canDeleteSystemGenerated }: ToDoItemProps) {
  const isOverdue = task.dueDate && !task.isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && !task.isDone && isToday(new Date(task.dueDate));

  const canBeDeleted = canModify && (!task.isSystemGenerated || (task.isSystemGenerated && canDeleteSystemGenerated));

  return (
    <li 
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg transition-all",
        task.isDone ? "bg-secondary/40 opacity-70" : "bg-card shadow-sm hover:shadow-md",
        isOverdue ? "border-l-4 border-destructive" : "",
        isDueToday ? "border-l-4 border-yellow-500" : ""
      )}
    >
      <div className="flex items-start gap-3 flex-1">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.isDone}
          onCheckedChange={() => canModify && onToggleTask(task.id)}
          disabled={!canModify}
          className="mt-1"
          aria-label={task.isDone ? `Mark task as not done: ${task.description}` : `Mark task as done: ${task.description}`}
        />
        <div className="flex-1">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              "block text-sm font-medium cursor-pointer",
              task.isDone ? "line-through text-muted-foreground" : "text-foreground",
              isOverdue && !task.isDone ? "text-destructive font-semibold" : "",
              isDueToday && !task.isDone ? "text-yellow-600 dark:text-yellow-400 font-semibold" : ""
            )}
          >
            {task.description} {task.isSystemGenerated && <span className="text-xs text-primary/80">(System)</span>}
          </label>
          
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar className="h-4 w-4">
                            <AvatarImage src={`https://picsum.photos/seed/${task.addedByUserId}/20/20`} alt={task.addedByUserName} data-ai-hint="user avatar"/>
                            <AvatarFallback className="text-[8px]">{getInitials(task.addedByUserName)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent><p>Added by {task.addedByUserName}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                 <span>Added {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
            </div>

            {task.assignedToUserIds && task.assignedToUserIds.length > 0 && task.assignedToUserNames && task.assignedToUserNames.length > 0 && (
              <div className="flex items-center gap-1">
                <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">
                         {task.assignedToUserNames.join(', ')}
                       </span>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p>Assigned to: {task.assignedToUserNames.join(', ')}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {task.isDone && task.completedByUserName && task.completedAt && (
              <div className="flex items-center gap-1">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                         <Avatar className="h-4 w-4">
                            <AvatarImage src={`https://picsum.photos/seed/${task.completedByUserId}/20/20`} alt={task.completedByUserName} data-ai-hint="user avatar"/>
                            <AvatarFallback className="text-[8px]">{getInitials(task.completedByUserName)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent><p>Completed by {task.completedByUserName}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>Completed {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}</span>
              </div>
            )}
            {task.dueDate && (
              <div className={cn("flex items-center gap-1", isOverdue && !task.isDone ? "text-destructive font-medium" : "", isDueToday && !task.isDone ? "text-yellow-600 dark:text-yellow-400 font-medium" : "")}>
                <Calendar className="h-3 w-3" />
                <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {!task.isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && ' (Overdue)'}
                  {!task.isDone && isToday(new Date(task.dueDate)) && ' (Today)'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {canBeDeleted && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemoveTask(task.id)} 
          className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-auto sm:ml-2"
          title="Remove task"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}
