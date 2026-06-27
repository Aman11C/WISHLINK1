'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, MapPin, DollarSign, Clock, Sparkles } from 'lucide-react';
import type { Wish } from '@/types';

export default function BrowseWishesPage() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('open');

  useEffect(() => {
    const fetchWishes = async () => {
      setLoading(true);
      let query = supabase
        .from('wishes')
        .select('*, profiles:user_id(*), wish_media(*)')
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      if (search) {
        query = query.textSearch('title', search);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching wishes:', error);
      } else {
        setWishes((data as Wish[]) || []);
      }
      setLoading(false);
    };
    fetchWishes();
  }, [search, category, status]);

  const categories = [
    'all', 'Textbooks & Education', 'Electronics & Gadgets', 'Furniture & Home',
    'Clothing & Fashion', 'Sports & Fitness', 'Books & Media', 'Collectibles & Hobbies',
    'Office & Professional', 'Event Tickets', 'Services & Skills', 'Bulk & Business',
    'Charity & Community', 'Other',
  ];

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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="matched">Matched</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat === 'all' ? 'All Categories' : cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search wishes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              <Button className="h-11 bg-primary hover:bg-primary/90" asChild>
                <Link href="/wishes/new">Post Wish</Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : wishes.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No wishes found</h3>
                <p className="text-muted-foreground mb-6">
                  {user ? 'Be the first to post a wish!' : 'Sign in to post your first wish.'}
                </p>
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <Link href="/wishes/new">Post a Wish</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishes.map((wish) => (
                  <Link key={wish.id} href={`/wishes/${wish.id}`}>
                    <Card className="border-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={statusColors[wish.status] || ''}>
                            {wish.status}
                          </Badge>
                          {wish.category && (
                            <span className="text-xs text-muted-foreground">{wish.category}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{wish.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {wish.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {wish.budget_min !== null && wish.budget_max !== null && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              ${wish.budget_min} - ${wish.budget_max}
                            </span>
                          )}
                          {wish.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {wish.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(wish.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-4 pt-3 border-t flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-semibold">
                            {wish.profiles?.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {wish.profiles?.username}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
