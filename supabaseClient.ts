import { createClient } from '@supabase/supabase-js';

// The following credentials were provided for the integration.
// For production, it is recommended to use environment variables.
const supabaseUrl = 'https://zmsyiofxqjchljljtfwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptc3lpb2Z4cWpjaGxqbGp0ZndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzc1NzgsImV4cCI6MjA3MjkxMzU3OH0.xM9_h2lNGUcLYNy3ayceStcZyyRVf_j32EbyxYZsmjs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
