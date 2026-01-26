import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FinanceTransaction } from '../types';
import { supabase } from '../lib/supabase';

export const useFinanceStore = defineStore('finance', () => {
    const transactions = ref<FinanceTransaction[]>([]);
    const isLoading = ref(false);

    const totalIncome = computed(() => {
        return transactions.value
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    });

    const totalExpense = computed(() => {
        return transactions.value
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    });

    const balance = computed(() => totalIncome.value - totalExpense.value);

    const incomeTransactions = computed(() =>
        transactions.value.filter(t => t.type === 'income').sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    );

    const expenseTransactions = computed(() =>
        transactions.value.filter(t => t.type === 'expense').sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    );

    const loadTransactions = async () => {
        isLoading.value = true;
        try {
            const { data, error } = await supabase
                .from('finance_transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            transactions.value = ((data || []) as any[]).map((record: any) => ({
                id: record.id,
                type: record.type,
                category: record.category,
                title: record.title,
                amount: record.amount,
                date: record.date,
                note: record.note,
                createdAt: record.created_at
            }));
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            isLoading.value = false;
        }
    };

    const createTransaction = async (data: Omit<FinanceTransaction, 'id' | 'createdAt'>): Promise<FinanceTransaction | null> => {
        try {
            const { data: insertedData, error } = await (supabase
                .from('finance_transactions') as any)
                .insert({
                    type: data.type,
                    category: data.category,
                    title: data.title,
                    amount: data.amount,
                    date: data.date,
                    note: data.note
                })
                .select()
                .single();

            if (error) throw error;

            await loadTransactions();
            return {
                id: (insertedData as any).id,
                ...data,
                createdAt: (insertedData as any).created_at
            };
        } catch (error) {
            console.error('Error creating transaction:', error);
            return null;
        }
    };

    const updateTransaction = async (id: string, data: Partial<FinanceTransaction>): Promise<boolean> => {
        try {
            const updateData: any = {};
            if (data.type !== undefined) updateData.type = data.type;
            if (data.category !== undefined) updateData.category = data.category;
            if (data.title !== undefined) updateData.title = data.title;
            if (data.amount !== undefined) updateData.amount = data.amount;
            if (data.date !== undefined) updateData.date = data.date;
            if (data.note !== undefined) updateData.note = data.note;

            const { error } = await (supabase
                .from('finance_transactions') as any)
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            await loadTransactions();
            return true;
        } catch (error) {
            console.error('Error updating transaction:', error);
            return false;
        }
    };

    const deleteTransaction = async (id: string): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('finance_transactions') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadTransactions();
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
    };

    const getKasTransactionByMonth = (monthKey: string): FinanceTransaction | undefined => {
        return transactions.value.find(
            t => t.category === 'kas' && t.title.includes(monthKey)
        );
    };

    // Realtime subscription
    const subscribeToChanges = () => {
        supabase
            .channel('public:finance_transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => {
                loadTransactions();
            })
            .subscribe();
    };

    return {
        transactions,
        isLoading,
        totalIncome,
        totalExpense,
        balance,
        incomeTransactions,
        expenseTransactions,
        loadTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        getKasTransactionByMonth,
        subscribeToChanges
    };
});
