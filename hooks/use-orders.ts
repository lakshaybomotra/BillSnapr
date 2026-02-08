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
    created_by: string;
    created_at: string;
    order_items?: OrderItem[];
}

// Fetch orders with pagination
export function useOrders(limit = 50) {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['orders', tenant?.id, limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false })
                .limit(limit);

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

// Create order from cart
export function useCreateOrder() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);
    const user = useAuthStore((s) => s.user);
    const cart = useCartStore();

    return useMutation({
        mutationFn: async () => {
            if (!tenant || !user) throw new Error('Not authenticated');
            if (cart.items.length === 0) throw new Error('Cart is empty');
            if (!cart.paymentMethod) throw new Error('Payment method required');

            // Calculate totals
            const subtotal = cart.subtotal();
            const taxTotal = cart.taxTotal();
            const discountAmount = cart.discountAmount();
            const total = cart.total();

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    tenant_id: tenant.id,
                    subtotal,
                    tax_total: taxTotal,
                    discount_amount: discountAmount,
                    total,
                    payment_method: cart.paymentMethod,
                    status: 'completed',
                    created_by: user.id,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = cart.items.map((item) => ({
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
        },
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
