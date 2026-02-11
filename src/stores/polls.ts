import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './auth';
import type { Poll, PollOption, PollVote } from '../types';

export const usePollsStore = defineStore('polls', () => {
    const authStore = useAuthStore();

    const polls = ref<Poll[]>([]);
    const currentPoll = ref<Poll | null>(null);
    const currentOptions = ref<PollOption[]>([]);
    const userVotes = ref<PollVote[]>([]);
    const allVotes = ref<PollVote[]>([]);
    const voterDetails = ref<any[]>([]); // For admin: voter names + their choices

    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Realtime channel reference
    let realtimeChannel: any = null;

    // Getters
    const activePolls = computed(() => {
        const now = new Date().toISOString();
        return polls.value.filter(p =>
            p.status === 'active' &&
            p.startDate <= now &&
            p.endDate >= now
        );
    });

    const historyPolls = computed(() => {
        const now = new Date().toISOString();
        return polls.value.filter(p =>
            p.status === 'closed' ||
            p.status === 'archived' ||
            (p.status === 'active' && p.endDate < now)
        );
    });

    const getPollOptions = (pollId: string) => {
        return currentOptions.value.filter((o: any) => o.pollId === pollId);
    };

    const hasUserVoted = (pollId: string) => {
        return userVotes.value.some((v: any) => v.pollId === pollId);
    };

    const getUserVoteForPoll = (pollId: string) => {
        return userVotes.value.filter((v: any) => v.pollId === pollId).map((v: any) => v.optionId);
    };

    // Actions
    async function fetchPolls(isAdmin = false) {
        isLoading.value = true;
        error.value = null;
        try {
            let query = supabase
                .from('polls')
                .select('*')
                .order('created_at', { ascending: false });

            if (!isAdmin) {
                query = query.in('status', ['active', 'closed']);
            }

            const { data, error: err } = await query;
            if (err) throw err;

            polls.value = (data || []).map(mapPollFromDB);
        } catch (err: any) {
            console.error('Error fetching polls:', err);
            error.value = err.message;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchPollDetail(pollId: string) {
        isLoading.value = true;
        error.value = null;
        try {
            // 1. Fetch Poll
            const { data: pollData, error: pollError } = await supabase
                .from('polls')
                .select('*')
                .eq('id', pollId)
                .single();

            if (pollError) throw pollError;
            currentPoll.value = mapPollFromDB(pollData);

            // 2. Fetch Options
            const { data: optionsData, error: optionsError } = await supabase
                .from('poll_options')
                .select('*')
                .eq('poll_id', pollId);

            if (optionsError) throw optionsError;
            currentOptions.value = (optionsData || []).map((o: any) => ({
                id: o.id,
                pollId: o.poll_id,
                label: o.label
            }));

            // 3. Fetch ALL votes for this poll (for charts/results)
            await fetchAllVotes(pollId);

            // 4. Fetch User's Votes (if logged in)
            if (authStore.currentUser?.userId) {
                const { data: votesData, error: votesError } = await supabase
                    .from('poll_votes')
                    .select('*')
                    .eq('poll_id', pollId)
                    .eq('user_id', authStore.currentUser.userId);

                if (votesError) throw votesError;

                userVotes.value = [
                    ...userVotes.value.filter((v: any) => v.pollId !== pollId),
                    ...(votesData || []).map(mapVoteFromDB)
                ];
            }

        } catch (err: any) {
            console.error('Error fetching poll detail:', err);
            error.value = err.message;
        } finally {
            isLoading.value = false;
        }
    }

    async function createPoll(poll: Partial<Poll>, options: string[]) {
        isLoading.value = true;
        error.value = null;

        if (!poll.title || options.length < 2) {
            error.value = "Judul dan minimal 2 opsi harus diisi";
            isLoading.value = false;
            return false;
        }

        try {
            const dbPoll = mapPollToDB({
                ...poll,
                createdBy: authStore.currentUser?.userId
            } as any);

            const { data: newPollData, error: createError } = await (supabase as any)
                .from('polls')
                .insert(dbPoll)
                .select()
                .single();

            if (createError) throw createError;

            const newPollId = newPollData.id;

            const dbOptions = options.map(label => ({
                poll_id: newPollId,
                label: label
            }));

            const { error: optionsError } = await (supabase as any)
                .from('poll_options')
                .insert(dbOptions);

            if (optionsError) throw optionsError;

            await fetchPolls(true);
            return true;

        } catch (err: any) {
            console.error('Error creating poll:', err);
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function updatePoll(pollId: string, pollData: Partial<Poll>, options: { id?: string, value: string }[]) {
        isLoading.value = true;
        error.value = null;

        if (!pollData.title || options.length < 2) {
            error.value = "Judul dan minimal 2 opsi harus diisi";
            isLoading.value = false;
            return false;
        }

        try {
            // 1. Update Poll Data
            const dbPoll = mapPollToDB(pollData as Poll);
            delete dbPoll.created_by; // Don't update creator
            delete dbPoll.status; // Status handled separately if needed, or included

            const { error: updateError } = await (supabase as any)
                .from('polls')
                .update(dbPoll)
                .eq('id', pollId);

            if (updateError) throw updateError;

            // 2. Sync Options

            // a. Get existing options to find deletions
            const { data: existingOptions } = await supabase
                .from('poll_options')
                .select('id')
                .eq('poll_id', pollId);

            const existingIds = (existingOptions || []).map((o: any) => o.id);
            const incomingIds = options.map(o => o.id).filter(Boolean);

            // Delete removed options
            const idsToDelete = existingIds.filter((id: string) => !incomingIds.includes(id));
            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('poll_options')
                    .delete()
                    .in('id', idsToDelete);
                if (deleteError) throw deleteError;
            }

            // Upsert options (Update existing, Insert new)


            // Separate insert and update because upsert with undefined ID might be tricky depending on setup
            // Actually, for Supabase upsert: if ID is present, it updates. If not, we should probably strip it or make sure TS is happy.
            // Better strategy:

            // Update existing
            for (const opt of options) {
                if (opt.id) {
                    await (supabase as any)
                        .from('poll_options')
                        .update({ label: opt.value })
                        .eq('id', opt.id);
                } else {
                    await (supabase as any)
                        .from('poll_options')
                        .insert({ poll_id: pollId, label: opt.value });
                }
            }

            // Refresh
            await fetchPollDetail(pollId);
            return true;

        } catch (err: any) {
            console.error('Error updating poll:', err);
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function submitVote(pollId: string, optionIds: string[]) {
        const poll = currentPoll.value || polls.value.find(p => p.id === pollId);
        const alreadyVoted = hasUserVoted(pollId);

        if (alreadyVoted && !poll?.allowEditVote) {
            error.value = "Anda sudah berpartisipasi dalam voting ini.";
            return false;
        }

        isLoading.value = true;
        error.value = null;

        try {
            // If editing is allowed and user voted, delete old votes first
            if (alreadyVoted && poll?.allowEditVote && authStore.currentUser?.userId) {
                const { error: deleteError } = await (supabase as any)
                    .from('poll_votes')
                    .delete()
                    .eq('poll_id', pollId)
                    .eq('user_id', authStore.currentUser.userId);

                if (deleteError) throw deleteError;
            }

            const votes = optionIds.map(optId => ({
                poll_id: pollId,
                option_id: optId,
                user_id: authStore.currentUser?.userId
            }));

            const { error: voteError } = await (supabase as any)
                .from('poll_votes')
                .insert(votes);

            if (voteError) throw voteError;

            await fetchPollDetail(pollId);
            return true;

        } catch (err: any) {
            console.error('Error submitting vote:', err);
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchAllVotes(pollId: string) {
        try {
            const { data, error: err } = await supabase
                .from('poll_votes')
                .select('*')
                .eq('poll_id', pollId);

            if (err) throw err;

            allVotes.value = (data || []).map(mapVoteFromDB);
            return allVotes.value;
        } catch (err) {
            console.error("Failed to fetch votes", err);
            return [];
        }
    }

    async function fetchVoterDetails(pollId: string) {
        try {
            // Fetch votes with user info via join
            const { data, error: err } = await supabase
                .from('poll_votes')
                .select(`
                    id,
                    poll_id,
                    option_id,
                    user_id,
                    created_at,
                    user_accounts!poll_votes_user_id_fkey ( username, member_id )
                `)
                .eq('poll_id', pollId);

            if (err) {
                // Fallback: fetch without join if FK name doesn't match
                console.warn('Join failed, fetching without names:', err);
                const { data: fallbackData } = await supabase
                    .from('poll_votes')
                    .select('*')
                    .eq('poll_id', pollId);

                voterDetails.value = (fallbackData || []).map((v: any) => ({
                    id: v.id,
                    optionId: v.option_id,
                    userId: v.user_id,
                    username: v.user_id?.substring(0, 8) || 'Anonim',
                    createdAt: v.created_at
                }));
                return voterDetails.value;
            }

            voterDetails.value = (data || []).map((v: any) => ({
                id: v.id,
                optionId: v.option_id,
                userId: v.user_id,
                username: v.user_accounts?.username || 'Anonim',
                memberId: v.user_accounts?.member_id,
                createdAt: v.created_at
            }));

            // Try to get member full names
            const memberIds = voterDetails.value
                .map((v: any) => v.memberId)
                .filter(Boolean);

            if (memberIds.length > 0) {
                const { data: members } = await supabase
                    .from('members')
                    .select('id, full_name')
                    .in('id', memberIds);

                if (members) {
                    const memberMap = new Map(members.map((m: any) => [m.id, m.full_name]));
                    voterDetails.value = voterDetails.value.map((v: any) => ({
                        ...v,
                        fullName: memberMap.get(v.memberId) || v.username
                    }));
                }
            }

            return voterDetails.value;
        } catch (err) {
            console.error("Failed to fetch voter details", err);
            return [];
        }
    }

    async function updatePollStatus(pollId: string, status: 'active' | 'closed' | 'archived') {
        isLoading.value = true;
        try {
            const { error: err } = await (supabase as any)
                .from('polls')
                .update({ status })
                .eq('id', pollId);

            if (err) throw err;

            const poll = polls.value.find(p => p.id === pollId);
            if (poll) poll.status = status;
            if (currentPoll.value?.id === pollId) currentPoll.value.status = status;

            return true;
        } catch (err: any) {
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function deletePoll(pollId: string) {
        if (!confirm("Hapus voting ini? Data tidak bisa dikembalikan.")) return;

        isLoading.value = true;
        try {
            const { error: err } = await supabase
                .from('polls')
                .delete()
                .eq('id', pollId);

            if (err) throw err;

            polls.value = polls.value.filter(p => p.id !== pollId);
            return true;
        } catch (err: any) {
            error.value = err.message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    // Real-time subscriptions
    function subscribeToRealtime() {
        if (realtimeChannel) return; // Already subscribed

        realtimeChannel = supabase
            .channel('polls-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => {
                // Re-fetch polls on any change
                fetchPolls(authStore.isAdmin);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, (payload: any) => {
                // Re-fetch votes for the current poll if viewing detail
                if (currentPoll.value && payload.new?.poll_id === currentPoll.value.id) {
                    fetchAllVotes(currentPoll.value.id);
                    if (!currentPoll.value.isAnonymous) {
                        fetchVoterDetails(currentPoll.value.id);
                    }
                }
            })
            .subscribe();
    }

    function unsubscribeFromRealtime() {
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
    }

    // Helpers
    function mapPollFromDB(dbPoll: any): Poll {
        return {
            id: dbPoll.id,
            title: dbPoll.title,
            description: dbPoll.description,
            type: dbPoll.type,
            questionType: dbPoll.question_type,
            isAnonymous: dbPoll.is_anonymous,
            requiresLogin: dbPoll.requires_login,
            startDate: dbPoll.start_date,
            endDate: dbPoll.end_date,
            resultVisibility: dbPoll.result_visibility,
            allowEditVote: dbPoll.allow_edit_vote,
            status: dbPoll.status,
            createdAt: dbPoll.created_at,
            createdBy: dbPoll.created_by
        };
    }

    function mapPollToDB(poll: Poll): any {
        return {
            title: poll.title,
            description: poll.description,
            type: poll.type,
            question_type: poll.questionType,
            is_anonymous: poll.isAnonymous,
            requires_login: poll.requiresLogin,
            start_date: poll.startDate,
            end_date: poll.endDate,
            result_visibility: poll.resultVisibility,
            allow_edit_vote: poll.allowEditVote,
            status: poll.status || 'draft',
            created_by: poll.createdBy
        };
    }

    function mapVoteFromDB(dbVote: any): PollVote {
        return {
            id: dbVote.id,
            pollId: dbVote.poll_id,
            optionId: dbVote.option_id,
            userId: dbVote.user_id,
            createdAt: dbVote.created_at
        };
    }

    return {
        polls,
        currentPoll,
        currentOptions,
        userVotes,
        allVotes,
        voterDetails,
        isLoading,
        error,
        activePolls,
        historyPolls,
        fetchPolls,
        fetchPollDetail,
        createPoll,
        updatePoll,
        submitVote,
        updatePollStatus,
        deletePoll,
        hasUserVoted,
        getUserVoteForPoll,
        fetchAllVotes,
        fetchVoterDetails,
        getPollOptions,
        subscribeToRealtime,
        unsubscribeFromRealtime
    };
});
