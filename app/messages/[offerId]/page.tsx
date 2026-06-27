'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Loader2, Paperclip, MessageSquare } from 'lucide-react';
import type { Message, Offer, Profile } from '@/types';

export default function ChatPage() {
  const { offerId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !offerId) return;
    const fetchData = async () => {
      setLoading(true);
      const [offerRes, messagesRes] = await Promise.all([
        supabase
          .from('offers')
          .select('*, wish:wish_id(*), profiles:responder_id(*)')
          .eq('id', offerId)
          .single(),
        supabase
          .from('messages')
          .select('*, sender:sender_id(*), receiver:receiver_id(*)')
          .eq('offer_id', offerId)
          .order('created_at', { ascending: true }),
      ]);

      if (offerRes.error) {
        console.error('offer error:', offerRes.error);
        setLoading(false);
        return;
      }
      const offerData = offerRes.data as any;
      setOffer(offerData as Offer);

      const otherId = offerData.wish?.user_id === user.id ? offerData.responder_id : offerData.wish?.user_id;
      if (otherId) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single();
        setOtherUser(profile as Profile);
      }

      if (messagesRes.error) {
        console.error('messages error:', messagesRes.error);
      } else {
        setMessages((messagesRes.data as Message[]) || []);
      }
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel(`offer-${offerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `offer_id=eq.${offerId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.receiver_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, offerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !otherUser || !offer) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      offer_id: offerId as string,
      sender_id: user.id,
      receiver_id: otherUser.id,
      content: newMessage.trim(),
    });
    if (error) {
      console.error('send error:', error);
    } else {
      setNewMessage('');
      inputRef.current?.focus();
    }
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view messages</h1>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push('/auth/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col flex-1" style={{ maxHeight: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.push('/messages')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{otherUser?.username || 'Loading...'}</p>
            <p className="text-xs text-muted-foreground truncate">{offer?.wish?.title || 'Unknown Wish'}</p>
          </div>
          <div className="text-xs text-muted-foreground capitalize">{offer?.type}</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground">No messages yet. Say hello!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;
                const showDate = index === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            <span className="ml-1">{msg.is_read ? 'Seen' : 'Sent'}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 pb-2 border-t mt-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-11"
            disabled={sending || loading}
          />
          <Button type="submit" className="h-11 w-11 p-0 bg-primary hover:bg-primary/90" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
