import { ENTITLEMENT_ID, isPro } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';

interface SubscriptionState {
    tier: 'free' | 'pro';
    isProUser: boolean;
    isTrialing: boolean;
    expiresAt: string | null;
    customerInfo: CustomerInfo | null;

    // Actions
    syncFromCustomerInfo: (info: CustomerInfo) => void;
    syncFromTenant: (tier: string, expiresAt: string | null) => void;
    reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    tier: 'free',
    isProUser: false,
    isTrialing: false,
    expiresAt: null,
    customerInfo: null,

    syncFromCustomerInfo: (info: CustomerInfo) => {
        const proEntitlement = info.entitlements.active[ENTITLEMENT_ID];
        const hasPro = isPro(info);
        const newTier = hasPro ? 'pro' : 'free';
        const newExpiry = proEntitlement?.expirationDate ?? null;

        const prev = get();
        set({
            customerInfo: info,
            tier: newTier,
            isProUser: hasPro,
            isTrialing: proEntitlement?.periodType === 'TRIAL',
            expiresAt: newExpiry,
        });

        // Sync to Supabase if tier or expiry changed (admin only)
        if (prev.tier !== newTier || prev.expiresAt !== newExpiry) {
            syncTierToSupabase(newTier, newExpiry);
        }
    },

    // Staff/Manager: populate from tenant row (read-only, no DB write)
    syncFromTenant: (tier: string, expiresAt: string | null) => {
        set({
            tier: tier === 'pro' ? 'pro' : 'free',
            isProUser: tier === 'pro',
            isTrialing: false,
            expiresAt: expiresAt,
        });
    },

    reset: () => set({
        tier: 'free',
        isProUser: false,
        isTrialing: false,
        expiresAt: null,
        customerInfo: null,
    }),
}));

/** Persist subscription tier to tenants table in Supabase */
async function syncTierToSupabase(tier: string, expiresAt: string | null) {
    try {
        // Get current user's tenant from auth store (avoid circular import)
        const { useAuthStore } = await import('@/store');
        const tenantId = useAuthStore.getState().tenant?.id;
        if (!tenantId) return;

        await supabase
            .from('tenants')
            .update({
                subscription_tier: tier,
                subscription_expires_at: expiresAt,
            })
            .eq('id', tenantId);
    } catch (error) {
        console.error('Failed to sync subscription tier to DB:', error);
    }
}
