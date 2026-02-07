import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AccountApplication } from '../types';
import { supabase } from '../lib/supabase';
import { useMembersStore } from './members';

export const useApplicationsStore = defineStore('applications', () => {
    const applications = ref<AccountApplication[]>([]);
    const isLoading = ref(false);

    const pendingApplications = computed(() =>
        applications.value.filter(app => app.status === 'pending')
    );

    const pendingCount = computed(() => pendingApplications.value.length);

    const loadApplications = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('account_applications')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            // Transform database records to match AccountApplication type
            applications.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                step1Data: {
                    fullName: record.full_name,
                    birthPlace: record.birth_place,
                    birthDate: record.birth_date,
                    rt: record.rt as '01' | '02' | '03' | '04',
                    phone: record.phone,
                    instagram: record.instagram || '',
                    job: record.job || '',
                    educationStatus: record.education_status,
                    educationLevel: record.education_level,
                    grade: record.grade || '',
                    university: record.university || '',
                    joinedWhatsApp: record.joined_whatsapp || false
                },
                username: record.username,
                password: record.password,
                status: record.status as 'pending' | 'approved' | 'rejected',
                submittedAt: record.submitted_at,
                reviewedAt: record.reviewed_at || undefined,
                reviewedByAdminId: record.reviewed_by_admin_id || undefined
            }));
        } catch (error) {
            console.error('Error loading applications:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getApplicationById = (id: string): AccountApplication | undefined => {
        return applications.value.find(app => app.id === id);
    };

    const submitApplication = async (data: Omit<AccountApplication, 'id' | 'status' | 'submittedAt'>): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('account_applications')
                .insert({
                    full_name: data.step1Data.fullName,
                    birth_place: data.step1Data.birthPlace,
                    birth_date: data.step1Data.birthDate,
                    rt: data.step1Data.rt,
                    phone: data.step1Data.phone,
                    instagram: data.step1Data.instagram || null,
                    job: data.step1Data.job || null,
                    education_status: data.step1Data.educationStatus,
                    education_level: data.step1Data.educationLevel,
                    grade: data.step1Data.grade || null,
                    university: data.step1Data.university || null,
                    joined_whatsapp: data.step1Data.joinedWhatsApp || false,
                    username: data.username,
                    password: data.password,
                    status: 'pending' as const
                } as any)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'Data yang digunakan sudah pernah terdaftar, silahkan hubungi ketua untuk info username dan password' };
                }
                throw error;
            }

            await loadApplications();

            return { success: true };
        } catch (error) {
            console.error('Error submitting application:', error);
            return { success: false, error: 'Gagal mengirim pendaftaran. Silakan coba lagi.' };
        }
    };

    const checkDuplicates = async (username: string, phone: string): Promise<{ usernameTaken: boolean; phoneTaken: boolean }> => {
        try {
            // Check in account_applications (pending)
            const { data: appData, error: appError } = await supabase
                .from('account_applications')
                .select('username, phone')
                .or(`username.eq.${username},phone.eq.${phone}`)
                .neq('status', 'rejected');

            if (appError) throw appError;

            // Cast appData to help TS
            const apps = (appData || []) as { username: string; phone: string }[];

            // Check in user_accounts (for username)
            const { data: userData, error: userError } = await supabase
                .from('user_accounts')
                .select('username')
                .eq('username', username);

            if (userError) throw userError;

            // Check in members (for phone)
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('phone')
                .eq('phone', phone);

            if (memberError) throw memberError;

            const usernameTaken = (apps.some(a => a.username === username) || userData?.length > 0);
            const phoneTaken = (apps.some(a => a.phone === phone) || memberData?.length > 0);

            return { usernameTaken, phoneTaken };
        } catch (error) {
            console.error('Error checking duplicates:', error);
            return { usernameTaken: false, phoneTaken: false };
        }
    };

    const approveApplication = async (id: string, adminId: string): Promise<boolean> => {
        const application = getApplicationById(id);
        if (!application) return false;

        try {
            // 1. Create member
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .insert({
                    full_name: application.step1Data.fullName,
                    birth_place: application.step1Data.birthPlace,
                    birth_date: application.step1Data.birthDate,
                    rt: application.step1Data.rt,
                    phone: application.step1Data.phone,
                    instagram: application.step1Data.instagram || null,
                    job: application.step1Data.job || null,
                    education_status: application.step1Data.educationStatus,
                    education_level: application.step1Data.educationLevel,
                    grade: application.step1Data.grade || null,
                    university: application.step1Data.university || null,
                    joined_whatsapp: application.step1Data.joinedWhatsApp || false
                } as any)
                .select()
                .single();

            if (memberError) throw memberError;

            // 2. Create user account
            const { error: accountError } = await supabase
                .from('user_accounts')
                .insert({
                    member_id: (memberData as any)!.id,
                    username: application.username,
                    password: application.password,
                    role: 'user' as const,
                    status: 'active' as const
                } as any);

            if (accountError) throw accountError;

            // 3. Update application status
            const { error: updateError } = await (supabase
                .from('account_applications') as any)
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by_admin_id: adminId
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Reload data
            const membersStore = useMembersStore();
            await membersStore.loadMembers();
            await loadApplications();

            return true;
        } catch (error) {
            console.error('Error approving application:', error);
            return false;
        }
    };

    const rejectApplication = async (id: string, adminId: string): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('account_applications') as any)
                .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by_admin_id: adminId
                })
                .eq('id', id);

            if (error) throw error;

            await loadApplications();
            return true;
        } catch (error) {
            console.error('Error rejecting application:', error);
            return false;
        }
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:account_applications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'account_applications' }, () => {
                loadApplications();
            })
            .subscribe();
    };

    return {
        applications,
        isLoading,
        pendingApplications,
        pendingCount,
        loadApplications,
        getApplicationById,
        submitApplication,
        approveApplication,
        rejectApplication,
        checkDuplicates,
        subscribeToChanges
    };
});
