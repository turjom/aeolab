export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Businesses table
export interface Businesses {
  Row: {
    id: string
    user_id: string
    business_name: string
    industry: string
    location: string
    website_url: string | null
    next_check_date: string
    last_checked_at: string | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    business_name: string
    industry: string
    location: string
    website_url?: string | null
    next_check_date: string
    last_checked_at?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    business_name?: string
    industry?: string
    location?: string
    website_url?: string | null
    next_check_date?: string
    last_checked_at?: string | null
    created_at?: string
  }
}

// Tracked prompts table
export interface TrackedPrompts {
  Row: {
    id: string
    business_id: string
    prompt_text: string
    is_active: boolean
    created_at: string
  }
  Insert: {
    id?: string
    business_id: string
    prompt_text: string
    is_active?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    business_id?: string
    prompt_text?: string
    is_active?: boolean
    created_at?: string
  }
}

// Tracking results table
export interface TrackingResults {
  Row: {
    id: string
    prompt_id: string
    ai_platform: 'chatgpt' | 'perplexity'
    appeared: boolean | null
    position: number | null
    full_response_text: string | null
    status: 'success' | 'failed'
    error_message: string | null
    tracked_at: string
  }
  Insert: {
    id?: string
    prompt_id: string
    ai_platform: 'chatgpt' | 'perplexity'
    appeared?: boolean | null
    position?: number | null
    full_response_text?: string | null
    status: 'success' | 'failed'
    error_message?: string | null
    tracked_at?: string
  }
  Update: {
    id?: string
    prompt_id?: string
    ai_platform?: 'chatgpt' | 'perplexity'
    appeared?: boolean | null
    position?: number | null
    full_response_text?: string | null
    status?: 'success' | 'failed'
    error_message?: string | null
    tracked_at?: string
  }
}

// User subscriptions table
export interface UserSubscriptions {
  Row: {
    id: string
    user_id: string
    subscription_status: 'trial' | 'active' | 'canceled' | 'expired'
    trial_ends_at: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    stripe_price_id: string | null
    current_period_end: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    subscription_status?: 'trial' | 'active' | 'canceled' | 'expired'
    trial_ends_at: string
    stripe_customer_id?: string | null
    stripe_subscription_id?: string | null
    stripe_price_id?: string | null
    current_period_end?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    subscription_status?: 'trial' | 'active' | 'canceled' | 'expired'
    trial_ends_at?: string
    stripe_customer_id?: string | null
    stripe_subscription_id?: string | null
    stripe_price_id?: string | null
    current_period_end?: string | null
    created_at?: string
    updated_at?: string
  }
}

// Recommendations table
export interface Recommendations {
  Row: {
    id: string
    business_id: string
    recommendation_text: string
    category: string
    status: 'pending' | 'completed' | 'dismissed'
    created_at: string
  }
  Insert: {
    id?: string
    business_id: string
    recommendation_text: string
    category: string
    status?: 'pending' | 'completed' | 'dismissed'
    created_at?: string
  }
  Update: {
    id?: string
    business_id?: string
    recommendation_text?: string
    category?: string
    status?: 'pending' | 'completed' | 'dismissed'
    created_at?: string
  }
}

// Beta interest table
export interface BetaInterest {
  Row: {
    id: string
    user_id: string
    email: string
    business_name: string
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    email: string
    business_name: string
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    email?: string
    business_name?: string
    created_at?: string
  }
}

// App config table
export interface AppConfig {
  Row: {
    id: string
    key: string
    value: string
    description: string
    updated_at: string
  }
  Insert: {
    id?: string
    key: string
    value: string
    description: string
    updated_at?: string
  }
  Update: {
    id?: string
    key?: string
    value?: string
    description?: string
    updated_at?: string
  }
}

// Main Database interface for Supabase
export interface Database {
  public: {
    Tables: {
      businesses: Businesses
      tracked_prompts: TrackedPrompts
      tracking_results: TrackingResults
      user_subscriptions: UserSubscriptions
      recommendations: Recommendations
      beta_interest: BetaInterest
      app_config: AppConfig
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper type exports for easier usage
export type BusinessesRow = Businesses['Row']
export type BusinessesInsert = Businesses['Insert']
export type BusinessesUpdate = Businesses['Update']

export type TrackedPromptsRow = TrackedPrompts['Row']
export type TrackedPromptsInsert = TrackedPrompts['Insert']
export type TrackedPromptsUpdate = TrackedPrompts['Update']

export type TrackingResultsRow = TrackingResults['Row']
export type TrackingResultsInsert = TrackingResults['Insert']
export type TrackingResultsUpdate = TrackingResults['Update']

export type UserSubscriptionsRow = UserSubscriptions['Row']
export type UserSubscriptionsInsert = UserSubscriptions['Insert']
export type UserSubscriptionsUpdate = UserSubscriptions['Update']

export type RecommendationsRow = Recommendations['Row']
export type RecommendationsInsert = Recommendations['Insert']
export type RecommendationsUpdate = Recommendations['Update']

export type BetaInterestRow = BetaInterest['Row']
export type BetaInterestInsert = BetaInterest['Insert']
export type BetaInterestUpdate = BetaInterest['Update']

export type AppConfigRow = AppConfig['Row']
export type AppConfigInsert = AppConfig['Insert']
export type AppConfigUpdate = AppConfig['Update']
