import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { useNetworkStatus } from '@/hooks/use-network';
import { useCreateOrder, useOrders } from '@/hooks/use-orders';
import { useGate, useSubscription } from '@/hooks/use-subscription';
import { getCurrencySymbol } from '@/lib/currency';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { enqueueOrder } from '@/lib/offline-queue';
import { EscPosBuilder } from '@/lib/printer/esc-pos';
import { useAuthStore, useCartStore } from '@/store';
import { usePrinterStore } from '@/store/printer';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
    const cart = useCartStore();
    const tenant = useAuthStore((s) => s.tenant);
    const user = useAuthStore((s) => s.user);
    const createOrder = useCreateOrder();
    const { connectedDevice, print } = usePrinterStore();
    const { isOnline } = useNetworkStatus();
    const { isPro } = useSubscription();

    useEffect(() => {
        if (cart.items.length === 0) {
            router.back();
        }
    }, [cart.items.length]);

    // Check monthly order limit
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthlyOrders } = useOrders({ dateFrom: monthStart });
    const orderGate = useGate('orders', monthlyOrders?.length ?? 0);

    const handlePrinterStatusClick = () => {
        if (!connectedDevice) {
            router.push('/settings/printer');
        } else {
            Alert.alert(
                'Printer Connected',
                `Connected to ${connectedDevice.name}`,
                [
                    { text: 'Disconnect', onPress: () => router.push('/settings/printer'), style: 'destructive' },
                    { text: 'OK' }
                ]
            );
        }
    };



    const [autoPrint, setAutoPrint] = useState(true);
    const [customerName, setCustomerName] = useState('');

    const handleCheckout = () => {
        if (!cart.paymentMethod) {
            Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
            return;
        }
        if (!tenant || !user) {
            Alert.alert('Error', 'Not authenticated');
            return;
        }

        // Check monthly order limit
        if (!orderGate.allowed) {
            orderGate.showPaywall();
            return;
        }

        // Snapshot order data for offline serialization
        const orderVars = {
            tenantId: tenant.id,
            userId: user.id,
            subtotal: cart.subtotal(),
            taxTotal: cart.taxTotal(),
            discountAmount: cart.discountAmount(),
            total: cart.total(),
            paymentMethod: cart.paymentMethod,
            customerName: customerName.trim() || undefined,
            items: cart.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                taxRate: item.taxRate,
            })),
        };

        if (!isOnline) {
            // Offline: save to persistent queue (survives app restart)
            enqueueOrder(orderVars).then(() => {
                hapticSuccess();
                cart.clearCart();
                Alert.alert(
                    'Order Queued ⏳',
                    'Your order has been saved and will sync automatically when you\'re back online.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            });
            return;
        }

        createOrder.mutate(orderVars, {
            onSuccess: async (order) => {
                // Auto-print if connected AND enabled
                if (connectedDevice && autoPrint) {
                    await printReceipt(order);
                }

                hapticSuccess();
                Alert.alert('Success', 'Order placed successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            },
            onError: (error) => {
                hapticError();
                Alert.alert('Error', error.message);
            }
        });
    };

    const printBill = async () => {
        // Block printing if monthly order limit reached
        if (!orderGate.allowed) {
            orderGate.showPaywall();
            return;
        }

        if (!connectedDevice) {
            Alert.alert('No Printer', 'Please connect a printer first.');
            return;
        }
        try {
            // Re-use logic but for CART items (Estimate)
            // Ideally we'd have a separate helper, but we can construct it here for now
            const builder = new EscPosBuilder()
                .initialize()
                .align('center')
                .bold(true)
                .size(1, 1)
                .textLine(tenant?.name || 'BillSnapr')
                .bold(false)
                .size(0, 0);

            // Pro users get custom header
            if (isPro && tenant?.receipt_header) {
                builder.textLine(tenant.receipt_header);
            }

            builder
                .textLine('*** ESTIMATE / BILL ***')
                .textLine('--------------------------------');

            if (customerName.trim()) {
                builder.align('left').textLine(`Customer: ${customerName.trim()}`);
                builder.textLine('--------------------------------');
            }

            builder.align('left');

            cart.items.forEach(item => {
                builder.textLine(`${item.quantity}x ${item.name}`);
                builder.align('right').textLine(`${getCurrencySymbol(tenant?.currency)}${item.price.toFixed(2)}`).align('left');
            });

            builder.textLine('--------------------------------');
            builder.align('right');
            builder.textLine(`Total: ${getCurrencySymbol(tenant?.currency)}${cart.total().toFixed(2)}`);
            builder.align('center');

            // Pro users get custom footer, free users get default
            const billFooter = isPro && tenant?.receipt_footer
                ? tenant.receipt_footer
                : 'Valid for 24 hours';

            builder.feed(2)
                .textLine(billFooter)
                .feed(2)
                .cut();

            await print(builder.getBuffer());
        } catch (e) {
            Alert.alert('Printing Failed', 'Could not print bill.');
        }
    };

    const printReceipt = async (order: any) => {
        try {
            const builder = new EscPosBuilder()
                .initialize()
                .align('center')
                .bold(true)
                .size(1, 1)
                .textLine(tenant?.name || 'BillSnapr')
                .bold(false)
                .size(0, 0);

            // Pro users get custom header
            if (isPro && tenant?.receipt_header) {
                builder.textLine(tenant.receipt_header);
            }

            builder
                .textLine('--------------------------------');

            if (customerName.trim()) {
                builder.align('left').textLine(`Customer: ${customerName.trim()}`);
                builder.textLine('--------------------------------');
            }

            builder.align('left');

            // Items
            cart.items.forEach(item => {
                builder.textLine(`${item.quantity}x ${item.name}`);
                builder.align('right').textLine(`${getCurrencySymbol(tenant?.currency)}${item.price.toFixed(2)}`).align('left');
            });

            builder.textLine('--------------------------------');

            // Totals
            builder.align('right');
            builder.textLine(`Total: ${getCurrencySymbol(tenant?.currency)}${cart.total().toFixed(2)}`);
            builder.align('center');

            // Pro users get custom footer, free users get default
            const receiptFooter = isPro && tenant?.receipt_footer
                ? tenant.receipt_footer
                : 'Thank you for your business!';

            builder.feed(2)
                .textLine(receiptFooter)
                .feed(2)
                .cut();

            await print(builder.getBuffer());
        } catch (e) {
            console.error('Printing failed', e);
            Alert.alert('Printing Failed', 'Could not print receipt, but order was saved.');
        }
    };

    return (
        <Screen
            safeArea
            safeAreaEdges={['top', 'bottom']}
            scrollable={false}
            className="bg-surface"
        >
            <Stack.Screen options={{
                title: 'Checkout',
                headerShown: false,
            }} />

            {/* Custom Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 px-4 pt-2">
                <Text className="text-xl font-bold text-text-primary">Checkout</Text>
                <View className="flex-row gap-4">
                    {/* Print Bill Button */}
                    <TouchableOpacity onPress={printBill} disabled={!connectedDevice} className={!connectedDevice ? 'opacity-50' : ''}>
                        <IconSymbol name="doc.text" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <IconSymbol name="xmark" size={24} color="#0F172A" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Printer Status Bar */}
            <TouchableOpacity
                onPress={handlePrinterStatusClick}
                className={`flex-row items-center px-4 py-2 mb-2 ${connectedDevice ? 'bg-green-50' : 'bg-gray-50'} border-b border-gray-100`}
            >
                <IconSymbol
                    name={connectedDevice ? "printer.fill" : "printer"}
                    size={16}
                    color={connectedDevice ? "#059669" : "#64748B"}
                />
                <Text className={`ml-2 text-sm font-medium ${connectedDevice ? 'text-green-700' : 'text-gray-500'}`}>
                    {connectedDevice ? `Printer Ready: ${connectedDevice.name}` : 'No Printer Connected (Tap to setup)'}
                </Text>
                <View className="flex-1" />
                {!connectedDevice && <IconSymbol name="chevron.right" size={12} color="#94A3B8" />}
            </TouchableOpacity>

            {/* Sticky Total Banner — Gradient Hero */}
            <LinearGradient
                colors={['#065F46', '#00936E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="mx-4 my-1 rounded-2xl overflow-hidden"
            >
                <View className="px-5 py-5 items-center">
                    <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Amount</Text>
                    <Text className="text-white text-4xl font-extrabold tracking-tight">
                        {getCurrencySymbol(tenant?.currency)}{cart.total().toFixed(2)}
                    </Text>
                    <Text className="text-white/50 text-xs mt-1">
                        {cart.items.reduce((sum, i) => sum + i.quantity, 0)} items
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}>
                {/* Cart Items */}
                <View className="gap-3 mb-6">
                    {cart.items.map((item) => (
                        <View key={item.productId} className="flex-row items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <View className="flex-1">
                                <Text className="text-text-primary font-medium text-base">{item.name}</Text>
                                <Text className="text-primary-600 font-semibold">
                                    {getCurrencySymbol(tenant?.currency)}{(item.price * item.quantity).toFixed(2)}
                                </Text>
                                {item.quantity > 1 && (
                                    <Text className="text-text-muted text-xs">
                                        {getCurrencySymbol(tenant?.currency)}{item.price.toFixed(2)} each
                                    </Text>
                                )}
                            </View>

                            <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200">
                                <TouchableOpacity
                                    onPress={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                                    className="p-2 w-8 items-center"
                                >
                                    <Text className="text-lg font-bold text-gray-400">-</Text>
                                </TouchableOpacity>
                                <Text className="w-6 text-center font-semibold text-text-primary">{item.quantity}</Text>
                                <TouchableOpacity
                                    onPress={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                                    className="p-2 w-8 items-center"
                                >
                                    <Text className="text-lg font-bold text-primary-500">+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Customer Name (Optional) */}
                <View className="mb-6">
                    <Text className="text-text-muted font-bold text-xs uppercase tracking-widest mb-3 ml-1">Customer Name (Optional)</Text>
                    <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 shadow-sm">
                        <IconSymbol name="person" size={16} color="#94A3B8" />
                        <TextInput
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholder="e.g. John"
                            className="flex-1 py-3.5 px-3 text-text-primary text-base"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="words"
                        />
                        {customerName.length > 0 && (
                            <TouchableOpacity onPress={() => setCustomerName('')}>
                                <IconSymbol name="xmark.circle.fill" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Payment Methods */}
                {/* ... (keep existing payment methods) ... */}
                <View className="mb-6">
                    <Text className="text-text-muted font-bold text-xs uppercase tracking-widest mb-3 ml-1">Payment Method</Text>
                    <View className="flex-row gap-3">
                        {[
                            { id: 'cash', label: 'Cash', icon: 'banknote' },
                            { id: 'card', label: 'Card', icon: 'creditcard' },
                            { id: 'other', label: 'Other', icon: 'qrcode' },
                        ].map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                onPress={() => cart.setPaymentMethod(method.id as any)}
                                className="flex-1 items-center justify-center p-4 rounded-xl border"
                                style={{
                                    borderColor: cart.paymentMethod === method.id ? '#00936E' : '#E2E8F0',
                                    backgroundColor: cart.paymentMethod === method.id ? '#ECFDF5' : '#FFFFFF',
                                }}
                            >
                                <IconSymbol
                                    name={method.icon as any}
                                    size={24}
                                    color={cart.paymentMethod === method.id ? '#00936E' : '#64748B'}
                                />
                                <Text className={`mt-2 font-medium text-sm ${cart.paymentMethod === method.id ? 'text-primary-700' : 'text-text-secondary'
                                    }`}>
                                    {method.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Discount Section */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-text-primary font-semibold text-base">Discount</Text>
                        {cart.discount && (
                            <TouchableOpacity onPress={() => cart.applyDiscount(null)}>
                                <Text className="text-red-500 text-sm font-medium">Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="flex-row gap-2 mb-3">
                        <TouchableOpacity
                            onPress={() => cart.applyDiscount({ type: 'fixed', value: cart.discount?.value ?? 0 })}
                            className={`flex-1 py-2.5 rounded-lg border items-center ${cart.discount?.type === 'fixed' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}
                        >
                            <Text className={`font-medium text-sm ${cart.discount?.type === 'fixed' ? 'text-primary-700' : 'text-text-secondary'}`}>
                                {getCurrencySymbol(tenant?.currency)} Fixed
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => cart.applyDiscount({ type: 'percentage', value: cart.discount?.value ?? 0 })}
                            className={`flex-1 py-2.5 rounded-lg border items-center ${cart.discount?.type === 'percentage' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}
                        >
                            <Text className={`font-medium text-sm ${cart.discount?.type === 'percentage' ? 'text-primary-700' : 'text-text-secondary'}`}>
                                % Percentage
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {cart.discount && (
                        <View className="flex-row items-center gap-2">
                            <View className="flex-1 bg-surface-subtle border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
                                <Text className="text-text-muted mr-2">
                                    {cart.discount.type === 'fixed' ? getCurrencySymbol(tenant?.currency) : '%'}
                                </Text>
                                <TextInput
                                    value={cart.discount.value ? String(cart.discount.value) : ''}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        cart.applyDiscount({ type: cart.discount!.type, value: num });
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    className="flex-1 text-text-primary text-base"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            {cart.discountAmount() > 0 && (
                                <View className="bg-green-50 px-3 py-3 rounded-xl border border-green-100">
                                    <Text className="text-green-700 font-semibold text-sm">
                                        -{getCurrencySymbol(tenant?.currency)}{cart.discountAmount().toFixed(2)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Bill Summary */}
                {/* ... (keep existing bill summary) ... */}
                <View className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Subtotal</Text>
                        <Text className="text-text-primary font-medium">
                            {getCurrencySymbol(tenant?.currency)}{cart.subtotal().toFixed(2)}
                        </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Tax</Text>
                        <Text className="text-text-primary font-medium">
                            {getCurrencySymbol(tenant?.currency)}{cart.taxTotal().toFixed(2)}
                        </Text>
                    </View>
                    {cart.discountAmount() > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-green-600">Discount</Text>
                            <Text className="text-green-600 font-medium">
                                -{getCurrencySymbol(tenant?.currency)}{cart.discountAmount().toFixed(2)}
                            </Text>
                        </View>
                    )}
                    <View className="h-px bg-gray-200 my-3" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-text-primary">Total</Text>
                        <Text className="text-2xl font-bold text-primary-600">
                            {getCurrencySymbol(tenant?.currency)}{cart.total().toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Auto-Print Toggle */}
                {connectedDevice && (
                    <TouchableOpacity
                        onPress={() => setAutoPrint(!autoPrint)}
                        className="flex-row items-center justify-between p-4 bg-white rounded-xl border border-gray-200 mb-20"
                    >
                        <View className="flex-row items-center">
                            <IconSymbol name={autoPrint ? "printer.fill" : "printer"} size={20} color={autoPrint ? "#059669" : "#64748B"} />
                            <Text className="ml-3 font-medium text-text-primary">Auto-Print Receipt</Text>
                        </View>
                        <View className={`w-12 h-7 rounded-full ${autoPrint ? 'bg-primary-500' : 'bg-gray-200'} justify-center px-1`}>
                            <View className={`w-5 h-5 rounded-full bg-white shadow-sm ${autoPrint ? 'self-end' : 'self-start'}`} />
                        </View>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Footer Button - Fixed at bottom */}
            <View className="absolute bottom-6 left-4 right-4 shadow-lg">
                <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={createOrder.isPending || !cart.paymentMethod}
                    className={`rounded-xl py-4 flex-row justify-center items-center shadow-md ${createOrder.isPending || !cart.paymentMethod
                        ? 'bg-gray-300'
                        : 'bg-primary-500'
                        }`}
                >
                    {createOrder.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {cart.paymentMethod ? `Pay ${getCurrencySymbol(tenant?.currency)}${cart.total().toFixed(2)}` : 'Select Payment Method'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </Screen>
    );
}
