import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

interface ConfirmOptions {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

export const useUIStore = defineStore('ui', () => {
    // Toast State
    const toasts = ref<Toast[]>([]);
    let nextToastId = 1;

    const showToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
        const id = nextToastId++;
        toasts.value.push({ id, message, type });
        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id: number) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index > -1) {
            toasts.value.splice(index, 1);
        }
    };

    // Confirm State
    const isConfirmOpen = ref(false);
    const confirmOptions = ref<ConfirmOptions>({
        message: '',
        title: 'Konfirmasi',
        confirmText: 'Ya',
        cancelText: 'Batal',
        variant: 'primary'
    });

    let resolveConfirm: ((value: boolean) => void) | null = null;

    const confirm = (options: string | ConfirmOptions): Promise<boolean> => {
        if (typeof options === 'string') {
            confirmOptions.value = {
                message: options,
                title: 'Konfirmasi',
                confirmText: 'Ya',
                cancelText: 'Batal',
                variant: 'primary'
            };
        } else {
            confirmOptions.value = {
                title: 'Konfirmasi',
                confirmText: 'Ya',
                cancelText: 'Batal',
                variant: 'primary',
                ...options
            };
        }

        isConfirmOpen.value = true;
        return new Promise((resolve) => {
            resolveConfirm = resolve;
        });
    };

    const handleConfirm = (result: boolean) => {
        isConfirmOpen.value = false;
        if (resolveConfirm) {
            resolveConfirm(result);
            resolveConfirm = null;
        }
    };

    return {
        toasts,
        showToast,
        removeToast,
        isConfirmOpen,
        confirmOptions,
        confirm,
        handleConfirm
    };
});
