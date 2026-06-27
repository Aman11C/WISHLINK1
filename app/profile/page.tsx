'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Calendar, Sparkles, MessageSquare } from 'lucide-react';
import type { Profile, Wish, Review } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wishes' | 'reviews'>('wishes');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const profileId = user.id;

      const [profileRes, wishesRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('wishes').select('*').eq('user_id', profileId).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, reviewer:reviewer_id(*)').eq('reviewee_id', profileId).order('created_at', { ascending: false }),
      ]);

      if (profileRes.error) console.error('profile error:', profileRes.error);
      if (wishesRes.error) console.error('wishes error:', wishesRes.error);
      if (reviewsRes.error) console.error('reviews error:', reviewsRes.error);

      setProfile((profileRes.data as Profile | null) || null);
      setWishes((wishesRes.data as Wish[] | null) || []);
      setReviews((reviewsRes.data as Review[] | null) || []);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

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
        {/* Profile Header */}
        <Card className="border-0 shadow-md mb-8">
          <CardContent className="p-6 sm:p-8">
            {loading ? (
              <div className="flex items-center gap-6">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h1>
                    {profile?.verified && (
                      <Badge variant="outline" className="border-primary text-primary">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profile?.username}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {profile?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {profile?.reputation_score || 0} reputation
                    </span>
                  </div>
                </div>
                {profile?.id === user?.id && (
                  <Button variant="outline" asChild>
                    <Link href="/profile/edit">Edit Profile</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'wishes' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'wishes' ? 'bg-primary hover:bg-primary/90' : ''}
            onClick={() => setActiveTab('wishes')}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Wishes ({wishes.length})
          </Button>
          <Button
            variant={activeTab === 'reviews' ? 'default' : 'ghost'}
            size="sm"
            className={activeTab === 'reviews' ? 'bg-primary hover:bg-primary/90' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            <Star className="w-4 h-4 mr-1" />
            Reviews ({reviews.length})
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : activeTab === 'wishes' ? (
          wishes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No wishes posted yet</p>
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/wishes/new">Post Your First Wish</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishes.map((wish) => (
                <Link key={wish.id} href={`/wishes/${wish.id}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{wish.title}</h3>
                        <Badge className={statusColors[wish.status] || ''}>{wish.status}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{wish.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{wish.category}</span>
                        <span>{new Date(wish.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : (
          reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        by {review.reviewer?.username}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm">{review.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
