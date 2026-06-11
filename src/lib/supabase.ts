// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isValidSupabaseUrl = (value: string | undefined) => {
    if (!value) return false;

    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const hasValidSupabaseConfig = Boolean(isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey);

const createSafeQueryBuilder = () => {
    const query = {
        select() { return query; },
        insert() { return query; },
        update() { return query; },
        upsert() { return query; },
        delete() { return query; },
        eq() { return query; },
        neq() { return query; },
        gt() { return query; },
        gte() { return query; },
        lt() { return query; },
        lte() { return query; },
        like() { return query; },
        ilike() { return query; },
        order() { return query; },
        limit() { return query; },
        range() { return query; },
        single() { return query; },
        maybeSingle() { return query; },
        then(resolve: (value: { data: null; error: null }) => unknown) {
            return Promise.resolve({ data: null, error: null }).then(resolve);
        },
        catch(onRejected: (reason?: unknown) => unknown) {
            return Promise.resolve({ data: null, error: null }).catch(onRejected);
        }
    };

    return query;
};

const createSafeSupabaseClient = () => {
    const channel = () => ({
        on() { return this; },
        subscribe() { return this; },
        unsubscribe() { return this; }
    });

    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: null, error: null }),
            signUp: async () => ({ data: null, error: null }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } }, error: null }),
            setSession: async () => ({ data: null, error: null })
        },
        from() {
            return createSafeQueryBuilder();
        },
        rpc: async () => ({ data: null, error: null }),
        channel,
        removeChannel() {},
        storage: {
            from() {
                return {
                    upload: async () => ({ data: null, error: null }),
                    download: async () => ({ data: null, error: null }),
                    remove: async () => ({ data: null, error: null }),
                    list: async () => ({ data: [], error: null })
                };
            }
        }
    } as unknown as ReturnType<typeof createClient<Database>>;
};

if (!hasValidSupabaseConfig) {
    console.warn('Supabase environment variables are invalid or missing. Running in safe fallback mode.');
}

export const supabase = hasValidSupabaseConfig
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    })
    : createSafeSupabaseClient();
