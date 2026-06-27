'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import Navbar from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, X, DollarSign, MapPin, Calendar, Tag, ImagePlus, Trash2 } from 'lucide-react';
import { WISH_CATEGORIES } from '@/types';

const OFFER_TYPES = [
  { value: 'sell', label: 'Sell', desc: 'Offer to sell the item' },
  { value: 'gift', label: 'Gift', desc: 'Give it for free' },
  { value: 'exchange', label: 'Exchange', desc: 'Trade for something else' },
  { value: 'recommend', label: 'Recommend', desc: 'Suggest an alternative' },
  { value: 'store_suggest', label: 'Local Store', desc: 'Point to a nearby shop' },
  { value: 'custom', label: 'Custom', desc: 'Make something custom' },
];

export default function NewWishPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [preferredTypes, setPreferredTypes] = useState<string[]>(['sell', 'gift', 'exchange', 'recommend']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const togglePreferredType = (type: string) => {
    setPreferredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - mediaFiles.length);
    setMediaFiles((prev) => [...prev, ...newFiles]);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setMediaPreview((prev) => [...prev, ...previews]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Please sign in to post a wish');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    if (preferredTypes.length === 0) {
      setError('Select at least one preferred fulfillment type');
      return;
    }

    setLoading(true);
    const { data, error: insertError } = await supabase
      .from('wishes')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        budget_min: budgetMin ? parseInt(budgetMin) : null,
        budget_max: budgetMax ? parseInt(budgetMax) : null,
        location: location || null,
        deadline: deadline || null,
        tags: tags.length > 0 ? tags : null,
        preferred_types: preferredTypes,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Upload media
    if (mediaFiles.length > 0 && data) {
      setUploading(true);
      const wishId = data.id;
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const ext = file.name.split('.').pop();
        const fileName = `${wishId}/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('wish-media').upload(fileName, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('wish-media').getPublicUrl(fileName);
          await supabase.from('wish_media').insert({
            wish_id: wishId,
            url: urlData.publicUrl,
            type: file.type.startsWith('video') ? 'video' : 'image',
            order_index: i,
          });
        }
      }
      setUploading(false);
    }

    router.push(`/wishes/${data.id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to post a wish</h1>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <a href="/auth/login">Sign In</a>
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
            <Sparkles className="w-7 h-7 text-primary" />
            Post a Wish
          </h1>
          <p className="text-muted-foreground mt-1">Describe what you need and let the community help.</p>
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Looking for a used MacBook Pro 2021"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe exactly what you need, condition preferences, why you need it, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {WISH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin" className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Budget Min ($)
                  </Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    placeholder="0"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax" className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Budget Max ($)
                  </Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    placeholder="500"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="h-11"
                  />
                  <Button type="button" variant="outline" onClick={addTag} className="h-11">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Preferred Fulfillment Types *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {OFFER_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        preferredTypes.includes(type.value)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                      onClick={() => togglePreferredType(type.value)}
                    >
                      <Checkbox
                        checked={preferredTypes.includes(type.value)}
                        onCheckedChange={() => togglePreferredType(type.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <ImagePlus className="w-3.5 h-3.5" />
                  Photos / Videos
                </Label>
                <div className="flex flex-wrap gap-3">
                  {mediaPreview.map((preview, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 5 && (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add</span>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} multiple />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Up to 5 images or videos (max 10MB each)</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="h-11 bg-primary hover:bg-primary/90 flex-1" disabled={loading || uploading}>
                  {loading || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Wish'}
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => router.push('/wishes')}>
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
