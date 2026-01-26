import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AttendanceEvent } from '../types';
import { supabase } from '../lib/supabase';

// Helper to generate random token (6 chars, A-Z 0-9, excluding ambiguous chars)
const generateToken = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude O, I, 0, 1
    let token = '';
    for (let i = 0; i < 6; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
};

export const useAttendanceEventStore = defineStore('attendanceEvent', () => {
    const events = ref<AttendanceEvent[]>([]);
    const isLoading = ref(false);

    const activeEvent = computed(() =>
        events.value.find(e => e.isActive) || null
    );

    const upcomingEvents = computed(() => {
        const now = new Date().getTime();
        return events.value
            .filter(e => new Date(e.date).getTime() >= now - 86400000) // Include today
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const loadEvents = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('attendance_events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            events.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                title: record.title,
                description: record.description,
                date: record.date,
                startTime: record.start_time,
                endTime: record.end_time,
                isActive: record.is_active,
                token: record.token,
                tokenExpiresAt: record.token_expires_at,
                createdByAdminId: record.created_by_admin_id,
                createdAt: new Date(record.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getEventById = (id: string): AttendanceEvent | undefined => {
        return events.value.find(e => e.id === id);
    };

    const createEvent = async (data: Omit<AttendanceEvent, 'id' | 'createdAt' | 'isActive' | 'token' | 'tokenExpiresAt'>): Promise<AttendanceEvent | null> => {
        try {
            // Generate initial token when creating event
            const initialToken = generateToken();
            const tokenExpiresAt = Date.now() + 30000; // 30 seconds

            const { data: insertedData, error } = await (supabase
                .from('attendance_events') as any)
                .insert({
                    title: data.title,
                    description: data.description || null,
                    date: data.date,
                    start_time: data.startTime || null,
                    end_time: data.endTime || null,
                    is_active: false,
                    token: initialToken,
                    token_expires_at: tokenExpiresAt,
                    created_by_admin_id: data.createdByAdminId
                })
                .select()
                .single();

            if (error) throw error;

            await loadEvents();

            return {
                id: (insertedData as any).id,
                title: data.title,
                description: data.description,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                isActive: false,
                token: initialToken,
                tokenExpiresAt: tokenExpiresAt,
                createdByAdminId: data.createdByAdminId,
                createdAt: Date.now()
            };
        } catch (error) {
            console.error('Error creating event:', error);
            return null;
        }
    };

    const updateEvent = async (id: string, data: Partial<AttendanceEvent>): Promise<boolean> => {
        try {
            const updateData: any = {};
            if (data.title !== undefined) updateData.title = data.title;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.date !== undefined) updateData.date = data.date;
            if (data.startTime !== undefined) updateData.start_time = data.startTime;
            if (data.endTime !== undefined) updateData.end_time = data.endTime;

            const { error } = await (supabase
                .from('attendance_events') as any)
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            await loadEvents();
            return true;
        } catch (error) {
            console.error('Error updating event:', error);
            return false;
        }
    };

    const deleteEvent = async (id: string): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('attendance_events') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadEvents();
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            return false;
        }
    };

    const setActiveEvent = async (eventId: string): Promise<boolean> => {
        try {
            // Deactivate all events first
            await (supabase
                .from('attendance_events') as any)
                .update({ is_active: false })
                .neq('id', eventId);

            // Generate new token when activating
            const newToken = generateToken();
            const expiresAt = Date.now() + 30000; // 30 seconds

            // Activate the selected event with new token
            const { error } = await (supabase
                .from('attendance_events') as any)
                .update({
                    is_active: true,
                    token: newToken,
                    token_expires_at: expiresAt
                })
                .eq('id', eventId);

            if (error) throw error;

            await loadEvents();
            return true;
        } catch (error) {
            console.error('Error activating event:', error);
            return false;
        }
    };

    const deactivateEvent = async (eventId: string): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('attendance_events') as any)
                .update({
                    is_active: false,
                    token: '',
                    token_expires_at: 0
                })
                .eq('id', eventId);

            if (error) throw error;

            await loadEvents();
            return true;
        } catch (error) {
            console.error('Error deactivating event:', error);
            return false;
        }
    };

    const generateEventToken = async (eventId: string): Promise<{ token: string; expiresAt: number } | null> => {
        const event = getEventById(eventId);
        if (!event || !event.isActive) return null;

        try {
            const token = generateToken();
            const expiresAt = Date.now() + 30000; // 30 seconds

            const { error } = await (supabase
                .from('attendance_events') as any)
                .update({
                    token,
                    token_expires_at: expiresAt
                })
                .eq('id', eventId);

            if (error) throw error;

            await loadEvents();
            return { token, expiresAt };
        } catch (error) {
            console.error('Error generating token:', error);
            return null;
        }
    };

    const isTokenValid = (eventId: string, token: string): boolean => {
        const event = getEventById(eventId);
        if (!event || !event.isActive) return false;
        if (event.token !== token) return false;
        if (Date.now() > event.tokenExpiresAt) return false;
        return true;
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:attendance_events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_events' }, () => {
                loadEvents();
            })
            .subscribe();
    };

    return {
        events,
        isLoading,
        activeEvent,
        upcomingEvents,
        loadEvents,
        getEventById,
        createEvent,
        updateEvent,
        deleteEvent,
        setActiveEvent,
        deactivateEvent,
        generateEventToken,
        isTokenValid,
        subscribeToChanges
    };
});
