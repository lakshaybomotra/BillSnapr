import { Category } from '@/hooks/use-products';
import { hapticMedium } from '@/lib/haptics';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface SidebarProps {
    categories: Category[] | undefined;
    selectedCategory: string | null;
    onSelectCategory: (id: string | null) => void;
    onEditCategory?: (category: Category) => void;
}

const CATEGORY_COLORS = [
    '#00936E', '#FF8C00', '#3B82F6', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
];

function getCategoryColor(index: number) {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export function Sidebar({ categories, selectedCategory, onSelectCategory, onEditCategory }: SidebarProps) {
    if (!categories || categories.length === 0) return null;

    const data: { id: string | null; name: string; image_url?: string | null }[] = [
        { id: null, name: 'All', image_url: null },
        ...categories
    ];

    return (
        <View className="w-20 bg-surface-muted border-r border-gray-100 pt-4 items-center">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: 'center', paddingBottom: 20 }}
            >
                {data.map((item, index) => {
                    const isSelected = selectedCategory === item.id;
                    const color = item.id ? getCategoryColor(index - 1) : '#00936E';
                    const letter = item.name.charAt(0).toUpperCase();

                    return (
                        <TouchableOpacity
                            key={item.id || 'all'}
                            onPress={() => onSelectCategory(item.id)}
                            onLongPress={() => {
                                if (item.id && onEditCategory) {
                                    const cat = categories?.find(c => c.id === item.id);
                                    if (cat) {
                                        hapticMedium();
                                        onEditCategory(cat);
                                    }
                                }
                            }}
                            delayLongPress={400}
                            activeOpacity={0.7}
                            className={`w-sidebar items-center py-2.5 rounded-xl ${isSelected ? 'bg-primary-50' : ''}`}
                        >
                            {/* Left indicator bar for active */}
                            {isSelected && (
                                <View
                                    className="absolute left-0 top-2 bottom-2 w-indicator rounded-r-full"
                                    style={{ backgroundColor: color }}
                                />
                            )}

                            {/* Image or Letter Avatar */}
                            <View
                                className="w-11 h-11 rounded-xl items-center justify-center overflow-hidden"
                                style={{
                                    backgroundColor: isSelected ? color : `${color}15`,
                                }}
                            >
                                {item.image_url ? (
                                    <Image
                                        source={{ uri: item.image_url }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                ) : (
                                    <Text
                                        className="text-base font-bold"
                                        style={{ color: isSelected ? '#FFFFFF' : color }}
                                    >
                                        {letter}
                                    </Text>
                                )}
                            </View>

                            {/* Label */}
                            <Text
                                numberOfLines={1}
                                className={`text-xxs mt-1 max-w-sidebar-text text-center ${isSelected ? 'font-bold text-text-primary' : 'font-medium text-text-muted'
                                    }`}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}
