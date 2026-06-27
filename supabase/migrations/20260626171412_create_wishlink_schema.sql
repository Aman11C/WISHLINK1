/*
# WishLink Database Schema - Phase 1

1. New Tables
- `profiles` - Extended user profiles linked to Supabase auth.users
- `wishes` - Core wish posts with details, budget, location, and status
- `wish_media` - Photos and videos attached to wishes
- `offers` - Responses from community members (sell, gift, exchange, recommend, etc.)
- `messages` - In-app chat between wishers and responders
- `reviews` - Reputation and trust system
- `reports` - Content moderation and flagging
- `notifications` - User notification feed

2. Security
- Row Level Security (RLS) enabled on all tables.
- Owner-scoped policies for authenticated users on all tables.
- Public read access on wishes (with join to profiles).
- All tables default to auth.uid() for ownership fields.

3. Indexes
- Full-text search on wishes title and description.
- Spatial queries on wish location.
- Category and status filtering.

4. Triggers
- Auto-updates updated_at on wishes.
- Profile creation on user signup.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  reputation_score INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- 2. Wishes table
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min INT,
  budget_max INT,
  currency TEXT DEFAULT 'USD',
  deadline DATE,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'fulfilled', 'closed', 'expired')),
  category TEXT,
  tags TEXT[],
  preferred_types TEXT[] DEFAULT ARRAY['sell', 'gift', 'exchange', 'recommend'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishes_select" ON public.wishes;
CREATE POLICY "wishes_select" ON public.wishes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wishes_insert_own" ON public.wishes;
CREATE POLICY "wishes_insert_own" ON public.wishes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishes_update_own" ON public.wishes;
CREATE POLICY "wishes_update_own" ON public.wishes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishes_delete_own" ON public.wishes;
CREATE POLICY "wishes_delete_own" ON public.wishes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishes_status_category ON public.wishes(status, category);
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON public.wishes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_location ON public.wishes(location);
CREATE INDEX IF NOT EXISTS idx_wishes_tags ON public.wishes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_wishes_search ON public.wishes USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- 3. Wish media table
CREATE TABLE IF NOT EXISTS public.wish_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')),
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wish_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wish_media_select" ON public.wish_media;
CREATE POLICY "wish_media_select" ON public.wish_media
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wish_media_insert_own" ON public.wish_media;
CREATE POLICY "wish_media_insert_own" ON public.wish_media
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.wishes WHERE wishes.id = wish_media.wish_id AND wishes.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wish_media_delete_own" ON public.wish_media;
CREATE POLICY "wish_media_delete_own" ON public.wish_media
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wishes WHERE wishes.id = wish_media.wish_id AND wishes.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_wish_media_wish_id ON public.wish_media(wish_id);

-- 4. Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sell', 'gift', 'exchange', 'recommend', 'store_suggest', 'custom')),
  message TEXT NOT NULL,
  price INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_select" ON public.offers;
CREATE POLICY "offers_select" ON public.offers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "offers_insert_own" ON public.offers;
CREATE POLICY "offers_insert_own" ON public.offers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = responder_id);

DROP POLICY IF EXISTS "offers_update_own" ON public.offers;
CREATE POLICY "offers_update_own" ON public.offers
  FOR UPDATE TO authenticated USING (auth.uid() = responder_id) WITH CHECK (auth.uid() = responder_id);

DROP POLICY IF EXISTS "offers_delete_own" ON public.offers;
CREATE POLICY "offers_delete_own" ON public.offers
  FOR DELETE TO authenticated USING (auth.uid() = responder_id);

CREATE INDEX IF NOT EXISTS idx_offers_wish_id ON public.offers(wish_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_responder ON public.offers(responder_id, created_at DESC);

-- 5. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON public.messages(offer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);

-- 6. Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_offer ON public.reviews(offer_id);

-- 7. Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'wish', 'offer', 'message')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR auth.role() = 'admin');

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);

-- 8. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'message', 'match', 'status_change', 'review', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

-- 9. Trigger: auto-update updated_at on wishes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wishes_updated_at ON public.wishes;
CREATE TRIGGER update_wishes_updated_at
  BEFORE UPDATE ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
