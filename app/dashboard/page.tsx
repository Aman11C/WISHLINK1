'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Plus, MessageSquare, Star, TrendingUp, Clock, MapPin } from 'lucide-react';
import type { Wish, Offer, Profile } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [myWishes, setMyWishes] = useState<Wish[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [wishesRes, offersRes] = await Promise.all([
        supabase
          .from('wishes')
          .select('*, profiles:user_id(*), wish_media(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('offers')
          .select('*, wish:wish_id(*), profiles:responder_id(*)')
          .eq('responder_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (wishesRes.error) console.error('wishes error:', wishesRes.error);
      if (offersRes.error) console.error('offers error:', offersRes.error);
      setMyWishes((wishesRes.data as Wish[]) || []);
      setMyOffers((offersRes.data as Offer[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    wishesPosted: myWishes.length,
    wishesOpen: myWishes.filter((w) => w.status === 'open').length,
    offersSent: myOffers.length,
    offersPending: myOffers.filter((o) => o.status === 'pending').length,
  };

  const statusColors: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    matched: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    fulfilled: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.full_name || user.username}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Wishes Posted', value: stats.wishesPosted, icon: Sparkles },
            { label: 'Open Wishes', value: stats.wishesOpen, icon: Clock },
            { label: 'Offers Sent', value: stats.offersSent, icon: MessageSquare },
            { label: 'Pending Offers', value: stats.offersPending, icon: TrendingUp },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Wishes */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">My Wishes</CardTitle>
              <Button size="sm" variant="ghost" className="h-8" asChild>
                <Link href="/wishes/new">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : myWishes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No wishes posted yet</p>
                  <Button className="bg-primary hover:bg-primary/90" asChild>
                    <Link href="/wishes/new">Post Your First Wish</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myWishes.map((wish) => (
                    <Link key={wish.id} href={`/wishes/${wish.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{wish.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge className={statusColors[wish.status] || ''}>{wish.status}</Badge>
                            {wish.category && <span>{wish.category}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Offers */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">My Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : myOffers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No offers sent yet</p>
                  <Button variant="outline" asChild>
                    <Link href="/wishes">Browse Wishes</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOffers.map((offer) => (
                    <Link key={offer.id} href={`/wishes/${offer.wish_id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{offer.wish?.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant={offer.status === 'pending' ? 'secondary' : 'outline'}>
                              {offer.status}
                            </Badge>
                            <span className="capitalize">{offer.type}</span>
                            {offer.price && <span>${offer.price}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
