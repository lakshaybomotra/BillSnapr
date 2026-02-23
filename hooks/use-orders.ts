import { supabase } from '@/lib/supabase';
import { useAuthStore, useCartStore } from '@/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    price: number;
    quantity: number;
    tax_rate: number;
}

export interface Order {
    id: string;
    tenant_id: string;
    order_number: number;
    subtotal: number;
    tax_total: number;
    discount_amount: number;
    total: number;
    payment_method: 'cash' | 'card' | 'other';
    status: 'pending' | 'completed' | 'voided';
    customer_name?: string | null;
    created_by: string;
    created_at: string;
    order_items?: OrderItem[];
}

// Filter params for orders
export interface OrderFilters {
    search?: string;
    status?: 'completed' | 'voided' | 'pending' | null;
    dateFrom?: string; // ISO string
    dateTo?: string;   // ISO string
}

// Fetch orders with optional filters
export function useOrders(filters: OrderFilters = {}, limit = 50) {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['orders', tenant?.id, filters, limit],
        queryFn: async () => {
            let query = supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false })
                .limit(limit);

            // Status filter
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            // Date range filter
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }

            // Search by order number (cast to text for ilike)
            if (filters.search) {
                const num = parseInt(filters.search, 10);
                if (!isNaN(num)) {
                    query = query.eq('order_number', num);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Order[];
        },
        enabled: !!tenant,
    });
}

// Fetch single order
export function useOrder(orderId: string) {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            return data as Order;
        },
        enabled: !!orderId,
    });
}

// Order data passed as variables so it can be serialized for offline queue
interface CreateOrderVariables {
    tenantId: string;
    userId: string;
    subtotal: number;
    taxTotal: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    customerName?: string;
    items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        taxRate: number;
    }[];
}

// Standalone mutation function — exported so _layout.tsx can register it
// via setMutationDefaults for persisted offline mutations to resume.
export async function createOrderMutationFn(vars: CreateOrderVariables) {
    // Create order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            tenant_id: vars.tenantId,
            subtotal: vars.subtotal,
            tax_total: vars.taxTotal,
            discount_amount: vars.discountAmount,
            total: vars.total,
            payment_method: vars.paymentMethod,
            customer_name: vars.customerName || null,
            status: 'completed',
            created_by: vars.userId,
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = vars.items.map((item) => ({
        order_id: order.id,
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

    return order as Order;
}

// Create order from cart — supports offline queue
export function useCreateOrder() {
    const queryClient = useQueryClient();
    const cart = useCartStore();

    return useMutation({
        mutationKey: ['create-order'],
        mutationFn: createOrderMutationFn,
        onSuccess: () => {
            cart.clearCart();
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
        },
    });
}

// Void order
export function useVoidOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderId: string) => {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'voided' })
                .eq('id', orderId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
        },
    });
}

// Get daily stats
export function useDailyStats() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['daily-stats', tenant?.id],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('orders')
                .select('total, payment_method')
                .eq('status', 'completed')
                .gte('created_at', today.toISOString());

            if (error) throw error;

            const stats = {
                totalSales: 0,
                orderCount: data.length,
                cashSales: 0,
                cardSales: 0,
                otherSales: 0,
            };

            data.forEach((order) => {
                stats.totalSales += order.total;
                if (order.payment_method === 'cash') stats.cashSales += order.total;
                else if (order.payment_method === 'card') stats.cardSales += order.total;
                else stats.otherSales += order.total;
            });

            return stats;
        },
        enabled: !!tenant,
        refetchInterval: 30000, // Refresh every 30s
    });
}
