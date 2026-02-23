import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface Tenant {
    id: string;
    name: string;
    currency: string;
    logo_url: string | null;
    receipt_header: string | null;
    receipt_footer: string | null;
}

type Role = 'admin' | 'manager' | 'staff';

interface AuthState {
    session: Session | null;
    user: User | null;
    tenant: Tenant | null;
    role: Role | null;
    isLoading: boolean;
    isOnboarded: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    setUser: (user: User | null) => void;
    setTenant: (tenant: Tenant | null) => void;
    setRole: (role: Role | null) => void;
    setLoading: (loading: boolean) => void;
    setOnboarded: (onboarded: boolean) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    tenant: null,
    role: null,
    isLoading: true,
    isOnboarded: false,

    setSession: (session) => set({ session }),
    setUser: (user) => set({ user }),
    setTenant: (tenant) => set({ tenant }),
    setRole: (role) => set({ role }),
    setLoading: (loading) => set({ isLoading: loading }),
    setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
    reset: () => set({
        session: null,
        user: null,
        tenant: null,
        role: null,
        isLoading: false,
        isOnboarded: false,
    }),
}));
