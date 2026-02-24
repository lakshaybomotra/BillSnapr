import { IconSymbol } from '@/components/ui/icon-symbol';
import { useOrder, useVoidOrder } from '@/hooks/use-orders';
import { useRole } from '@/hooks/use-role';
import { useSubscription } from '@/hooks/use-subscription';
import { EscPosBuilder } from '@/lib/printer/esc-pos';
import { useAuthStore } from '@/store';
import { usePrinterStore } from '@/store/printer';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams();
    const orderId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();
    const { data: order, isLoading } = useOrder(orderId!);
    const voidOrder = useVoidOrder();
    const tenant = useAuthStore((s) => s.tenant);

    // Printer Store
    const { connectedDevice, print } = usePrinterStore();
    const { isPro } = useSubscription();
    const { canVoidOrders } = useRole();

    const getCurrencySymbol = () => {
        switch (tenant?.currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return '₹';
        }
    };

    const handlePrint = async () => {
        if (!connectedDevice) {
            Alert.alert('No Printer', 'Please connect a printer in Settings.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Go to Settings', onPress: () => router.push('/settings/printer' as any) }
            ]);
            return;
        }

        if (!order) return;

        try {
            const builder = new EscPosBuilder()
                .initialize()
                .align('center')
                .bold(true)
                .textLine(tenant?.name || 'BillSnapr')
                .bold(false);

            // Pro users get custom header
            if (isPro && tenant?.receipt_header) {
                builder.textLine(tenant.receipt_header);
            }

            builder
                .textLine('--------------------------------')
                .align('left')
                .textLine(`Order #: ${order.order_number}`)
                .textLine(`Date: ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}`);

            if (order.customer_name) {
                builder.textLine(`Customer: ${order.customer_name}`);
            }

            builder.textLine('--------------------------------');

            // Items
            order.order_items?.forEach((item) => {
                const displayName = item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name;
                builder.textLine(`${item.quantity}x ${displayName}`);
                builder.align('right').textLine(`${(item.price * item.quantity).toFixed(2)}`).align('left');
            });

            builder
                .textLine('--------------------------------')
                .align('right')
                .bold(true)
                .textLine(`TOTAL: ${order.total.toFixed(2)}`)
                .bold(false)
                .align('center')
                .textLine('--------------------------------')
                .textLine(isPro && tenant?.receipt_footer ? tenant.receipt_footer : 'Thank You!')
                .feed(3)
                .cut();

            await print(builder.getBuffer());
        } catch (error) {
            Alert.alert('Print Failed', (error as any).message);
        }
    };

    const handleVoid = () => {
        Alert.alert(
            'Void Order',
            'Are you sure you want to void this order? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Void Order',
                    style: 'destructive',
                    onPress: () => {
                        voidOrder.mutate(orderId!, {
                            onSuccess: () => router.back()
                        });
                    }
                }
            ]
        );
    };

    if (isLoading || !order) {
        return (
            <View className="flex-1 bg-surface items-center justify-center">
                <Stack.Screen options={{ title: 'Order Details' }} />
                <ActivityIndicator size="large" color="#00936E" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-surface">
            <Stack.Screen options={{ title: `Order #${order.order_number}` }} />

            {/* Status Banner */}
            <View className={`px-4 py-3 ${order.status === 'completed' ? 'bg-green-100' :
                order.status === 'voided' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                <Text className={`text-center font-bold ${order.status === 'completed' ? 'text-green-800' :
                    order.status === 'voided' ? 'text-red-800' : 'text-yellow-800'
                    } uppercase tracking-wider`}>
                    {order.status}
                </Text>
            </View>

            <View className="p-4">
                {/* Header Info */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <Text className="text-text-secondary text-sm mb-1">Date</Text>
                    <Text className="text-text-primary font-medium text-base mb-3">
                        {format(new Date(order.created_at), 'MMMM d, yyyy h:mm a')}
                    </Text>

                    {order.customer_name && (
                        <>
                            <Text className="text-text-secondary text-sm mb-1">Customer</Text>
                            <View className="flex-row items-center gap-2 mb-3">
                                <IconSymbol name="person.fill" size={16} color="#475569" />
                                <Text className="text-text-primary font-medium text-base">
                                    {order.customer_name}
                                </Text>
                            </View>
                        </>
                    )}

                    <Text className="text-text-secondary text-sm mb-1">Payment Method</Text>
                    <View className="flex-row items-center gap-2">
                        <IconSymbol
                            name={order.payment_method === 'cash' ? 'banknote' : order.payment_method === 'card' ? 'creditcard' : 'qrcode'}
                            size={18}
                            color="#475569"
                        />
                        <Text className="text-text-primary font-medium text-base capitalize">
                            {order.payment_method}
                        </Text>
                    </View>
                </View>

                {/* Items */}
                <View className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                    <View className="p-3 bg-gray-50 border-b border-gray-100">
                        <Text className="font-semibold text-text-primary">Order Items</Text>
                    </View>
                    <View className="p-4 gap-3">
                        {order.order_items?.map((item) => (
                            <View key={item.id} className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <Text className="text-text-primary font-medium">
                                        {item.quantity}x {item.product_name}
                                    </Text>
                                    {item.variant_name && (
                                        <Text className="text-text-muted text-xs">
                                            {item.variant_name}
                                        </Text>
                                    )}
                                </View>
                                <Text className="text-text-primary font-medium">
                                    {getCurrencySymbol()}{(item.price * item.quantity).toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Totals */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Subtotal</Text>
                        <Text className="text-text-primary font-medium">
                            {getCurrencySymbol()}{order.subtotal.toFixed(2)}
                        </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Tax</Text>
                        <Text className="text-text-primary font-medium">
                            {getCurrencySymbol()}{order.tax_total.toFixed(2)}
                        </Text>
                    </View>
                    {order.discount_amount > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-green-600">Discount</Text>
                            <Text className="text-green-600 font-medium">
                                -{getCurrencySymbol()}{order.discount_amount.toFixed(2)}
                            </Text>
                        </View>
                    )}
                    <View className="h-px bg-gray-200 my-2" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-text-primary">Total</Text>
                        <Text className="text-2xl font-bold text-primary-600">
                            {getCurrencySymbol()}{order.total.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="gap-3">
                    <TouchableOpacity
                        className={`py-4 rounded-xl flex-row justify-center items-center ${connectedDevice ? 'bg-primary-500' : 'bg-gray-400'
                            }`}
                        onPress={handlePrint}
                    >
                        <IconSymbol name="printer.fill" size={20} color="white" />
                        <Text className="text-white font-bold ml-2">
                            {connectedDevice ? 'Print Receipt' : 'Connect Printer'}
                        </Text>
                    </TouchableOpacity>

                    {order.status === 'completed' && canVoidOrders && (
                        <TouchableOpacity
                            onPress={handleVoid}
                            disabled={voidOrder.isPending}
                            className="bg-red-50 py-4 rounded-xl border border-red-100 flex-row justify-center items-center"
                        >
                            {voidOrder.isPending ? (
                                <ActivityIndicator color="#DC2626" />
                            ) : (
                                <>
                                    <IconSymbol name="xmark.circle" size={20} color="#DC2626" />
                                    <Text className="text-red-600 font-bold ml-2">Void Order</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
