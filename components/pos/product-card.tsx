import { IconSymbol } from '@/components/ui/icon-symbol';
import { Product } from '@/hooks/use-products';
import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
    item: Product;
    quantityInCart?: number;
    onAddToCart: (product: Product) => void;
    currencySymbol: string;
}

export function ProductCard({ item, quantityInCart, onAddToCart, currencySymbol }: ProductCardProps) {
    const isTracked = item.stock_quantity != null;
    const isOutOfStock = isTracked && item.stock_quantity === 0;
    const isLowStock = isTracked && item.stock_quantity! > 0 && item.stock_quantity! <= 5;

    return (
        <TouchableOpacity
            onPress={() => !isOutOfStock && onAddToCart(item)}
            activeOpacity={isOutOfStock ? 1 : 0.7}
            className="flex-1 bg-white rounded-2xl overflow-hidden border border-gray-100"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
                opacity: isOutOfStock ? 0.6 : 1,
            }}
        >
            {/* Image Area */}
            <View className="aspect-square bg-gray-50 items-center justify-center relative overflow-hidden">
                {item.image_url ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="disk"
                        recyclingKey={item.image_url}
                    />
                ) : (
                    <View className="items-center justify-center">
                        <IconSymbol name="fork.knife" size={32} color="#CBD5E1" />
                    </View>
                )}

                {/* Quantity Badge */}
                {quantityInCart && quantityInCart > 0 && (
                    <View className="absolute top-2 left-2 bg-primary-600 min-w-badge h-5.5 px-1.5 rounded-full items-center justify-center border-2 border-white z-10">
                        <Text className="text-white text-xs-plus font-bold">{quantityInCart}</Text>
                    </View>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <View className="bg-red-500 px-3 py-1 rounded-full">
                            <Text className="text-white text-xxs font-bold uppercase tracking-wider">Out of Stock</Text>
                        </View>
                    </View>
                )}

                {/* Low Stock Badge */}
                {isLowStock && !isOutOfStock && (
                    <View className="absolute top-2 right-2 bg-amber-500 px-2 py-0.5 rounded-full z-10">
                        <Text className="text-white text-2xs font-bold">{item.stock_quantity} left</Text>
                    </View>
                )}

                {/* Add/Plus Button */}
                {!isOutOfStock && (
                    <View className="absolute bottom-2 right-2 bg-white w-8 h-8 rounded-full items-center justify-center z-10"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <IconSymbol name="plus" size={16} color="#00936E" />
                    </View>
                )}
            </View>

            {/* Info Area */}
            <View className="px-3 py-2.5">
                <Text className="text-text-primary font-semibold text-sm-minus leading-tight" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="text-primary-600 font-bold text-sm mt-0.5">
                    {item.variants && item.variants.length > 0
                        ? `${currencySymbol}${Math.min(...item.variants.map(v => v.price)).toFixed(2)}+`
                        : `${currencySymbol}${item.price.toFixed(2)}`
                    }
                </Text>
                {item.variants && item.variants.length > 0 && (
                    <Text className="text-text-muted text-2xs mt-0.5">
                        {item.variants.length} {item.variants.length === 1 ? 'variant' : 'variants'}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

