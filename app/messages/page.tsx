'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';
import type { Message, Offer, Wish, Profile } from '@/types';

interface Conversation {
  offer_id: string;
  wish_title: string;
  other_user: Profile;
  last_message: Message;
  unread_count: number;
  offer_type: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      setLoading(true);
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, offer:offer_id(*, wish:wish_id(*), profiles:responder_id(*)), sender:sender_id(*), receiver:receiver_id(*)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('messages error:', error);
        setLoading(false);
        return;
      }

      const grouped = new Map<string, Message[]>();
      (messages as any[]).forEach((msg) => {
        if (!grouped.has(msg.offer_id)) grouped.set(msg.offer_id, []);
        grouped.get(msg.offer_id)!.push(msg);
      });

      const convs: Conversation[] = [];
      grouped.forEach((msgs, offerId) => {
        const last = msgs[0];
        const unread = msgs.filter((m) => m.receiver_id === user.id && !m.is_read).length;
        const offer = last.offer as any;
        const otherUser = last.sender_id === user.id ? last.receiver : last.sender;
        convs.push({
          offer_id: offerId,
          wish_title: offer?.wish?.title || 'Unknown Wish',
          other_user: otherUser as Profile,
          last_message: last as Message,
          unread_count: unread,
          offer_type: offer?.type || 'message',
        });
      });

      setConversations(convs);
      setLoading(false);
    };
    fetchConversations();

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view messages</h1>
          <Link href="/auth/login">
            <span className="text-primary font-semibold hover:underline">Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">Your conversations with wishers and responders</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-2">Start by responding to a wish or messaging someone who responded to yours.</p>
              <Link href="/wishes" className="text-primary font-semibold hover:underline">
                Browse Wishes
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Link key={conv.offer_id} href={`/messages/${conv.offer_id}`}>
                <Card className="border-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                        {conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold truncate">
                            {conv.other_user?.username || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-2">
                            {conv.unread_count > 0 && (
                              <Badge className="bg-primary text-white">{conv.unread_count}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(conv.last_message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {conv.last_message.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{conv.wish_title}</span>
                          <span className="capitalize">{conv.offer_type}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
