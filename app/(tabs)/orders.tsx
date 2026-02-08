import { IconSymbol } from '@/components/ui/icon-symbol';
import { Order, useOrders } from '@/hooks/use-orders';
import { useAuthStore } from '@/store';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
    const router = useRouter();
    const { data: orders, isLoading, refetch } = useOrders();
    const tenant = useAuthStore((s) => s.tenant);

    const getCurrencySymbol = () => {
        switch (tenant?.currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return '₹';
        }
    };

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'text-green-700 bg-green-50 border-green-200';
            case 'voided': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-amber-700 bg-amber-50 border-amber-200';
        }
    };

    const getStatusLabel = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'voided': return 'Voided';
            default: return 'Pending';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <View className="px-5 py-4 bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-text-primary">Order History</Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00936E" />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="w-16 h-16 bg-surface-subtle rounded-full items-center justify-center mb-4">
                            <Text className="text-3xl">🧾</Text>
                        </View>
                        <Text className="text-text-primary text-lg font-semibold">No orders yet</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
                        className="bg-white p-5 mb-4 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50"
                    >
                        <View className="flex-row justify-between items-start mb-3">
                            <View>
                                <View className="flex-row items-center mb-1">
                                    <Text className="font-bold text-text-primary text-lg mr-2">
                                        Order #{item.order_number}
                                    </Text>
                                    <View className={`px-2.5 py-0.5 rounded-full border ${getStatusColor(item.status).replace('text-', 'border-').split(' ')[2]}`}>
                                        <Text className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(item.status).split(' ')[0]}`}>
                                            {getStatusLabel(item.status)}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-text-muted text-xs font-medium uppercase tracking-wide">
                                    {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
                                </Text>
                            </View>
                            <Text className="text-xl font-bold text-text-primary">
                                {getCurrencySymbol()}{item.total.toFixed(2)}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
                            <View className="flex-row items-center gap-2">
                                <View className={`w-8 h-8 rounded-full items-center justify-center ${item.payment_method === 'cash' ? 'bg-green-100' :
                                        item.payment_method === 'card' ? 'bg-blue-100' : 'bg-purple-100'
                                    }`}>
                                    <IconSymbol
                                        name={item.payment_method === 'cash' ? 'banknote' : item.payment_method === 'card' ? 'creditcard' : 'qrcode'}
                                        size={14}
                                        color={
                                            item.payment_method === 'cash' ? '#15803d' :
                                                item.payment_method === 'card' ? '#1d4ed8' : '#7e22ce'
                                        }
                                    />
                                </View>
                                <Text className="text-text-secondary text-sm capitalize font-medium">
                                    {item.payment_method} Payment
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-text-muted text-xs font-medium mr-1">Details</Text>
                                <IconSymbol name="chevron.right" size={12} color="#94A3B8" />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}
