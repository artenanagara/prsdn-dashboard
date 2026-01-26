import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { KasPayment } from '../types';
import { supabase } from '../lib/supabase';
import { useFinanceStore } from './finance';
import { useMembersStore } from './members';

export const useKasStore = defineStore('kas', () => {
    const payments = ref<KasPayment[]>([]);
    const isLoading = ref(false);

    const loadPayments = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('kas_payments')
                .select('*')
                .order('month_key', { ascending: false });

            if (error) throw error;

            payments.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                monthKey: record.month_key,
                year: record.year,
                memberId: record.member_id,
                amount: record.amount,
                paidAt: record.paid_at || undefined,
                status: record.status
            }));
        } catch (error) {
            console.error('Error loading kas payments:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const getPaymentsByMonth = (monthKey: string): KasPayment[] => {
        return payments.value.filter(p => p.monthKey === monthKey);
    };

    const getPaymentsByMember = (memberId: string): KasPayment[] => {
        return payments.value.filter(p => p.memberId === memberId)
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    };

    const getMonthSummary = (monthKey: string) => {
        const monthPayments = getPaymentsByMonth(monthKey);
        const paidCount = monthPayments.filter(p => p.status === 'paid').length;
        const unpaidCount = monthPayments.filter(p => p.status === 'unpaid').length;
        const totalCollected = monthPayments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);

        return {
            total: monthPayments.length,
            paidCount,
            unpaidCount,
            totalCollected
        };
    };

    const getCurrentMonthUnpaid = computed(() => {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthPayments = getPaymentsByMonth(currentMonthKey);
        return monthPayments.filter(p => p.status === 'unpaid').length;
    });

    const saveMonthPayments = async (monthKey: string, paymentData: Array<{ memberId: string; amount: number; status: 'paid' | 'unpaid'; paidAt?: string }>): Promise<void> => {
        const year = parseInt(monthKey.split('-')[0]!);
        const financeStore = useFinanceStore();

        // 1. Delete existing payments for this month
        try {
            await (supabase
                .from('kas_payments') as any)
                .delete()
                .eq('month_key', monthKey);

            // 2. Create new payments
            const insertData = paymentData.map(data => ({
                month_key: monthKey,
                year,
                member_id: data.memberId,
                amount: data.amount,
                paid_at: data.paidAt || null,
                status: data.status
            }));

            const { error } = await (supabase
                .from('kas_payments') as any)
                .insert(insertData);

            if (error) throw error;

            await loadPayments();

            // 3. Update Finance Function
            const totalPaid = paymentData
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0);

            // Need to find if transaction exists. Since financeStore.getKasTransactionByMonth depends on loaded transactions
            // and financeStore might be async, we rely on what's in memory or fetch fresh?
            // "financeStore.loadTransactions()" should be called or we trust current state.
            // But better: use financeStore methods which are now async.

            const existingTransaction = financeStore.getKasTransactionByMonth(monthKey);

            if (existingTransaction) {
                await financeStore.updateTransaction(existingTransaction.id, {
                    amount: totalPaid,
                    date: new Date().toISOString().split('T')[0]
                });
            } else {
                await financeStore.createTransaction({
                    type: 'income',
                    category: 'kas',
                    title: `Kas ${monthKey}`,
                    amount: totalPaid,
                    date: new Date().toISOString().split('T')[0]!,
                    note: 'Auto-generated from Kas payment'
                });
            }

        } catch (error) {
            console.error('Error saving month payments:', error);
            throw error; // Propagate error to caller
        }
    };

    const initializeMonthPayments = async (monthKey: string): Promise<void> => {
        const existing = getPaymentsByMonth(monthKey);
        if (existing.length > 0) return;

        const membersStore = useMembersStore();
        if (membersStore.members.length === 0) await membersStore.loadMembers();

        const year = parseInt(monthKey.split('-')[0]!);

        const insertData = membersStore.members.map(member => ({
            month_key: monthKey,
            year,
            member_id: member.id,
            amount: 5000,
            status: 'unpaid'
        }));

        try {
            const { error } = await (supabase
                .from('kas_payments') as any)
                .insert(insertData);

            if (error) throw error;

            await loadPayments();
        } catch (error) {
            console.error('Error initializing month payments:', error);
        }
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:kas_payments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kas_payments' }, () => {
                loadPayments();
            })
            .subscribe();
    };

    return {
        payments,
        isLoading,
        currentMonthUnpaid: getCurrentMonthUnpaid,
        loadPayments,
        getPaymentsByMonth,
        getPaymentsByMember,
        getMonthSummary,
        saveMonthPayments,
        initializeMonthPayments,
        subscribeToChanges
    };
});
