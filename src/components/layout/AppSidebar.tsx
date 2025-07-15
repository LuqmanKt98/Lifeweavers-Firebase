// src/components/layout/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageSquare,
  LifeBuoy,
  FolderSync,
  BookOpen,
  Package,
  CalendarDays,
} from "lucide-react"; // Added Package for Resources and CalendarDays for Appointments
import { useAuth } from "@/contexts/AuthContext";
import UnreadMessageBadge from "@/components/messages/UnreadMessageBadge";

interface AppSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function AppSidebar({ isOpen, toggleSidebar }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/cases", label: "Cases", icon: Users },
    { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/resources", label: "Resources", icon: Package }, // Added Resources link
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ];

  if (user?.role === "Super Admin" || user?.role === "Admin") {
    if (!navItems.find((item) => item.href === "/admin/users")) {
      navItems.push({
        href: "/admin/users",
        label: "User Management",
        icon: Settings,
      });
    }
    if (!navItems.find((item) => item.href === "/admin/cases")) {
      navItems.push({
        href: "/admin/cases",
        label: "Cases Management",
        icon: FolderSync,
      });
    }

    // Future: Add link to /admin/knowledge-base and /admin/resources for admins to manage content
  }

  const commonLinkClasses =
    "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors";
  const activeLinkClasses = "bg-primary/10 text-primary";
  const inactiveLinkClasses =
    "hover:bg-accent hover:text-accent-foreground text-muted-foreground";
  const iconClasses = "mr-3 h-5 w-5";
  const labelClasses = "truncate";

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:w-16"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border px-4",
            isOpen ? "h-16 justify-between" : "h-16 justify-center"
          )}
        >
          {isOpen ? (
            <Link
              href="/dashboard"
              className="font-bold text-lg text-sidebar-primary hover:text-sidebar-primary/80 transition-colors"
            >
              LWV CLINIC E-DOC
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-sidebar-primary hover:text-sidebar-primary/80 transition-colors"
            >
              <LifeBuoy className="h-7 w-7" />
            </Link>
          )}
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className="space-y-1 p-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  commonLinkClasses,
                  pathname === item.href ||
                    (item.href === "/knowledge-base" &&
                      pathname.startsWith("/knowledge-base")) ||
                    (item.href === "/resources" &&
                      pathname.startsWith("/resources")) ||
                    (item.href === "/cases" &&
                      pathname.startsWith("/cases")) ||
                    (item.href === "/admin/users" &&
                      pathname.startsWith("/admin/users")) ||
                    (item.href === "/admin/cases" &&
                      pathname.startsWith("/admin/cases"))
                    ? activeLinkClasses
                    : inactiveLinkClasses,
                  !isOpen && "justify-center",
                  "relative"
                )}
                title={isOpen ? "" : item.label}
              >
                <item.icon className={cn(iconClasses, !isOpen && "mr-0")} />
                {isOpen && <span className={labelClasses}>{item.label}</span>}
                {item.href === "/messages" && <UnreadMessageBadge />}
              </Link>
            ))}
            {/* Client list removed from here */}
          </nav>
        </ScrollArea>

        <div className="mt-auto border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn("w-full justify-start", !isOpen && "justify-center")}
          >
            {isOpen ? (
              <ChevronLeft className={iconClasses} />
            ) : (
              <ChevronRight className={iconClasses} />
            )}
            {isOpen && (
              <span className={labelClasses}>
                {isOpen ? "Collapse" : "Expand"}
              </span>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
