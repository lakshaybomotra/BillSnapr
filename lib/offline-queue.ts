import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'billsnapr-offline-orders';

export interface QueuedOrder {
    id: string; // local UUID for tracking
    createdAt: string;
    tenantId: string;
    userId: string;
    subtotal: number;
    taxTotal: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        taxRate: number;
    }[];
}

// Read the current queue from AsyncStorage
async function getQueue(): Promise<QueuedOrder[]> {
    try {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// Save the queue to AsyncStorage
async function saveQueue(queue: QueuedOrder[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Add an order to the offline queue
export async function enqueueOrder(order: Omit<QueuedOrder, 'id' | 'createdAt'>): Promise<void> {
    const queue = await getQueue();
    queue.push({
        ...order,
        id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
    });
    await saveQueue(queue);
}

// Get count of pending orders
export async function getPendingCount(): Promise<number> {
    const queue = await getQueue();
    return queue.length;
}

// Get all pending orders (for display)
export async function getPendingOrders(): Promise<QueuedOrder[]> {
    return getQueue();
}

// Process the entire queue — called when coming back online
export async function processOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: QueuedOrder[] = [];

    for (const order of queue) {
        try {
            // Create order in Supabase
            const { data: created, error: orderError } = await supabase
                .from('orders')
                .insert({
                    tenant_id: order.tenantId,
                    subtotal: order.subtotal,
                    tax_total: order.taxTotal,
                    discount_amount: order.discountAmount,
                    total: order.total,
                    payment_method: order.paymentMethod,
                    status: 'completed',
                    created_by: order.userId,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = order.items.map((item) => ({
                order_id: created.id,
                product_id: item.productId,
                product_name: item.name,
                price: item.price,
                quantity: item.quantity,
                tax_rate: item.taxRate,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            synced++;
        } catch {
            // Keep failed orders in queue for next retry
            remaining.push(order);
            failed++;
        }
    }

    await saveQueue(remaining);
    return { synced, failed };
}
