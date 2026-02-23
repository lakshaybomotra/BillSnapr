import { CategoryTabs } from '@/components/pos/category-tabs';
import { ProductCard } from '@/components/pos/product-card';
import { Sidebar } from '@/components/pos/sidebar';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { Category, Product, useCategories, useProducts } from '@/hooks/use-products';
import { getCurrencySymbol } from '@/lib/currency';
import { hapticLight } from '@/lib/haptics';
import { useAuthStore, useCartStore } from '@/store';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function POSScreen() {
    const tenant = useAuthStore((s) => s.tenant);
    const { data: products, isLoading, refetch: refetchProducts } = useProducts();
    const { data: categories, refetch: refetchCategories } = useCategories();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 340;

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchProducts(), refetchCategories()]);
        setRefreshing(false);
    };

    const cart = useCartStore();
    const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!products) return [];

        let result = products;

        if (selectedCategory) {
            result = result.filter((p) => p.category_id === selectedCategory);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(searchLower));
        }

        return result;
    }, [products, selectedCategory, search]);

    // Layout Constants
    const SIDEBAR_WIDTH = 80; // w-20 = 5rem = 80px
    const GRID_PADDING = 32; // px-4 (16) * 2
    const GAP = 16;
    const MIN_CARD_WIDTH = 150; // Minimum width for a readable card

    // Dynamic Column Calculation
    const availableWidth = isLargeScreen ? width - SIDEBAR_WIDTH - GRID_PADDING : width - GRID_PADDING;
    const numColumns = Math.max(2, Math.floor((availableWidth + GAP) / (MIN_CARD_WIDTH + GAP)));

    // Force re-render key when columns change
    const gridKey = `grid-${numColumns}-${isLargeScreen ? 'sidebar' : 'full'}`;

    const handleAddToCart = (product: Product) => {
        // Check stock limit
        if (product.stock_quantity != null) {
            const currentInCart = cart.items.find(i => i.productId === product.id)?.quantity || 0;
            if (currentInCart >= product.stock_quantity) {
                Alert.alert('Stock Limit', `Only ${product.stock_quantity} available in stock.`);
                return;
            }
        }

        hapticLight();
        cart.addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            taxRate: product.tax_rate,
        });
    };

    const handleEditCategory = (category: Category) => {
        router.push({
            pathname: '/modal-category',
            params: { id: category.id, name: category.name, image_url: category.image_url || '' },
        });
    };


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (isLoading) {
        return (
            <Screen className="items-center justify-center">
                <ProductGridSkeleton columns={numColumns} />
            </Screen>
        );
    }

    // Header Component to reuse or keep inline
    const renderHeader = () => (
        <View className="px-4 pt-3 pb-8 bg-white border-b border-gray-100 z-10">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="text-xs-plus text-text-muted font-medium tracking-widest uppercase">{getGreeting()}</Text>
                    <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>{tenant?.name || 'BillSnapr'}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} className="w-9 h-9 bg-primary-50 rounded-full items-center justify-center border border-primary-100 ml-3">
                    <IconSymbol name="person.fill" size={16} color="#00936E" />
                </TouchableOpacity>
            </View>

            <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search menu..."
                leftIcon={<IconSymbol name="magnifyingglass" size={18} color="#94A3B8" />}
                rightIcon={
                    search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <IconSymbol name="xmark.circle.fill" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    ) : undefined
                }
                className="bg-gray-50 border-gray-100 h-10"
                placeholderTextColor="#94A3B8"
            />
        </View>
    );

    return (
        <Screen safeArea scrollable={false} className="bg-white p-0" contentClassName="px-0 py-0">
            {/* Premium Header - Always at top, full width */}
            {renderHeader()}

            <View className="flex-1 flex-row">
                {/* Sidebar (Desktop Only) */}
                {isLargeScreen && (
                    <Sidebar
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        onEditCategory={handleEditCategory}
                    />
                )}

                <View className="flex-1">
                    {/* Mobile Horizontal Tabs (Mobile Only) */}
                    {!isLargeScreen && (
                        <View className="bg-surface-subtle z-10">
                            <CategoryTabs
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                                onEditCategory={handleEditCategory}
                            />
                        </View>
                    )}

                    {/* Product Grid */}
                    <FlatList
                        data={filteredProducts}
                        numColumns={numColumns}
                        key={gridKey}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: 120,
                            paddingTop: 16
                        }}
                        columnWrapperStyle={{ gap: 16 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00936E']} tintColor="#00936E" />
                        }
                        ItemSeparatorComponent={() => <View className="h-4" />}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-16 px-8">
                                <View className="w-20 h-20 bg-gray-50 rounded-2xl items-center justify-center mb-5 border border-gray-100">
                                    <IconSymbol name="shippingbox" size={36} color="#CBD5E1" />
                                </View>
                                <Text className="text-lg font-bold text-text-primary mb-1 text-center">No items found</Text>
                                <Text className="text-text-muted text-sm text-center mb-6 leading-5 max-w-56">
                                    {search ? 'No items match your search.' : 'Add your first product to start selling.'}
                                </Text>
                                <Button
                                    label="Add Products"
                                    onPress={() => router.push('/(tabs)/products')}
                                    icon={<IconSymbol name="plus" size={18} color="white" />}
                                    variant="primary"
                                />
                            </View>
                        }
                        renderItem={({ item }) => {
                            const cartItem = cart.items.find((i) => i.productId === item.id);
                            return (
                                <ProductCard
                                    item={item}
                                    quantityInCart={cartItem?.quantity}
                                    onAddToCart={handleAddToCart}
                                    currencySymbol={getCurrencySymbol(tenant?.currency)}
                                />
                            );
                        }}
                    />
                </View>
            </View>

            {/* Floating Cart Button */}
            {cartItemCount > 0 && (
                <View className={`absolute bottom-6 left-5 right-5 z-50 ${isLargeScreen ? 'left-24' : ''}`}>
                    <TouchableOpacity
                        onPress={() => router.push('/checkout')}
                        activeOpacity={0.9}
                        className="bg-text-primary rounded-2xl p-4 flex-row items-center justify-between shadow-2xl border border-gray-800"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-white/20 w-10 h-10 rounded-xl items-center justify-center mr-3 backdrop-blur-sm">
                                <Text className="text-white font-bold text-lg">{cartItemCount}</Text>
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base tracking-wide">View Cart</Text>
                                <Text className="text-gray-300 text-xs font-medium">{cartItemCount} items selected</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-lg">
                            <Text className="text-white font-bold text-lg mr-1">
                                {getCurrencySymbol(tenant?.currency)}{cart.total().toFixed(2)}
                            </Text>
                            <IconSymbol name="chevron.right" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </Screen>
    );
}
