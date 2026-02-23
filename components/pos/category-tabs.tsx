import { Category } from '@/hooks/use-products';
import { hapticMedium } from '@/lib/haptics';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface CategoryListProps {
    categories: Category[] | undefined;
    selectedCategory: string | null;
    onSelectCategory: (id: string | null) => void;
    onEditCategory?: (category: Category) => void;
}

export function CategoryTabs({ categories, selectedCategory, onSelectCategory, onEditCategory }: CategoryListProps) {
    if (!categories || categories.length === 0) return null;

    const data: { id: string | null; name: string }[] = [{ id: null, name: 'All' }, ...categories];

    return (
        <View className="py-2 bg-surface-subtle">
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                keyExtractor={(item) => item.id || 'all'}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                renderItem={({ item }) => {
                    const isActive = selectedCategory === item.id;
                    const originalCategory = item.id ? categories?.find(c => c.id === item.id) : null;

                    return (
                        <TouchableOpacity
                            onPress={() => onSelectCategory(item.id)}
                            onLongPress={() => {
                                if (originalCategory && onEditCategory) {
                                    hapticMedium();
                                    onEditCategory(originalCategory);
                                }
                            }}
                            delayLongPress={400}
                            activeOpacity={0.7}
                            className={`px-4 py-2 rounded-full ${isActive
                                ? 'bg-primary-600'
                                : 'bg-white border border-gray-150'
                                }`}
                        >
                            <Text
                                className={`text-sm-minus font-semibold ${isActive ? 'text-white' : 'text-text-secondary'
                                    }`}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}
