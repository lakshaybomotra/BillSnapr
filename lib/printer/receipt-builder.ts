import { format } from 'date-fns';
import { EscPosBuilder } from './esc-pos';

export interface ReceiptConfig {
    tenantName: string;
    currency: string;
    isPro: boolean;
    receiptHeader?: string | null;
    receiptFooter?: string | null;
}

export interface ReceiptItem {
    name: string;
    variantName?: string | null;
    price: number;
    quantity: number;
}

export interface ReceiptData {
    orderNumber?: number;
    date: string;
    customerName?: string | null;
    items: ReceiptItem[];
    total: number;
}

function formatPrice(amount: number): string {
    return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
}

/** Unified receipt builder for all print flows */
export function buildReceipt(config: ReceiptConfig, data: ReceiptData): Buffer {
    const builder = new EscPosBuilder();

    // Header
    builder
        .align('center')
        .bold(true)
        .size(1, 1)
        .textLine(config.tenantName || 'BillSnapr')
        .bold(false)
        .size(0, 0);

    if (config.isPro && config.receiptHeader) {
        builder.textLine(config.receiptHeader);
    }

    builder.line();

    // Order info
    builder.align('left');

    if (data.orderNumber) {
        builder.textLine(`Order #: ${data.orderNumber}`);
    }

    builder.textLine(`Date: ${format(new Date(data.date), 'dd/MM/yyyy HH:mm')}`);

    if (data.customerName?.trim()) {
        builder.textLine(`Customer: ${data.customerName.trim()}`);
    }

    builder.line();

    // Items — name+price, wraps automatically via columns()
    data.items.forEach(item => {
        const label = `${item.quantity}x ${item.name}`;
        const price = formatPrice(item.price * item.quantity);
        builder.columns(label, price);
    });

    // Total
    builder
        .line()
        .align('right')
        .bold(true)
        .textLine(`TOTAL: ${formatPrice(data.total)}`)
        .bold(false);

    // Footer
    const footer = config.isPro && config.receiptFooter
        ? config.receiptFooter
        : 'Thank you for your business!';

    builder
        .align('center')
        .feed(2)
        .textLine(footer)
        .feed(2)
        .cut();

    return builder.getBuffer();
}

/** Printer test page */
export function buildTestPage(): Buffer {
    const builder = new EscPosBuilder()
        .align('center')
        .textLine('BillSnapr Test Print')
        .line()
        .align('left')
        .textLine('Connection Successful!')
        .textLine('Printer is ready.')
        .feed(2)
        .cut();

    return builder.getBuffer();
}
