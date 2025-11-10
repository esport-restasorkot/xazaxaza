import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qptvchkjeajyznkrjtws.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdHZjaGtqZWFqeXpua3JqdHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzM1MjgsImV4cCI6MjA3ODMwOTUyOH0.pq57jLdElPxY3IrM6NawgykAlLRMQX0UPLNl0Dvw2Uc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);