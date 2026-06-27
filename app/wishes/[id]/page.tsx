'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Sparkles, MapPin, DollarSign, Calendar, Tag, ArrowLeft, MessageSquare,
  Heart, Star, Clock, Send, Loader2, Gift
} from 'lucide-react';
import type { Wish, Offer } from '@/types';

export default function WishDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [wish, setWish] = useState<Wish | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerType, setOfferType] = useState('sell');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchWish = async () => {
      setLoading(true);
      const [wishRes, offersRes] = await Promise.all([
        supabase.from('wishes').select('*, profiles:user_id(*)').eq('id', id).single(),
        supabase.from('offers').select('*, profiles:responder_id(*)').eq('wish_id', id).order('created_at', { ascending: false }),
      ]);
      if (wishRes.error) {
        setError('Wish not found');
      } else {
        setWish(wishRes.data as Wish);
      }
      if (offersRes.error) {
        console.error('offers error:', offersRes.error);
      } else {
        setOffers((offersRes.data as Offer[]) || []);
      }
      setLoading(false);
    };
    fetchWish();
  }, [id]);

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to respond');
      return;
    }
    if (!offerMessage.trim()) {
      setError('Please enter a message');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('offers').insert({
      wish_id: id as string,
      type: offerType,
      message: offerMessage.trim(),
      price: offerPrice ? parseInt(offerPrice) : null,
    });
    if (error) {
      setError(error.message);
    } else {
      setOfferDialogOpen(false);
      setOfferMessage('');
      setOfferPrice('');
      const { data } = await supabase.from('offers').select('*, profiles:responder_id(*)').eq('wish_id', id).order('created_at', { ascending: false });
      setOffers((data as Offer[]) || []);
    }
    setSubmitting(false);
  };

  const statusColors: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    matched: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    fulfilled: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const offerTypeLabels: Record<string, string> = {
    sell: 'Sell', gift: 'Gift', exchange: 'Exchange', recommend: 'Recommend',
    store_suggest: 'Local Store', custom: 'Custom',
  };

  const offerTypeIcons: Record<string, React.ReactNode> = {
    sell: <DollarSign className="w-4 h-4" />,
    gift: <Gift className="w-4 h-4" />,
    exchange: <Sparkles className="w-4 h-4" />,
    recommend: <Star className="w-4 h-4" />,
    store_suggest: <MapPin className="w-4 h-4" />,
    custom: <Sparkles className="w-4 h-4" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!wish) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Wish not found</h1>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/wishes">Browse Wishes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === wish.user_id;
  const canRespond = user && !isOwner && wish.status === 'open';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.push('/wishes')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to browse
        </Button>

        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className={statusColors[wish.status] || ''}>{wish.status}</Badge>
              {wish.category && <Badge variant="outline">{wish.category}</Badge>}
              {wish.profiles?.verified && <Badge variant="outline" className="border-primary text-primary">Verified</Badge>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-4">{wish.title}</h1>

            <div className="flex items-center gap-3 mb-6">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {wish.profiles?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/profile/${wish.user_id}`} className="font-medium hover:text-primary transition-colors">
                  {wish.profiles?.username}
                </Link>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {wish.profiles?.reputation_score || 0} rep
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(wish.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{wish.description}</p>

            <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
              {wish.budget_min !== null && wish.budget_max !== null && (
                <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                  ${wish.budget_min} - ${wish.budget_max}
                </span>
              )}
              {wish.location && (
                <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                  <MapPin className="w-4 h-4" />
                  {wish.location}
                </span>
              )}
              {wish.deadline && (
                <span className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  Deadline: {new Date(wish.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            {wish.tags && wish.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {wish.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium text-muted-foreground mr-2">Preferred fulfillment:</span>
              {wish.preferred_types?.map((type) => (
                <Badge key={type} variant="outline" className="capitalize">
                  {type === 'store_suggest' ? 'Local Store' : type}
                </Badge>
              ))}
            </div>

            {isOwner && (
              <div className="flex gap-2 mt-6">
                <Button variant="outline" asChild>
                  <Link href={`/wishes/${wish.id}/edit`}>Edit Wish</Link>
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={async () => {
                  if (confirm('Are you sure you want to delete this wish?')) {
                    await supabase.from('wishes').delete().eq('id', wish.id);
                    router.push('/wishes');
                  }
                }}>
                  Delete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offers Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Offers ({offers.length})
          </h2>
          {canRespond && (
            <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Send className="w-4 h-4 mr-1" />
                  Respond
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Respond to Wish</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitOffer} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label>Response Type</Label>
                    <Select value={offerType} onValueChange={setOfferType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(offerTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {offerType === 'sell' && (
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" placeholder="Enter price" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Describe your offer..."
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Offer'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {offers.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">No offers yet</h3>
              <p className="text-muted-foreground text-sm">
                {canRespond ? 'Be the first to respond!' : 'Check back later for responses.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {offerTypeIcons[offer.type]}
                      </div>
                      <div>
                        <span className="font-semibold text-sm capitalize">{offerTypeLabels[offer.type]}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          by {offer.profiles?.username}
                        </span>
                      </div>
                    </div>
                    <Badge variant={offer.status === 'pending' ? 'secondary' : 'outline'}>
                      {offer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{offer.message}</p>
                  {offer.price && (
                    <span className="text-sm font-medium text-primary">${offer.price}</span>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(offer.created_at).toLocaleDateString()}
                    </span>
                    {user && (isOwner || offer.responder_id === user.id) && (
                      <Button variant="ghost" size="sm" className="h-7 ml-auto" asChild>
                        <Link href={`/messages?offer=${offer.id}`}>
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Message
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
