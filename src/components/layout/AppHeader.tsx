
// src/components/layout/AppHeader.tsx
"use client";

import type { User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCircle, Settings, Moon, Sun, Menu, X, CalendarDays, Clock, LogIn, UserCheck } from 'lucide-react'; // Added LogIn, UserCheck
import { useTheme } from "next-themes";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast'; // Added useToast
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  user: User; // This should be the currentUser from AuthContext
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  pageTitle: string;
}

export default function AppHeader({ user: activeUser, toggleSidebar, sidebarOpen, pageTitle }: AppHeaderProps) {
  const { logout, stopImpersonation, isImpersonating, user: originalUser } = useAuth();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handleExitImpersonation = async () => {
    await stopImpersonation();
  };

  return (
    <>
      {isImpersonating && originalUser && activeUser && (
        <div className="bg-yellow-500 text-black text-center p-2 text-sm font-semibold flex items-center justify-center gap-4">
          <span>
            Currently impersonating: <strong>{activeUser.name}</strong> (as {originalUser.name} - Super Admin)
          </span>
          <Button onClick={handleExitImpersonation} size="sm" variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <LogIn className="mr-2 h-4 w-4 transform rotate-180" /> Exit Impersonation
          </Button>
        </div>
      )}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1 md:hidden flex-shrink-0">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 hidden md:inline-flex flex-shrink-0">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground truncate">
            {pageTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {currentDateTime && (
            <div className="text-xs sm:text-sm text-muted-foreground hidden lg:flex items-center gap-1.5" aria-live="polite" aria-atomic="true">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span suppressHydrationWarning>{format(currentDateTime, 'eeee, MMM d, yyyy')}</span>
              <span className="text-muted-foreground/50">|</span>
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span suppressHydrationWarning>{format(currentDateTime, 'HH:mm:ss')}</span>
            </div>
          )}
          <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
          </Button>
          {activeUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={activeUser.profileImage || `https://picsum.photos/seed/${activeUser.id}/40/40`}
                      alt={activeUser.name}
                      data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{getInitials(activeUser.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{activeUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {activeUser.email} ({activeUser.role})
                    </p>
                    {isImpersonating && originalUser && (
                       <p className="text-xs leading-none text-yellow-600 dark:text-yellow-400 mt-1">
                         (Impersonating from: {originalUser.name})
                       </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile-settings')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                {isImpersonating && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExitImpersonation} className="text-yellow-600 dark:text-yellow-400 focus:bg-yellow-100 dark:focus:bg-yellow-700/50 focus:text-yellow-700 dark:focus:text-yellow-300">
                      <LogIn className="mr-2 h-4 w-4 transform rotate-180" />
                      <span>Exit Impersonation</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </>
  );
}
