export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          reputation_score?: number;
          verified?: boolean;
          role?: 'user' | 'moderator' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          reputation_score?: number;
          verified?: boolean;
          role?: 'user' | 'moderator' | 'admin';
          created_at?: string;
        };
      };
      wishes: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description: string;
          budget_min?: number | null;
          budget_max?: number | null;
          currency?: string;
          deadline?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          status?: 'open' | 'matched' | 'fulfilled' | 'closed' | 'expired';
          category?: string | null;
          tags?: string[] | null;
          preferred_types?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          currency?: string;
          deadline?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          status?: 'open' | 'matched' | 'fulfilled' | 'closed' | 'expired';
          category?: string | null;
          tags?: string[] | null;
          preferred_types?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wish_media: {
        Row: {
          id: string;
          wish_id: string;
          url: string;
          type: 'image' | 'video' | null;
          order_index: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wish_id: string;
          url: string;
          type?: 'image' | 'video' | null;
          order_index?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wish_id?: string;
          url?: string;
          type?: 'image' | 'video' | null;
          order_index?: number | null;
          created_at?: string;
        };
      };
      offers: {
        Row: {
          id: string;
          wish_id: string;
          responder_id: string;
          type: 'sell' | 'gift' | 'exchange' | 'recommend' | 'store_suggest' | 'custom';
          message: string;
          price: number | null;
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
          created_at: string;
        };
        Insert: {
          id?: string;
          wish_id: string;
          responder_id?: string;
          type: 'sell' | 'gift' | 'exchange' | 'recommend' | 'store_suggest' | 'custom';
          message: string;
          price?: number | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
          created_at?: string;
        };
        Update: {
          id?: string;
          wish_id?: string;
          responder_id?: string;
          type?: 'sell' | 'gift' | 'exchange' | 'recommend' | 'store_suggest' | 'custom';
          message?: string;
          price?: number | null;
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          offer_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          media_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          media_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          offer_id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          media_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewee_id: string;
          offer_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewee_id: string;
          offer_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          offer_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          entity_id: string;
          entity_type: 'user' | 'wish' | 'offer' | 'message';
          reason: string;
          status: 'pending' | 'resolved' | 'dismissed';
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          entity_id: string;
          entity_type: 'user' | 'wish' | 'offer' | 'message';
          reason: string;
          status?: 'pending' | 'resolved' | 'dismissed';
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          entity_id?: string;
          entity_type?: 'user' | 'wish' | 'offer' | 'message';
          reason?: string;
          status?: 'pending' | 'resolved' | 'dismissed';
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'offer' | 'message' | 'match' | 'status_change' | 'review' | 'system';
          title: string;
          body: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'offer' | 'message' | 'match' | 'status_change' | 'review' | 'system';
          title: string;
          body?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'offer' | 'message' | 'match' | 'status_change' | 'review' | 'system';
          title?: string;
          body?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
