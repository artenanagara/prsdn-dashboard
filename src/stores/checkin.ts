import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AttendanceCheckin } from '../types';
import { supabase } from '../lib/supabase';
import { useAttendanceEventStore } from './attendanceEvent';

export const useCheckinStore = defineStore('checkin', () => {
    const checkins = ref<AttendanceCheckin[]>([]);
    const isLoading = ref(false);

    const loadCheckins = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('attendance_checkins')
                .select('*')
                .order('checked_in_at', { ascending: false });

            if (error) throw error;

            checkins.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                eventId: record.event_id,
                memberId: record.member_id,
                checkedInAt: record.checked_in_at,
                tokenUsed: record.token_used
            }));
        } catch (error) {
            console.error('Error loading checkins:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getCheckinsByEvent = (eventId: string): AttendanceCheckin[] => {
        return checkins.value.filter(c => c.eventId === eventId);
    };

    const getCheckinsByMember = (memberId: string): AttendanceCheckin[] => {
        return checkins.value.filter(c => c.memberId === memberId)
            .sort((a, b) => b.checkedInAt - a.checkedInAt);
    };

    const hasCheckedIn = (eventId: string, memberId: string): boolean => {
        return checkins.value.some(c => c.eventId === eventId && c.memberId === memberId);
    };

    const checkin = async (eventId: string, memberId: string, token: string): Promise<{ success: boolean; error?: string }> => {
        const eventStore = useAttendanceEventStore();

        // Validation 1: Check if event exists and is active
        const event = eventStore.getEventById(eventId);
        if (!event) {
            return { success: false, error: 'Event tidak ditemukan' };
        }
        if (!event.isActive) {
            return { success: false, error: 'Tidak ada event aktif saat ini' };
        }

        // Validation 2: Check if already checked in
        if (hasCheckedIn(eventId, memberId)) {
            return { success: false, error: 'Anda sudah melakukan check-in untuk event ini' };
        }

        // Validation 3: Validate token
        if (!eventStore.isTokenValid(eventId, token)) {
            if (Date.now() > event.tokenExpiresAt) {
                return { success: false, error: 'Token sudah kadaluarsa' };
            }
            return { success: false, error: 'Token tidak valid' };
        }

        // Create checkin record
        try {
            const { error } = await (supabase
                .from('attendance_checkins') as any)
                .insert({
                    event_id: eventId,
                    member_id: memberId,
                    checked_in_at: Date.now(),
                    token_used: token
                });

            if (error) throw error;

            await loadCheckins();
            return { success: true };
        } catch (error) {
            console.error('Error creating checkin:', error);
            return { success: false, error: 'Gagal melakukan check-in' };
        }
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:attendance_checkins')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_checkins' }, () => {
                loadCheckins();
            })
            .subscribe();
    };

    const getLast6MonthsStats = () => {
        const now = new Date();
        const stats: Array<{ month: string; count: number }> = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Filter checkins belonging to this month
            const count = checkins.value.filter(c => {
                const checkinDate = new Date(c.checkedInAt);
                const checkinMonthKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, '0')}`;
                return checkinMonthKey === monthKey;
            }).length;

            stats.push({
                month: monthKey,
                count
            });
        }

        return stats;
    };

    return {
        checkins,
        isLoading,
        loadCheckins,
        getCheckinsByEvent,
        getCheckinsByMember,
        hasCheckedIn,
        checkin,
        subscribeToChanges,
        getLast6MonthsStats
    };
});
