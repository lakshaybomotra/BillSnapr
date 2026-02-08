import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { useCreateOrder } from '@/hooks/use-orders';
import { useAuthStore, useCartStore } from '@/store';
import { router, Stack } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
    const cart = useCartStore();
    const tenant = useAuthStore((s) => s.tenant);
    const createOrder = useCreateOrder();

    const handleCheckout = () => {
        if (!cart.paymentMethod) {
            Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
            return;
        }

        createOrder.mutate(undefined, {
            onSuccess: () => {
                Alert.alert('Success', 'Order placed successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            },
            onError: (error) => {
                Alert.alert('Error', error.message);
            }
        });
    };

    const getCurrencySymbol = () => {
        switch (tenant?.currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return '₹';
        }
    };

    if (cart.items.length === 0) {
        return (
            <View className="flex-1 bg-surface items-center justify-center p-6">
                <Stack.Screen options={{ title: 'Checkout' }} />
                <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <IconSymbol name="cart.badge.minus" size={48} color="#94A3B8" />
                </View>
                <Text className="text-xl font-bold text-text-primary mb-2">Your cart is empty</Text>
                <Text className="text-text-secondary text-center mb-6">
                    Add some items from the menu to get started.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-primary-500 px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <Screen
            safeArea
            safeAreaEdges={['top', 'bottom']}
            scrollable={false} // We manage ScrollView internally for layout control
            className="bg-surface"
        >
            <Stack.Screen options={{
                title: 'Checkout',
                headerShown: false, // We'll build a custom header or rely on Stack header, but custom is cleaner for modals
            }} />

            {/* Custom Header for cleaner modal look */}
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100">
                <Text className="text-xl font-bold text-text-primary">Checkout</Text>
                <TouchableOpacity onPress={() => router.back()} className="p-2 -mr-2">
                    <IconSymbol name="xmark" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 -mx-4" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}>
                {/* Cart Items */}
                <View className="gap-3 mb-6">
                    {cart.items.map((item) => (
                        <View key={item.productId} className="flex-row items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <View className="flex-1">
                                <Text className="text-text-primary font-medium text-base">{item.name}</Text>
                                <Text className="text-primary-600 font-semibold">
                                    {getCurrencySymbol()}{item.price.toFixed(2)}
                                </Text>
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

                {/* Payment Methods */}
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
                                className={`flex-1 items-center justify-center p-4 rounded-xl border ${cart.paymentMethod === method.id
                                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                                    : 'border-gray-200 bg-white'
                                    }`}
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

                {/* Bill Summary */}
                <View className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-20">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Subtotal</Text>
                        <Text className="text-text-primary font-medium">
                            {getCurrencySymbol()}{cart.subtotal().toFixed(2)}
                        </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-text-secondary">Tax</Text>
                        <Text className="text-text-primary font-medium">
                            {getCurrencySymbol()}{cart.taxTotal().toFixed(2)}
                        </Text>
                    </View>
                    {cart.discountAmount() > 0 && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-green-600">Discount</Text>
                            <Text className="text-green-600 font-medium">
                                -{getCurrencySymbol()}{cart.discountAmount().toFixed(2)}
                            </Text>
                        </View>
                    )}
                    <View className="h-[1px] bg-gray-200 my-3" />
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-bold text-text-primary">Total</Text>
                        <Text className="text-2xl font-bold text-primary-600">
                            {getCurrencySymbol()}{cart.total().toFixed(2)}
                        </Text>
                    </View>
                </View>
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
                            {cart.paymentMethod ? `Pay ${getCurrencySymbol()}${cart.total().toFixed(2)}` : 'Select Payment Method'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </Screen>
    );
}
