'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Bell, MessageSquare, Heart, Star, CheckCircle2, Package, AlertCircle,
  Clock, ArrowRight
} from 'lucide-react';
import type { Notification } from '@/types';

const notificationIcons: Record<string, React.ReactNode> = {
  offer: <Package className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  match: <Heart className="w-5 h-5" />,
  status_change: <CheckCircle2 className="w-5 h-5" />,
  review: <Star className="w-5 h-5" />,
  system: <AlertCircle className="w-5 h-5" />,
};

const notificationColors: Record<string, string> = {
  offer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  message: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  match: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  status_change: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('notifications error:', error);
      } else {
        setNotifications((data as Notification[]) || []);
      }
      setLoading(false);
    };
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view notifications</h1>
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="w-7 h-7" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-white ml-2">{unreadCount} new</Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Stay updated on your wishes and offers</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">Activity on your wishes and offers will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border-0 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                  n.is_read ? 'bg-white dark:bg-gray-900' : 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary'
                }`}
                onClick={() => {
                  markRead(n.id);
                  if (n.data?.wishId) {
                    window.location.href = `/wishes/${n.data.wishId}`;
                  } else if (n.data?.offerId) {
                    window.location.href = `/messages/${n.data.offerId}`;
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${notificationColors[n.type] || ''}`}>
                    {notificationIcons[n.type] || <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
