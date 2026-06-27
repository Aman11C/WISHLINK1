export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  reputation_score: number;
  verified: boolean;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
}

export interface Wish {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  deadline: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'open' | 'matched' | 'fulfilled' | 'closed' | 'expired';
  category: string | null;
  tags: string[] | null;
  preferred_types: string[] | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  wish_media?: WishMedia[];
  offers?: Offer[];
}

export interface WishMedia {
  id: string;
  wish_id: string;
  url: string;
  type: 'image' | 'video';
  order_index: number;
  created_at: string;
}

export interface Offer {
  id: string;
  wish_id: string;
  responder_id: string;
  type: 'sell' | 'gift' | 'exchange' | 'recommend' | 'store_suggest' | 'custom';
  message: string;
  price: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  profiles?: Profile;
  wish?: Wish;
  messages?: Message[];
}

export interface Message {
  id: string;
  offer_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
  offer?: Offer;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  offer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
  reviewee?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'offer' | 'message' | 'match' | 'status_change' | 'review' | 'system';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  entity_id: string;
  entity_type: 'user' | 'wish' | 'offer' | 'message';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
}

export const WISH_CATEGORIES = [
  'Textbooks & Education',
  'Electronics & Gadgets',
  'Furniture & Home',
  'Clothing & Fashion',
  'Sports & Fitness',
  'Books & Media',
  'Collectibles & Hobbies',
  'Office & Professional',
  'Event Tickets',
  'Services & Skills',
  'Bulk & Business',
  'Charity & Community',
  'Other',
] as const;

export const OFFER_TYPES = [
  'sell',
  'gift',
  'exchange',
  'recommend',
  'store_suggest',
  'custom',
] as const;

export const WISH_STATUSES = [
  'open',
  'matched',
  'fulfilled',
  'closed',
  'expired',
] as const;
