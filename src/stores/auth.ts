import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Session } from '../types';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// Secret key for encryption (In production, use an environment variable)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'prsdn-secure-session-v1';

export const useAuthStore = defineStore('auth', () => {
    const session = ref<Session | null>(null);
    const isLoading = ref(false);

    const isAuthenticated = computed(() => session.value !== null);
    const isAdmin = computed(() => session.value?.role === 'admin');
    const isUser = computed(() => session.value?.role === 'user');
    const currentUser = computed(() => session.value);

    // Helper to encrypt data
    const encryptData = (data: any): string => {
        return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    };

    // Helper to decrypt data
    const decryptData = (ciphertext: string): any | null => {
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            return decryptedData;
        } catch (e) {
            console.error("Failed to decrypt session", e);
            return null;
        }
    };

    // Initialize from localStorage
    const initSession = () => {
        const stored = localStorage.getItem('prsdn_session');
        if (stored) {
            // Try to decrypt first
            const decrypted = decryptData(stored);
            if (decrypted) {
                session.value = decrypted;
            } else {
                // Fallback for migration: try to parse as plain JSON (backward compatibility)
                try {
                    const plain = JSON.parse(stored);
                    if (plain && plain.userId) {
                        session.value = plain;
                        // Determine if we should upgrade to encrypted immediately? 
                        // Maybe wait for next login or update, or do it now.
                        // Let's re-save as encrypted to migrate.
                        localStorage.setItem('prsdn_session', encryptData(plain));
                    }
                } catch (e) {
                    // Invalid data, clear it
                    localStorage.removeItem('prsdn_session');
                }
            }
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
            // Encrypt before saving
            localStorage.setItem('prsdn_session', encryptData(sessionData));

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Terjadi kesalahan saat login' };
        } finally {
            isLoading.value = false;
        }
    };

    const updateUsername = async (newUsername: string): Promise<{ success: boolean; error?: string }> => {
        if (!currentUser.value?.userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Import validation here to avoid circular dependency
        const { validateUsername } = await import('../utils/validation');

        // Validate username format
        const validation = validateUsername(newUsername);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        try {
            // Check if username already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('user_accounts')
                .select('id')
                .eq('username', newUsername)
                .neq('id', currentUser.value.userId)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking username:', checkError);
                return { success: false, error: 'Gagal memeriksa username' };
            }

            if (existingUser) {
                return { success: false, error: 'Username sudah digunakan' };
            }

            // Update username
            const { error: updateError } = await (supabase as any)
                .from('user_accounts')
                .update({ username: newUsername })
                .eq('id', currentUser.value.userId);

            if (updateError) {
                console.error('Error updating username:', updateError);
                return { success: false, error: 'Gagal mengubah username' };
            }

            // Update session
            if (session.value) {
                session.value = {
                    ...session.value,
                    username: newUsername
                };
                // Encrypt before saving
                localStorage.setItem('prsdn_session', encryptData(session.value));
            }

            return { success: true };
        } catch (error) {
            console.error('Username update error:', error);
            return { success: false, error: 'Terjadi kesalahan' };
        }
    };

    const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!currentUser.value?.userId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            // Verify old password
            const { data: account, error: fetchError } = await supabase
                .from('user_accounts')
                .select('password')
                .eq('id', currentUser.value.userId)
                .single();

            if (fetchError || !account) {
                return { success: false, error: 'Failed to verify current password' };
            }

            if ((account as any).password !== oldPassword) {
                return { success: false, error: 'Password lama tidak sesuai' };
            }

            // Update password
            const { error: updateError } = await (supabase
                .from('user_accounts') as any)
                .update({ password: newPassword })
                .eq('id', currentUser.value.userId);

            if (updateError) {
                return { success: false, error: 'Failed to update password' };
            }

            return { success: true };
        } catch (error) {
            console.error('Password update error:', error);
            return { success: false, error: 'An unexpected error occurred' };
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
        updateUsername,
        updatePassword,
        logout
    };
});
