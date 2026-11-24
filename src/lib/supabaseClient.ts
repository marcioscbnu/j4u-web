import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const ADMIN_EMAIL = "j4umarketplace@gmail.com";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
