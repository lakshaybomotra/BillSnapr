import { IconSymbol } from '@/components/ui/icon-symbol';
import { useProducts } from '@/hooks/use-products';
import { useAuthStore } from '@/store';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsScreen() {
    const router = useRouter();
    const { data: products, isLoading, refetch } = useProducts();
    const tenant = useAuthStore((s) => s.tenant);

    const getCurrencySymbol = () => {
        switch (tenant?.currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return '₹';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <View className="px-5 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-text-primary">Products</Text>
                <TouchableOpacity
                    onPress={() => router.push('/modal-category')}
                    className="bg-surface-subtle px-4 py-2 rounded-full border border-gray-200"
                >
                    <Text className="text-text-primary font-medium text-sm">New Category</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00936E" />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="w-16 h-16 bg-surface-subtle rounded-full items-center justify-center mb-4">
                            <Text className="text-3xl">🍽️</Text>
                        </View>
                        <Text className="text-text-primary text-lg font-semibold">No products yet</Text>
                        <Text className="text-text-muted text-sm mt-1 mb-6">Start building your menu.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/modal-product', params: { id: item.id } })}
                        className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50"
                    >
                        <View className="w-14 h-14 bg-surface-subtle rounded-xl items-center justify-center mr-4 border border-gray-50 overflow-hidden">
                            {item.image_url ? (
                                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <Text className="text-2xl">🍽️</Text>
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-text-primary font-semibold text-lg">{item.name}</Text>
                            {item.category && (
                                <View className="flex-row mt-1 items-center">
                                    <View className="bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-100 flex-row items-center gap-1">
                                        {item.category.image_url && (
                                            <Image source={{ uri: item.category.image_url }} style={{ width: 12, height: 12 }} contentFit="cover" />
                                        )}
                                        <Text className="text-primary-700 text-xs font-medium">
                                            {item.category.name}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                        <View className="items-end">
                            <Text className="text-text-primary font-bold text-lg">
                                {getCurrencySymbol()}{item.price.toFixed(2)}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                <Text className="text-text-muted text-xs font-medium">In Stock</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Floating Action Button */}
            <View className="absolute bottom-6 right-5">
                <TouchableOpacity
                    onPress={() => router.push('/modal-product')}
                    className="w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-xl border border-white/20"
                    activeOpacity={0.9}
                >
                    <IconSymbol name="plus" size={28} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
