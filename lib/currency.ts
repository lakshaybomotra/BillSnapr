const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    AED: '\u062F.\u0625',
    INR: '\u20B9',
};

export function getCurrencySymbol(currency?: string | null): string {
    return CURRENCY_SYMBOLS[currency || ''] || '\u20B9';
}
