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
            const { usernameTaken, phoneTaken } = await checkDuplicates(data.username, data.step1Data.phone);

            if (usernameTaken) {
                return { success: false, error: 'Username sudah digunakan. Silakan pilih username lain.' };
            }

            if (phoneTaken) {
                return { success: false, error: 'Nomor HP ini sudah memiliki akun. Silakan login atau hubungi ketua untuk info username dan password.' };
            }

            const { data: existingMembers, error: existingMemberError } = await supabase
                .from('members')
                .select('id')
                .eq('phone', data.step1Data.phone)
                .limit(1);

            if (existingMemberError) throw existingMemberError;

            let memberId = (existingMembers?.[0] as any)?.id;
            let createdNewMember = false;

            if (!memberId) {
                const { data: memberData, error: memberError } = await supabase
                    .from('members')
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
                        joined_whatsapp: data.step1Data.joinedWhatsApp || false
                    } as any)
                    .select()
                    .single();

                if (memberError) {
                    if (memberError.code === '23505') {
                        return { success: false, error: 'Nomor HP ini sudah terdaftar. Silakan login atau hubungi ketua untuk info username dan password.' };
                    }
                    throw memberError;
                }

                memberId = (memberData as any)?.id;
                createdNewMember = true;
            }

            const { error: accountError } = await supabase
                .from('user_accounts')
                .insert({
                    member_id: memberId,
                    username: data.username,
                    password: data.password,
                    role: 'user' as const,
                    status: 'active' as const
                } as any);

            if (accountError) {
                if (createdNewMember && memberId) {
                    await (supabase.from('members') as any).delete().eq('id', memberId);
                }

                if (accountError.code === '23505') {
                    return { success: false, error: 'Username sudah digunakan. Silakan pilih username lain.' };
                }
                throw accountError;
            }

            const membersStore = useMembersStore();
            await membersStore.loadMembers();
            await loadApplications();

            return { success: true };
        } catch (error) {
            console.error('Error creating account:', error);
            return { success: false, error: 'Gagal membuat akun. Silakan coba lagi.' };
        }
    };

    const checkDuplicates = async (username: string, phone: string): Promise<{ usernameTaken: boolean; phoneTaken: boolean }> => {
        try {
            let usernameTaken = false;

            if (username) {
                const { data: userData, error: userError } = await supabase
                    .from('user_accounts')
                    .select('username')
                    .eq('username', username);

                if (userError) throw userError;

                usernameTaken = (userData?.length || 0) > 0;
            }

            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('id')
                .eq('phone', phone);

            if (memberError) throw memberError;

            const memberIds = ((memberData || []) as Array<{ id: string }>).map(member => member.id);
            let phoneTaken = false;

            if (memberIds.length > 0) {
                const { data: accountData, error: accountError } = await supabase
                    .from('user_accounts')
                    .select('id')
                    .in('member_id', memberIds);

                if (accountError) throw accountError;

                phoneTaken = (accountData?.length || 0) > 0;
            }

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
