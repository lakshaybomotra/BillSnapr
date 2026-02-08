import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Product, useCategories, useProducts } from '@/hooks/use-products';
import { useAuthStore, useCartStore } from '@/store';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function POSScreen() {
  const tenant = useAuthStore((s) => s.tenant);
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      taxRate: product.tax_rate,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color="#00936E" />
      </Screen>
    );
  }

  return (
    <Screen safeArea scrollable={false} className="bg-surface-subtle p-0" contentClassName="px-0 py-0">
      {/* Premium Header */}
      <View className="px-6 pt-2 pb-6 bg-white border-b border-gray-100 shadow-sm z-10 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-sm text-text-muted font-medium tracking-wide uppercase">{getGreeting()},</Text>
            <Text className="text-2xl font-bold text-text-primary mt-0.5">{tenant?.name || 'BillSnapr'}</Text>
          </View>
          <TouchableOpacity className="w-11 h-11 bg-primary-50 rounded-full items-center justify-center border border-primary-100 shadow-sm">
            <IconSymbol name="person.fill" size={20} color="#00936E" />
          </TouchableOpacity>
        </View>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search menu..."
          leftIcon={<IconSymbol name="magnifyingglass" size={20} color="#94A3B8" />}
          className="bg-gray-50 border-gray-100 h-12 shadow-sm"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <View className="py-4">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, name: 'All' }, ...categories]}
            keyExtractor={(item) => item.id || 'all'}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                className={`px-5 py-2.5 mr-3 rounded-full border shadow-sm ${selectedCategory === item.id
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-100'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold ${selectedCategory === item.id ? 'text-white' : 'text-text-secondary'
                    }`}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 }}
        columnWrapperStyle={{ gap: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 px-8">
            <View className="w-24 h-24 bg-surface-subtle rounded-full items-center justify-center mb-6 border border-gray-100">
              <Text className="text-5xl">📦</Text>
            </View>
            <Text className="text-xl font-bold text-text-primary mb-2 text-center">No products found</Text>
            <Text className="text-text-secondary text-center mb-8 leading-6">
              {search ? 'Try searching for something else.' : 'Get started by adding your first product to the menu.'}
            </Text>
            <Button
              label="Add New Product"
              onPress={() => router.push('/(tabs)/products')}
              icon={<IconSymbol name="plus" size={20} color="white" />}
              variant="outline"
            />
          </View>
        }
        renderItem={({ item }) => {
          const cartItem = cart.items.find((i) => i.productId === item.id);

          return (
            <TouchableOpacity
              onPress={() => handleAddToCart(item)}
              activeOpacity={0.7}
              className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              style={{ maxWidth: '48%' }}
            >
              <View className="bg-primary-50/50 h-32 items-center justify-center relative">
                <Text className="text-5xl shadow-sm">🍽️</Text>
                {/* Add Button Overlay */}
                <View className="absolute bottom-2 right-2 bg-white w-8 h-8 rounded-full items-center justify-center shadow border border-gray-100">
                  <IconSymbol name="plus" size={16} color="#00936E" />
                </View>

                {cartItem && (
                  <View className="absolute top-2 right-2 bg-primary-600 min-w-[28px] h-7 px-1.5 rounded-full items-center justify-center shadow-md border-[2px] border-white">
                    <Text className="text-white text-xs font-bold">{cartItem.quantity}</Text>
                  </View>
                )}
              </View>

              <View className="p-3.5">
                <Text className="text-text-primary font-semibold text-sm mb-1.5 leading-tight" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="text-primary-700 font-bold text-base">
                  {getCurrencySymbol()}{item.price.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <View className="absolute bottom-6 left-5 right-5 z-50">
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
                {getCurrencySymbol()}{cart.total().toFixed(2)}
              </Text>
              <IconSymbol name="chevron.right" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}
