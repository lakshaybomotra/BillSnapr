import { IconSymbol } from '@/components/ui/icon-symbol';
import { useOrder, useVoidOrder } from '@/hooks/use-orders';
import { getCurrencySymbol } from '@/lib/currency';
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

    const currency = getCurrencySymbol(tenant?.currency);

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
                .bold(false)
                .textLine(tenant?.receipt_header || '')
                .textLine('--------------------------------')
                .align('left')
                .textLine(`Order #: ${order.order_number}`)
                .textLine(`Date: ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}`)
                .textLine('--------------------------------');

            // Items
            order.order_items?.forEach((item) => {
                builder.textLine(`${item.quantity}x ${item.product_name}`);
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
                .textLine(tenant?.receipt_footer || 'Thank You!')
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
                                </View>
                                <Text className="text-text-primary font-medium">
                                    {currency}{(item.price * item.quantity).toFixed(2)}
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
                            {currency}{order.subtotal.toFixed(2)}
                        </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Tax</Text>
                        <Text className="text-text-primary font-medium">
                            {currency}{order.tax_total.toFixed(2)}
                        </Text>
                    </View>
                    {order.discount_amount > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-green-600">Discount</Text>
                            <Text className="text-green-600 font-medium">
                                -{currency}{order.discount_amount.toFixed(2)}
                            </Text>
                        </View>
                    )}
                    <View className="h-[1px] bg-gray-200 my-2" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-text-primary">Total</Text>
                        <Text className="text-2xl font-bold text-primary-600">
                            {currency}{order.total.toFixed(2)}
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

                    {order.status === 'completed' && (
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
