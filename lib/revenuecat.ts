import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

const REVENUECAT_API_KEY = 'goog_XyFIZTSvzbeklAZEuAUyjrWtNbu';
export const ENTITLEMENT_ID = 'BillSnapr Pro';

let isConfigured = false;

/**
 * Initialize RevenueCat SDK. Call once at app start.
 */
export async function initRevenueCat() {
    if (isConfigured) return;

    if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
    });

    isConfigured = true;
}

/**
 * Identify user with Supabase user ID.
 * Call after successful auth.
 */
export async function identifyUser(userId: string) {
    try {
        const { customerInfo } = await Purchases.logIn(userId);
        return customerInfo;
    } catch (error) {
        console.error('RevenueCat identify error:', error);
        return null;
    }
}

/**
 * Log out RevenueCat customer. Call on sign-out.
 */
export async function logoutRevenueCat() {
    try {
        const info = await Purchases.getCustomerInfo();
        // Only log out if we have an identified (non-anonymous) user
        if (!info.originalAppUserId.startsWith('$RCAnonymousID:')) {
            await Purchases.logOut();
        }
    } catch {
        // Safe to ignore — may throw if SDK not yet configured
    }
}

/**
 * Check if user has the Pro entitlement.
 */
export function isPro(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

/**
 * Get current customer info.
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
        return await Purchases.getCustomerInfo();
    } catch {
        return null;
    }
}

/**
 * Get current offerings (products/packages).
 */
export async function getOfferings() {
    try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
    } catch {
        return null;
    }
}
