import { createClient } from '@supabase/supabase-js';

// Estos datos los sacás de tu panel de Supabase (Settings -> API)
const supabaseUrl = 'https://mubqzcrlwzwbvnqjisqk.supabase.co';
const supabaseAnonKey = 'sb_publishable_zDL2YyZVyrHQ6GFuMhFB4w_TR-pWmlC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);