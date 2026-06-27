'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft, X, DollarSign, MapPin, Calendar, Tag, ImagePlus, Trash2 } from 'lucide-react';
import { WISH_CATEGORIES } from '@/types';

const OFFER_TYPES = [
  { value: 'sell', label: 'Sell' },
  { value: 'gift', label: 'Gift' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'recommend', label: 'Recommend' },
  { value: 'store_suggest', label: 'Local Store' },
  { value: 'custom', label: 'Custom' },
];

export default function EditWishPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [wish, setWish] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('open');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [newMediaPreview, setNewMediaPreview] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchWish = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishes')
        .select('*, wish_media(*)')
        .eq('id', id)
        .single();
      if (error || !data) {
        setError('Wish not found');
        setLoading(false);
        return;
      }
      if (data.user_id !== user.id) {
        setError('You can only edit your own wishes');
        setLoading(false);
        return;
      }
      setWish(data);
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category || '');
      setBudgetMin(data.budget_min?.toString() || '');
      setBudgetMax(data.budget_max?.toString() || '');
      setLocation(data.location || '');
      setDeadline(data.deadline || '');
      setStatus(data.status);
      setTags(data.tags || []);
      setPreferredTypes(data.preferred_types || []);
      setMedia(data.wish_media || []);
      setLoading(false);
    };
    fetchWish();
  }, [user, id]);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const togglePreferredType = (type: string) => {
    setPreferredTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const total = media.length + newMediaFiles.length + files.length;
    if (total > 5) {
      setError('Maximum 5 media files allowed');
      return;
    }
    const newFiles = Array.from(files);
    setNewMediaFiles((prev) => [...prev, ...newFiles]);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setNewMediaPreview((prev) => [...prev, ...previews]);
  };

  const removeNewMedia = (index: number) => {
    setNewMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setNewMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = async (mediaId: string) => {
    await supabase.from('wish_media').delete().eq('id', mediaId);
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { error: updateError } = await supabase
      .from('wishes')
      .update({
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        budget_min: budgetMin ? parseInt(budgetMin) : null,
        budget_max: budgetMax ? parseInt(budgetMax) : null,
        location: location || null,
        deadline: deadline || null,
        status,
        tags: tags.length > 0 ? tags : null,
        preferred_types: preferredTypes,
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Upload new media
    if (newMediaFiles.length > 0) {
      const wishId = id as string;
      const startIndex = media.length;
      for (let i = 0; i < newMediaFiles.length; i++) {
        const file = newMediaFiles[i];
        const ext = file.name.split('.').pop();
        const fileName = `${wishId}/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('wish-media').upload(fileName, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('wish-media').getPublicUrl(fileName);
          await supabase.from('wish_media').insert({
            wish_id: wishId,
            url: urlData.publicUrl,
            type: file.type.startsWith('video') ? 'video' : 'image',
            order_index: startIndex + i,
          });
        }
      }
    }

    router.push(`/wishes/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/wishes')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Wishes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeft className="w-6 h-6 cursor-pointer" onClick={() => router.push(`/wishes/${id}`)} />
            Edit Wish
          </h1>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WISH_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin" className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Budget Min</Label>
                  <Input id="budgetMin" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax" className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Budget Max</Label>
                  <Input id="budgetMax" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="h-11" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Location</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Deadline</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Tags</Label>
                <div className="flex gap-2">
                  <Input placeholder="Add a tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="h-11" />
                  <Button type="button" variant="outline" onClick={addTag} className="h-11">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag}<X className="w-3 h-3 ml-1" /></Badge>)}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Fulfillment Types</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {OFFER_TYPES.map((type) => (
                    <div key={type.value} className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${preferredTypes.includes(type.value) ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`} onClick={() => togglePreferredType(type.value)}>
                      <Checkbox checked={preferredTypes.includes(type.value)} className="mt-0.5" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" />Media</Label>
                <div className="flex flex-wrap gap-3">
                  {media.map((m) => (
                    <div key={m.id} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingMedia(m.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newMediaPreview.map((preview, i) => (
                    <div key={`new-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewMedia(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {media.length + newMediaFiles.length < 5 && (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add</span>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} multiple />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="h-11 bg-primary hover:bg-primary/90 flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => router.push(`/wishes/${id}`)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
