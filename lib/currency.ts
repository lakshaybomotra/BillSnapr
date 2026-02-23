export const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function getCurrencySymbol(currency?: string | null): string {
    const found = CURRENCIES.find((c) => c.code === currency);
    return found?.symbol ?? '₹';
}
