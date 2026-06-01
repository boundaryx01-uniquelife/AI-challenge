import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if both Supabase URL and API Key are provided in the environment
export const isSupabaseConfigured =
  supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';

// Safe initialization
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Disables local storage auth session saving for public submissions
      },
    })
  : null;
