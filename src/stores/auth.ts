import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Session } from '../types';
import { supabase } from '../lib/supabase';

export const useAuthStore = defineStore('auth', () => {
    const session = ref<Session | null>(null);
    const isLoading = ref(false);

    const isAuthenticated = computed(() => session.value !== null);
    const isAdmin = computed(() => session.value?.role === 'admin');
    const isUser = computed(() => session.value?.role === 'user');
    const currentUser = computed(() => session.value);

    // Initialize from localStorage
    const initSession = () => {
        const stored = localStorage.getItem('prsdn_session');
        if (stored) {
            session.value = JSON.parse(stored);
        }
    };

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        isLoading.value = true;

        try {
            // Query Supabase for user account
            const { data: accounts, error } = await supabase
                .from('user_accounts')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .limit(1);

            if (error) {
                console.error('Login error:', error);
                return { success: false, error: 'Terjadi kesalahan saat login' };
            }

            if (!accounts || accounts.length === 0) {
                return { success: false, error: 'Username atau password salah' };
            }

            const account = (accounts as any)[0];

            if (account.status !== 'active') {
                return { success: false, error: 'Akun Anda belum diaktifkan' };
            }

            const sessionData: Session = {
                userId: account.id,
                role: account.role,
                username: account.username,
                memberId: account.member_id
            };

            session.value = sessionData;
            localStorage.setItem('prsdn_session', JSON.stringify(sessionData));

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Terjadi kesalahan saat login' };
        } finally {
            isLoading.value = false;
        }
    };

    const logout = () => {
        session.value = null;
        localStorage.removeItem('prsdn_session');
    };

    return {
        session,
        isLoading,
        isAuthenticated,
        isAdmin,
        isUser,
        currentUser,
        initSession,
        login,
        logout
    };
});
