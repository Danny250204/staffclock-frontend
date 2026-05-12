import { createClient } from '@supabase/supabase-js';

// Replace these with your exact values (same as backend db.ts)
const supabaseUrl = 'https://bpgnayrnfpuxsfgwyqej.supabase.co';
const supabaseAnonKey = 'sb_publishable_qpROMQoaqO7fT7FI92f16Q_d6AvWOHq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);