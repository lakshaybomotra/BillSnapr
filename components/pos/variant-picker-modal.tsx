import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProductVariant } from '@/hooks/use-products';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface VariantPickerModalProps {
    visible: boolean;
    productName: string;
    variants: ProductVariant[];
    currencySymbol: string;
    onSelect: (variant: ProductVariant) => void;
    onClose: () => void;
}

export function VariantPickerModal({
    visible,
    productName,
    variants,
    currencySymbol,
    onSelect,
    onClose,
}: VariantPickerModalProps) {
    const sortedVariants = [...variants].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 bg-black/40 justify-end"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => { }}
                    className="bg-white rounded-t-3xl overflow-hidden"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
                        <View className="flex-1 mr-3">
                            <Text className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">
                                Select Variant
                            </Text>
                            <Text className="text-text-primary text-lg font-bold" numberOfLines={1}>
                                {productName}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                        >
                            <IconSymbol name="xmark" size={14} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Variant Options */}
                    <View className="px-5 pb-8 gap-2.5">
                        {sortedVariants.map((variant) => (
                            <TouchableOpacity
                                key={variant.id}
                                onPress={() => {
                                    onSelect(variant);
                                    onClose();
                                }}
                                activeOpacity={0.7}
                                className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.03,
                                    shadowRadius: 4,
                                    elevation: 1,
                                }}
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center mr-3">
                                        <IconSymbol name="fork.knife" size={14} color="#00936E" />
                                    </View>
                                    <Text className="text-text-primary font-semibold text-base">
                                        {variant.name}
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-primary-600 font-bold text-base mr-2">
                                        {currencySymbol}{variant.price.toFixed(2)}
                                    </Text>
                                    <View className="w-7 h-7 bg-primary-500 rounded-full items-center justify-center">
                                        <IconSymbol name="plus" size={12} color="white" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
