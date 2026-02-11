import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PaymentItem, PaymentRecord } from '../types';
import { supabase } from '../lib/supabase';

export const usePaymentStore = defineStore('payment', () => {
    const paymentItems = ref<PaymentItem[]>([]);
    const currentPaymentRecords = ref<PaymentRecord[]>([]);
    const isLoading = ref(false);

    const loadPaymentItems = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('payment_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            paymentItems.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                title: record.title,
                deadlineDate: record.deadline_date,
                type: record.type,
                amount: record.amount,
                description: record.description,
                isActive: record.is_active,
                createdAt: record.created_at
            }));
        } catch (error) {
            console.error('Error loading payment items:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getPaymentItemById = (id: string) => {
        return paymentItems.value.find(item => item.id === id);
    };

    const loadPaymentRecords = async (paymentItemId: string) => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('payment_records')
                .select('*')
                .eq('payment_item_id', paymentItemId);

            if (error) throw error;

            currentPaymentRecords.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                paymentItemId: record.payment_item_id,
                memberId: record.member_id,
                amountPaid: record.amount_paid,
                status: record.status,
                lastPaymentDate: record.last_payment_date,
                notes: record.notes,
                createdAt: record.created_at,
                billAmount: record.bill_amount
            }));
        } catch (error) {
            console.error('Error loading payment records:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const recordPayment = async (
        paymentItemId: string,
        memberId: string,
        amount: number,
        totalTarget: number
    ): Promise<boolean> => {
        try {
            // Check if record exists
            const existingRecord = currentPaymentRecords.value.find(
                r => r.paymentItemId === paymentItemId && r.memberId === memberId
            );

            let newAmountPaid = amount;
            if (existingRecord) {
                newAmountPaid += existingRecord.amountPaid;
            }

            let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
            if (newAmountPaid >= totalTarget) {
                status = 'paid';
            } else if (newAmountPaid > 0) {
                status = 'partial';
            }

            // Upsert logic
            const { error } = await (supabase
                .from('payment_records') as any)
                .upsert({
                    payment_item_id: paymentItemId,
                    member_id: memberId,
                    amount_paid: newAmountPaid,
                    status: status,
                    last_payment_date: new Date().toISOString(),
                    // preserve id if updating
                    ...(existingRecord ? { id: existingRecord.id } : {})
                }, { onConflict: 'payment_item_id, member_id' });

            if (error) throw error;

            await loadPaymentRecords(paymentItemId);
            return true;
        } catch (error) {
            console.error('Error recording payment:', error);
            return false;
        }
    };

    const createPaymentItem = async (data: Omit<PaymentItem, 'id' | 'createdAt' | 'isActive'>): Promise<PaymentItem | null> => {
        try {
            const { data: insertedData, error } = await (supabase
                .from('payment_items') as any)
                .insert({
                    title: data.title,
                    deadline_date: data.deadlineDate,
                    type: data.type,
                    amount: data.amount,
                    description: data.description,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            await loadPaymentItems();
            return {
                id: (insertedData as any).id,
                ...data,
                isActive: true,
                createdAt: (insertedData as any).created_at
            };
        } catch (error) {
            console.error('Error creating payment item:', error);
            return null;
        }
    };

    const updatePaymentItem = async (id: string, data: Partial<PaymentItem>): Promise<boolean> => {
        try {
            const updateData: any = {};
            if (data.title !== undefined) updateData.title = data.title;
            if (data.deadlineDate !== undefined) updateData.deadline_date = data.deadlineDate;
            if (data.type !== undefined) updateData.type = data.type;
            if (data.amount !== undefined) updateData.amount = data.amount;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.isActive !== undefined) updateData.is_active = data.isActive;

            const { error } = await (supabase
                .from('payment_items') as any)
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            await loadPaymentItems();
            return true;
        } catch (error) {
            console.error('Error updating payment item:', error);
            return false;
        }
    };

    const deletePaymentItem = async (id: string): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('payment_items') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadPaymentItems();
            return true;
        } catch (error) {
            console.error('Error deleting payment item:', error);
            return false;
        }
    };

    const createPaymentFromPoll = async (
        pollId: string,
        paymentTitle: string,
        deadlineDate: string,
        paymentType: 'full' | 'dp',
        optionPrices: Record<string, number>,
        defaultPrice: number
    ): Promise<string | null> => {
        try {
            // 1. Create Payment Item
            const { data: paymentItem, error: itemError } = await (supabase
                .from('payment_items') as any)
                .insert({
                    title: paymentTitle,
                    deadline_date: deadlineDate,
                    type: paymentType, // Use passed type
                    amount: defaultPrice,
                    description: 'Generated from Poll',
                    is_active: true
                })
                .select()
                .single();

            if (itemError) throw itemError;
            const paymentItemId = (paymentItem as any).id;

            // 2. Fetch Poll Votes
            const { data: votes, error: votesError } = await supabase
                .from('poll_votes')
                .select('user_id, option_id')
                .eq('poll_id', pollId);

            if (votesError) throw votesError;

            // 3. Prepare Payment Records
            // We need to map user_id (from votes) to member_id.
            // Assumption: user_accounts table has member_id.
            // Let's fetch all users to map user_id -> member_id
            const { data: users, error: usersError } = await supabase
                .from('user_accounts')
                .select('id, member_id');

            if (usersError) throw usersError;

            const userMap = new Map((users as any[]).map(u => [u.id, u.member_id]));
            const recordsToInsert: any[] = [];

            // Group votes by user (in case of multiple votes, though schema says... wait, poll_votes doesn't have unique constraint? Assuming single choice for now or latest)
            // Ideally we iterate members.

            // Allow manual "default" for non-voters? For now let's just create records for voters.
            // OR create records for ALL members with default price, and override for voters.
            // Strategy: Create records for voters with specific prices.
            // Non-voters will be handled dynamically by the UI/Store when viewing.

            const voterMemberIds = new Set<string>();

            // Process Voters
            if (votes) {
                votes.forEach((vote: any) => {
                    const memberId = userMap.get(vote.user_id);
                    if (memberId) {
                        const price = optionPrices[vote.option_id];
                        if (price !== undefined) {
                            recordsToInsert.push({
                                payment_item_id: paymentItemId,
                                member_id: memberId,
                                amount_paid: 0,
                                status: 'unpaid',
                                bill_amount: price // Override default
                            });
                            voterMemberIds.add(memberId);
                        }
                    }
                });
            }

            // Process Non-Voters (Standard Price)
            /*
            allMembers.forEach(memberId => {
                if (!voterMemberIds.has(memberId)) {
                    recordsToInsert.push({
                         payment_item_id: paymentItemId,
                         member_id: memberId,
                         amount_paid: 0,
                         status: 'unpaid',
                         // bill_amount: NULL (uses default) or Explicit Default?
                         // Let's keep it null to default to item amount
                    });
                }
            });
            */
            // NOTE: The current system (PaymentDetailPage) generates rows for ALL members dynamically.
            // It lazily creates payment_records only when a payment is made?
            // WAIT. In `loadPaymentRecords`, we only load records that exist.
            // In `PaymentDetailPage`, `combinedData` maps `membersStore.members`. 
            // If no record exists, it assumes standard details.
            // SO: We only need to insert records for those who have a SPECIAL price.
            // The "Standard" members don't strictly NEED a record yet if they haven't paid.
            // BUT if we want to enforce "Unpaid" status explicitly or something... 
            // Actually, `PaymentDetailPage` calculates `remaining` based on `currentItem.amount` if record is missing.
            // So inserting records ONLY for voters with special prices is efficient.

            if (recordsToInsert.length > 0) {
                const { error: recordsError } = await (supabase
                    .from('payment_records') as any)
                    .insert(recordsToInsert);

                if (recordsError) throw recordsError;
            }

            await loadPaymentItems();
            return paymentItemId;

        } catch (error) {
            console.error('Error creating payment from poll:', error);
            return null;
        }
    };

    return {
        paymentItems,
        currentPaymentRecords,
        isLoading,
        loadPaymentItems,
        getPaymentItemById,
        loadPaymentRecords,
        recordPayment,
        createPaymentItem,
        updatePaymentItem,
        deletePaymentItem,
        createPaymentFromPoll
    };
});
