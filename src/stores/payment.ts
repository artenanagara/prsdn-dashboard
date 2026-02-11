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
                createdAt: record.created_at
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
        deletePaymentItem
    };
});
