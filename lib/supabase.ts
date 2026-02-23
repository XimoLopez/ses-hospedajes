import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types'; // Optional, for later

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Mantenemos un singleton del cliente de supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Missing Supabase credentials in .env.local", {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey
        });
        throw new Error("Missing Supabase credentials in .env.local");
    }

    if (!supabaseInstance) {
        console.log("Initializing Supabase Client...", {
            url: supabaseUrl,
            keyPrefix: supabaseKey.substring(0, 10) + "..."
        });
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }

    return supabaseInstance;
}
