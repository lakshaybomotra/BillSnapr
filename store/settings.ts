import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PaymentMethod = 'cash' | 'card' | 'other';

interface SettingsState {
    defaultPaymentMethod: PaymentMethod | null;
    setDefaultPaymentMethod: (method: PaymentMethod | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            defaultPaymentMethod: null,
            setDefaultPaymentMethod: (method) => set({ defaultPaymentMethod: method }),
        }),
        {
            name: 'billsnapr-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
