import { ENTITLEMENT_ID } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from '@/store/subscription';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

// ─── Types ────────────────────────────────────────────────────
export interface PlanLimits {
    tier: string;
    max_products: number | null;
    max_staff: number | null;
    max_orders_month: number | null;
    stock_tracking: boolean;
    receipt_customization: boolean;
    full_search: boolean;
}

export type GateFeature =
    | 'products'
    | 'staff'
    | 'orders'
    | 'stock_tracking'
    | 'receipt_customization'
    | 'full_search';

// ─── useSubscription ──────────────────────────────────────────
export function useSubscription() {
    const tier = useSubscriptionStore((s) => s.tier);
    const isPro = useSubscriptionStore((s) => s.isProUser);
    const isTrialing = useSubscriptionStore((s) => s.isTrialing);
    const expiresAt = useSubscriptionStore((s) => s.expiresAt);

    return { tier, isPro, isTrialing, expiresAt };
}

// ─── usePlanLimits ────────────────────────────────────────────
export function usePlanLimits() {
    const tier = useSubscriptionStore((s) => s.tier);

    return useQuery({
        queryKey: ['plan-limits', tier],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('plan_limits')
                .select('*')
                .eq('tier', tier)
                .single();

            if (error) throw error;
            return data as PlanLimits;
        },
    });
}

// ─── useGate ──────────────────────────────────────────────────
/**
 * Hook that checks whether a feature is allowed under the current plan.
 * Returns { allowed, current, max, showPaywall }.
 *
 * For boolean features (stock_tracking, receipt_customization, full_search),
 * `current` and `max` are not applicable.
 *
 * For count-based features (products, staff, orders),
 * pass `currentCount` to compare against the limit.
 */
export function useGate(feature: GateFeature, currentCount?: number) {
    const { data: limits } = usePlanLimits();
    const isPro = useSubscriptionStore((s) => s.isProUser);

    const result = useMemo(() => {
        if (!limits) return { allowed: true, current: 0, max: null, loading: true };

        // Boolean features
        if (feature === 'stock_tracking') return { allowed: limits.stock_tracking, current: 0, max: null, loading: false };
        if (feature === 'receipt_customization') return { allowed: limits.receipt_customization, current: 0, max: null, loading: false };
        if (feature === 'full_search') return { allowed: limits.full_search, current: 0, max: null, loading: false };

        // Count-based features
        let max: number | null = null;
        if (feature === 'products') max = limits.max_products;
        if (feature === 'staff') max = limits.max_staff;
        if (feature === 'orders') max = limits.max_orders_month;

        // null = unlimited
        if (max === null) return { allowed: true, current: currentCount ?? 0, max: null, loading: false };

        const count = currentCount ?? 0;
        return { allowed: count < max, current: count, max, loading: false };
    }, [limits, feature, currentCount, isPro]);

    const showPaywall = useCallback(async () => {
        // Only admin can purchase — staff/manager see "ask admin" message
        const { useAuthStore } = await import('@/store');
        const role = useAuthStore.getState().role;
        if (role !== 'admin') {
            Alert.alert('Pro Feature', 'Ask your restaurant admin to upgrade to the Pro plan.');
            return;
        }
        try {
            await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: ENTITLEMENT_ID,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not open upgrade screen.');
        }
    }, []);

    return { ...result, showPaywall };
}
