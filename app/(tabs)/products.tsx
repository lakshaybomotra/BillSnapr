import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCategories, useProducts, useReorderCategories } from '@/hooks/use-products';
import { useRole } from '@/hooks/use-role';
import { getCurrencySymbol } from '@/lib/currency';
import { useAuthStore } from '@/store';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsScreen() {
    const router = useRouter();
    const { data: products, isLoading, refetch } = useProducts();
    const { data: categories } = useCategories();
    const tenant = useAuthStore((s) => s.tenant);
    const { canManageProducts } = useRole();
    const reorderCategories = useReorderCategories();
    const [reorderModalVisible, setReorderModalVisible] = useState(false);
    const [reorderedCategories, setReorderedCategories] = useState<typeof categories>([]);

    const openReorderModal = useCallback(() => {
        if (categories) {
            setReorderedCategories([...categories]);
            setReorderModalVisible(true);
        }
    }, [categories]);

    const moveCategory = useCallback((index: number, direction: 'up' | 'down') => {
        setReorderedCategories((prev) => {
            if (!prev) return prev;
            const newList = [...prev];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newList.length) return prev;
            [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
            return newList;
        });
    }, []);

    const saveReorder = useCallback(async () => {
        if (!reorderedCategories?.length) return;
        await reorderCategories.mutateAsync(reorderedCategories.map(c => c.id));
        setReorderModalVisible(false);
    }, [reorderedCategories, reorderCategories]);



    return (
        <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top']}>
            <View className="px-5 py-4 flex-row justify-between items-center bg-white border-b border-gray-100 dark:border-slate-700 dark:border-slate-700">
                <Text className="text-2xl font-bold text-text-primary dark:text-slate-100 dark:text-slate-100">Products</Text>
            </View>

            {/* Category Management Row */}
            <View className="bg-white border-b border-gray-100 dark:bg-slate-800 dark:border-slate-700 py-3">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
                >
                    {categories?.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={canManageProducts ? () => router.push({
                                pathname: '/modal-category',
                                params: { id: cat.id, name: cat.name, image_url: cat.image_url || '' },
                            }) : undefined}
                            activeOpacity={canManageProducts ? 0.7 : 1}
                            className="flex-row items-center bg-surface-subtle dark:bg-slate-700 px-3 py-2 rounded-full border border-gray-200 dark:border-slate-600 gap-2"
                        >
                            {cat.image_url ? (
                                <Image source={{ uri: cat.image_url }} style={{ width: 20, height: 20, borderRadius: 10 }} contentFit="cover" />
                            ) : (
                                <View className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
                                    <Text className="text-primary-700 dark:text-primary-300 text-xxs font-bold">{cat.name.charAt(0)}</Text>
                                </View>
                            )}
                            <Text className="text-text-primary dark:text-slate-100 font-medium text-sm">{cat.name}</Text>
                            {canManageProducts && <IconSymbol name="pencil" size={12} color="#94A3B8" />}
                        </TouchableOpacity>
                    ))}
                    {canManageProducts && (
                        <>
                            <TouchableOpacity
                                onPress={() => router.push('/modal-category')}
                                activeOpacity={0.7}
                                className="flex-row items-center bg-primary-50 dark:bg-primary-900/30 px-3 py-2 rounded-full border border-primary-200 dark:border-primary-700 gap-1.5"
                            >
                                <IconSymbol name="plus" size={14} color="#00936E" />
                                <Text className="text-primary-600 dark:text-primary-400 font-semibold text-sm">New</Text>
                            </TouchableOpacity>
                            {categories && categories.length > 1 && (
                                <TouchableOpacity
                                    onPress={openReorderModal}
                                    activeOpacity={0.7}
                                    className="flex-row items-center bg-blue-50 px-3 py-2 rounded-full border border-blue-200 gap-1.5"
                                >
                                    <IconSymbol name="arrow.up.arrow.down" size={14} color="#3b82f6" />
                                    <Text className="text-blue-600 font-semibold text-sm">Reorder</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </ScrollView>
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
                        <View className="w-16 h-16 bg-surface-subtle dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                            <Text className="text-3xl">🍽️</Text>
                        </View>
                        <Text className="text-text-primary dark:text-slate-100 text-lg font-semibold">No products yet</Text>
                        <Text className="text-text-muted dark:text-slate-500 text-sm mt-1 mb-6">Start building your menu.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={canManageProducts ? () => router.push({ pathname: '/modal-product', params: { id: item.id } }) : undefined}
                        activeOpacity={canManageProducts ? 0.7 : 1}
                        className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm dark:bg-slate-800"
                    >
                        <View className="w-14 h-14 bg-surface-subtle dark:bg-slate-800 rounded-xl items-center justify-center mr-4 border border-gray-50 dark:border-slate-700 overflow-hidden">
                            {item.image_url ? (
                                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <Text className="text-2xl">🍽️</Text>
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-text-primary dark:text-slate-100 font-semibold text-lg">{item.name}</Text>
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
                            <Text className="text-text-primary dark:text-slate-100 font-bold text-lg">
                                {getCurrencySymbol(tenant?.currency)}{item.price.toFixed(2)}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                {item.stock_quantity == null ? (
                                    <>
                                        <View className="w-2 h-2 rounded-full bg-gray-400 mr-1.5" />
                                        <Text className="text-text-muted dark:text-slate-500 text-xs font-medium">Untracked</Text>
                                    </>
                                ) : item.stock_quantity === 0 ? (
                                    <>
                                        <View className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                                        <Text className="text-red-600 dark:text-red-400 text-xs font-medium">Out of Stock</Text>
                                    </>
                                ) : item.stock_quantity <= 5 ? (
                                    <>
                                        <View className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                                        <Text className="text-amber-600 text-xs font-medium">Low: {item.stock_quantity}</Text>
                                    </>
                                ) : (
                                    <>
                                        <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                        <Text className="text-text-muted dark:text-slate-500 text-xs font-medium">Stock: {item.stock_quantity}</Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Floating Action Button — only for managers and admins */}
            {
                canManageProducts && (
                    <View className="absolute bottom-6 right-5">
                        <TouchableOpacity
                            onPress={() => router.push('/modal-product')}
                            className="w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-xl border border-white/20"
                            activeOpacity={0.9}
                        >
                            <IconSymbol name="plus" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* Reorder Categories Modal */}
            <Modal
                visible={reorderModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setReorderModalVisible(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setReorderModalVisible(false)}
                    className="flex-1 bg-black/40 justify-end"
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => { }} className="bg-white rounded-t-3xl max-h-[70%]">
                        {/* Header */}
                        <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                            <View>
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Categories</Text>
                                <Text className="text-text-primary text-lg font-bold">Reorder Categories</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setReorderModalVisible(false)}
                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                                <IconSymbol name="xmark" size={14} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Category List */}
                        <ScrollView className="px-5 py-3" contentContainerStyle={{ gap: 8 }}>
                            {reorderedCategories?.map((cat, index) => (
                                <View key={cat.id} className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                    <Text className="text-text-muted text-sm font-bold w-7">{index + 1}</Text>
                                    {cat.image_url ? (
                                        <View className="w-8 h-8 rounded-lg overflow-hidden mr-3">
                                            <Image source={{ uri: cat.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                        </View>
                                    ) : (
                                        <View className="w-8 h-8 rounded-lg bg-primary-100 items-center justify-center mr-3">
                                            <Text className="text-primary-700 text-sm font-bold">{cat.name.charAt(0)}</Text>
                                        </View>
                                    )}
                                    <Text className="flex-1 text-text-primary font-semibold text-base">{cat.name}</Text>
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity
                                            onPress={() => moveCategory(index, 'up')}
                                            disabled={index === 0}
                                            className={`w-9 h-9 rounded-lg items-center justify-center ${index === 0 ? 'bg-gray-100' : 'bg-blue-50 border border-blue-200'}`}
                                        >
                                            <Text className={`text-lg ${index === 0 ? 'text-gray-300' : 'text-blue-600'}`}>↑</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => moveCategory(index, 'down')}
                                            disabled={index === (reorderedCategories?.length ?? 0) - 1}
                                            className={`w-9 h-9 rounded-lg items-center justify-center ${index === (reorderedCategories?.length ?? 0) - 1 ? 'bg-gray-100' : 'bg-blue-50 border border-blue-200'}`}
                                        >
                                            <Text className={`text-lg ${index === (reorderedCategories?.length ?? 0) - 1 ? 'text-gray-300' : 'text-blue-600'}`}>↓</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Save Button */}
                        <View className="px-5 pb-8 pt-3">
                            <TouchableOpacity
                                onPress={saveReorder}
                                disabled={reorderCategories.isPending}
                                className={`py-4 rounded-xl items-center ${reorderCategories.isPending ? 'bg-primary-300' : 'bg-primary-500'}`}
                            >
                                <Text className="text-white font-bold text-base">
                                    {reorderCategories.isPending ? 'Saving...' : 'Save Order'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView >
    );
}
