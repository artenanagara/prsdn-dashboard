import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Member } from '../types';
import { supabase } from '../lib/supabase';

export const useMembersStore = defineStore('members', () => {
    const members = ref<Member[]>([]);
    const isLoading = ref(false);

    const membersByRT = computed(() => {
        const grouped: Record<string, Member[]> = {
            '01': [],
            '02': [],
            '03': [],
            '04': []
        };

        members.value.forEach(member => {
            if (grouped[member.rt]) {
                grouped[member.rt]!.push(member);
            }
        });

        return grouped;
    });

    const totalMembers = computed(() => members.value.length);

    const loadMembers = async (includeAdmins: boolean = true) => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('members')
                .select(`
                    *,
                    user_accounts(role)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map and filter the data
            let mappedMembers = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                fullName: record.full_name,
                birthPlace: record.birth_place,
                birthDate: record.birth_date,
                rt: record.rt,
                phone: record.phone,
                instagram: record.instagram,
                job: record.job,
                educationStatus: record.education_status,
                educationLevel: record.education_level,
                grade: record.grade,
                university: record.university,
                joinedWhatsApp: record.joined_whatsapp,
                createdAt: record.created_at,
                userRole: record.user_accounts?.role
            }));

            // If includeAdmins is false, filter out members with admin role
            if (!includeAdmins) {
                mappedMembers = mappedMembers.filter(member => member.userRole !== 'admin');
            }

            // Remove userRole from final data
            members.value = mappedMembers.map(({ userRole, ...member }) => member);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getMemberById = (id: string): Member | undefined => {
        return members.value.find(m => m.id === id);
    };

    const createMember = async (data: Omit<Member, 'id' | 'createdAt'>): Promise<Member | null> => {
        try {
            const { data: insertedData, error } = await (supabase
                .from('members') as any)
                .insert({
                    full_name: data.fullName,
                    birth_place: data.birthPlace,
                    birth_date: data.birthDate,
                    rt: data.rt,
                    phone: data.phone,
                    instagram: data.instagram,
                    job: data.job,
                    education_status: data.educationStatus,
                    education_level: data.educationLevel,
                    grade: data.grade,
                    university: data.university,
                    joined_whatsapp: data.joinedWhatsApp
                })
                .select()
                .single();

            if (error) throw error;

            await loadMembers();
            return {
                id: (insertedData as any).id,
                ...data,
                createdAt: (insertedData as any).created_at
            };
        } catch (error) {
            console.error('Error creating member:', error);
            return null;
        }
    };

    const updateMember = async (id: string, data: Partial<Member>): Promise<boolean> => {
        try {
            const updateData: any = {};
            if (data.fullName !== undefined) updateData.full_name = data.fullName;
            if (data.birthPlace !== undefined) updateData.birth_place = data.birthPlace;
            if (data.birthDate !== undefined) updateData.birth_date = data.birthDate;
            if (data.rt !== undefined) updateData.rt = data.rt;
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.instagram !== undefined) updateData.instagram = data.instagram;
            if (data.job !== undefined) updateData.job = data.job;
            if (data.educationStatus !== undefined) updateData.education_status = data.educationStatus;
            if (data.educationLevel !== undefined) updateData.education_level = data.educationLevel;
            if (data.grade !== undefined) updateData.grade = data.grade;
            if (data.university !== undefined) updateData.university = data.university;
            if (data.joinedWhatsApp !== undefined) updateData.joined_whatsapp = data.joinedWhatsApp;

            const { error } = await (supabase
                .from('members') as any)
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            await loadMembers();
            return true;
        } catch (error) {
            console.error('Error updating member:', error);
            return false;
        }
    };

    const deleteMember = async (id: string): Promise<boolean> => {
        try {
            // First delete associated user account if exists
            await (supabase
                .from('user_accounts') as any)
                .delete()
                .eq('member_id', id);

            // Then delete member
            const { error } = await (supabase
                .from('members') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadMembers();
            return true;
        } catch (error) {
            console.error('Error deleting member:', error);
            return false;
        }
    };

    const searchMembers = (query: string): Member[] => {
        const lowerQuery = query.toLowerCase();
        return members.value.filter(m =>
            m.fullName.toLowerCase().includes(lowerQuery) ||
            m.phone.includes(query) ||
            m.job.toLowerCase().includes(lowerQuery)
        );
    };

    const filterByRT = (rt: string): Member[] => {
        return members.value.filter(m => m.rt === rt);
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:members')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
                loadMembers();
            })
            .subscribe();
    };

    return {
        members,
        isLoading,
        membersByRT,
        totalMembers,
        loadMembers,
        getMemberById,
        createMember,
        updateMember,
        deleteMember,
        searchMembers,
        filterByRT,
        subscribeToChanges
    };
});
