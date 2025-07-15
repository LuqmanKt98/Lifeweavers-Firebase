
// src/components/dashboards/ClinicianDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import type { User, Client, KnowledgeBaseArticle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, Clock, ArrowRight, BookOpen, FileText } from 'lucide-react'; // Added BookOpen, FileText
import { formatDistanceToNow, format } from 'date-fns';
import { getAllArticles } from '@/lib/firebase/knowledge-base'; // Import real KB data

interface ClinicianDashboardProps {
  user: User;
  clients: Client[];
  team: User[];
}

export default function ClinicianDashboard({ user, clients, team }: ClinicianDashboardProps) {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const last5Clients = clients.slice(0, 5);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const articlesData = await getAllArticles(true); // Only published articles
        setArticles(articlesData.slice(0, 5)); // Get recent 5 articles
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Helper function to check if users share any clients
  const doUsersShareAnyClient = (userId1: string, userId2: string): boolean => {
    return clients.some(client =>
      client.teamMemberIds?.includes(userId1) && client.teamMemberIds?.includes(userId2)
    );
  };

  const visibleTeamMembers = team.filter(member => {
    if (member.id === user.id) return false; // Don't show self
    if (member.role === 'Admin' || member.role === 'Super Admin') return true; // Always show admins
    if (member.role === 'Clinician') {
      return doUsersShareAnyClient(user.id, member.id);
    }
    return false;
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Your Recent Clients
          </CardTitle>
          <CardDescription>Quick access to your recently managed clients.</CardDescription>
        </CardHeader>
        <CardContent>
          {last5Clients.length > 0 ? (
            <ul className="space-y-4">
              {last5Clients.map((client) => (
                <li key={client.id} className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Client since: {formatDistanceToNow(new Date(client.dateAdded), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/clients/${client.id}`}>View Notes <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No clients assigned or recently accessed.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Latest Knowledge
          </CardTitle>
          <CardDescription>Recent updates from the Knowledge Base.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading articles...</p>
          ) : articles.length > 0 ? (
            <ul className="space-y-3">
              {articles.map(article => (
                <li key={article.id} className="p-2.5 bg-secondary/30 hover:bg-secondary/60 rounded-lg transition-colors">
                  <Link href={`/knowledge-base/${article.id}`} className="block group">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          By {article.authorName} - {format(new Date(article.publishedAt || article.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No knowledge base articles found.</p>
          )}
           {articles.length > 0 && (
             <Button variant="link" asChild className="mt-3 px-0">
               <Link href="/knowledge-base">View All Articles <ArrowRight className="ml-1 h-3 w-3" /></Link>
             </Button>
           )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 md:col-span-2"> {/* Changed span for team details to take full width */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Team Details
          </CardTitle>
          <CardDescription>Your colleagues at LWV CLINIC E-DOC.</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleTeamMembers.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleTeamMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg list-none">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.vocation || member.role}</p>
                  </div>
                </li>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No other relevant team members to display based on shared clients.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
