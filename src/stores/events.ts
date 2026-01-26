import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Event } from '../types';
import { supabase } from '../lib/supabase';

export const useEventsStore = defineStore('events', () => {
    const events = ref<Event[]>([]);
    const isLoading = ref(false);

    const loadEvents = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;

            events.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                title: record.title,
                date: record.date,
                type: record.type,
                description: record.description,
                createdAt: record.created_at
            }));
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getUpcomingEvents = (days: number = 60): Event[] => {
        const now = new Date();
        // Reset time to start of day for accurate comparison
        now.setHours(0, 0, 0, 0);

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return events.value.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= now && eventDate <= futureDate;
        });
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                loadEvents();
            })
            .subscribe();
    };

    return {
        events,
        isLoading,
        loadEvents,
        getUpcomingEvents,
        subscribeToChanges
    };
});
