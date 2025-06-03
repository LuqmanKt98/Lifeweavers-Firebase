export type UserRole = "Super Admin" | "Admin" | "Clinician";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  vocation?: string; // e.g., Physiotherapist, Occupational Therapist
  password?: string; // Optional for display purposes, required for creation
  profileImage?: string; // Base64 encoded image or URL
}

export interface Client {
  id: string;
  name: string;
  dateAdded: string; // ISO string
  teamMemberIds?: string[]; // Array of clinician User IDs
  // Other client-specific info can be added here
}

export interface Attachment {
  id: string; // Unique ID for the attachment, e.g., a UUID or driveFileId
  name: string; // Filename, e.g., "progress_report.pdf"
  mimeType: string; // MIME type, e.g., "application/pdf", "image/jpeg"
  url: string; // URL to the file, e.g., a Google Drive link or a placeholder
  previewUrl?: string; // Optional URL for a direct preview (e.g., for images)
  fileType:
    | "pdf"
    | "image"
    | "video"
    | "document"
    | "spreadsheet"
    | "presentation"
    | "other";
}

export interface SessionNote {
  id: string;
  clientId: string;
  sessionNumber: number;
  dateOfSession: string; // ISO string
  attendingClinicianId: string;
  attendingClinicianName: string;
  attendingClinicianVocation?: string;
  content: string; // Rich text content / HTML
  attachments?: Attachment[]; // Array of attached files
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  // For version history, more fields would be needed
}

// Notifications and Messages Types

export type NotificationType =
  | "admin_broadcast"
  | "system_update"
  | "team_alert";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  timestamp: string; // ISO string
  read: boolean;
  recipientUserIds?: string[]; // Undefined or empty for broadcast to all, specific IDs for targeted
  relatedLink?: string; // Optional link, e.g., to a client page or session
  senderName?: string; // Name of the user who created the notification
  senderRole?: string; // Role of the user who created the notification
}

export type MessageThreadType = "dm" | "team_chat";

export interface MessageThread {
  id: string;
  type: MessageThreadType;
  name?: string; // e.g., "Team John Doe Chat" or "DM with Casey Clinician"
  participantIds: string[]; // User IDs
  clientTeamId?: string; // clientId if it's a team_chat
  lastMessageTimestamp: string; // ISO string
  lastMessageSnippet?: string;
  unreadCount: number; // Unread messages for the current user in this thread
  unreadCounts?: { [userId: string]: number }; // Unread counts per user
  avatarUrl?: string; // For DM or team avatar
  avatarFallback?: string;
  hasUnreadMessages?: boolean; // Helper for UI to show badges
}

export interface MessageReaction {
  emoji: string;
  userIds: string[]; // Array of user IDs who reacted with this emoji
  userNames: string[]; // Array of user names for display
}

export interface MessageReply {
  messageId: string; // ID of the message being replied to
  content: string; // Content of the original message
  senderName: string; // Name of the original sender
  senderId: string; // ID of the original sender
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  senderAvatarFallback?: string;
  content: string;
  timestamp: string; // ISO string
  type?: 'user' | 'system'; // Message type to distinguish between user and system messages
  isOwnMessage?: boolean; // Helper for UI rendering
  reactions?: MessageReaction[]; // Array of reactions to this message
  replyTo?: MessageReply; // If this message is a reply to another message
  isDeleted?: boolean; // If message is deleted
  deletedFor?: 'me' | 'everyone'; // Delete type
  deletedAt?: string; // When message was deleted
  editedAt?: string; // When message was last edited
}

// Special Notification for Banners
export interface SpecialNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "promo";
  link?: string;
  // isActive is managed by the component displaying the banner list
}

// Things To Do Feature
export interface ToDoTask {
  id: string;
  clientId: string;
  description: string;
  isDone: boolean;
  createdAt: string; // ISO string
  addedByUserId: string;
  addedByUserName: string;
  assignedToUserIds: string[]; // Array of user IDs task is assigned to
  assignedToUserNames?: string[]; // Array of names of users task is assigned to
  completedAt?: string; // ISO string
  completedByUserId?: string;
  completedByUserName?: string;
  dueDate?: string; // ISO string (just date part: YYYY-MM-DD)
  isSystemGenerated?: boolean;
  notes?: string; // Optional field for additional notes on the task
}

// Progress Review Report
export interface ProgressReviewReport {
  id: string;
  clientId: string;
  clientName: string; // Added for convenience in the report
  generatedAt: string; // ISO string
  generatedByUserId: string;
  generatedByUserName: string;
  reportHtmlContent: string; // AI-generated report text in HTML format
}

// Knowledge Base Article
export interface KnowledgeBaseArticle {
  id: string;
  slug: string; // URL-friendly identifier
  title: string;
  content: string; // HTML content
  excerpt?: string; // Short summary
  authorId: string;
  authorName: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publishedAt?: string; // ISO string, if published
  isPublished: boolean;
  tags?: string[];
  coverImageUrl?: string;
  attachments?: Attachment[];
  viewCount?: number;
}

// Resource Item
export interface Resource {
  id: string;
  slug: string; // URL-friendly identifier
  title: string;
  content: string; // HTML content for description or notes
  excerpt?: string; // Short summary
  authorId: string; // User ID of who added/manages it
  authorName: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publishedAt?: string; // ISO string, if published
  isPublished: boolean;
  tags?: string[];
  coverImageUrl?: string;
  attachments?: Attachment[]; // Key part for resources
  externalLink?: string; // If the resource is primarily an external link
  resourceType:
    | "document"
    | "video"
    | "website"
    | "tool"
    | "guide"
    | "image"
    | "other"; // To categorize resources
  viewCount?: number;
}

// Auth Context
export interface AuthContextType {
  user: User | null; // This will be the original logged-in user
  currentUser: User | null; // This will be the impersonated user, or original if not impersonating
  loading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  startImpersonation: (targetUser: User) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
