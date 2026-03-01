import { IconSymbol } from '@/components/ui/icon-symbol';
import { hapticLight } from '@/lib/haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface QuantityInputModalProps {
    visible: boolean;
    productName: string;
    price: number;
    currencySymbol: string;
    stockLimit?: number | null;
    currentInCart?: number;
    variantName?: string;
    onSubmit: (quantity: number) => void;
    onClose: () => void;
}

const QUICK_PICKS = [5, 10, 15, 20];

export function QuantityInputModal({
    visible,
    productName,
    price,
    currencySymbol,
    stockLimit,
    currentInCart = 0,
    variantName,
    onSubmit,
    onClose,
}: QuantityInputModalProps) {
    const [quantity, setQuantity] = useState('');
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setQuantity('');
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [visible]);

    const parsedQty = parseInt(quantity, 10) || 0;
    const maxAllowed = stockLimit != null ? Math.max(0, stockLimit - currentInCart) : Infinity;
    const isOverLimit = parsedQty > maxAllowed;
    const displayName = variantName ? `${productName} (${variantName})` : productName;

    const handleSubmit = () => {
        if (parsedQty <= 0) return;

        if (isOverLimit) {
            Alert.alert('Stock Limit', `Only ${maxAllowed} more can be added (${stockLimit} in stock, ${currentInCart} in cart).`);
            return;
        }

        hapticLight();
        onSubmit(parsedQty);
        onClose();
    };

    const handleQuickPick = (qty: number) => {
        hapticLight();
        if (stockLimit != null && qty > maxAllowed) {
            setQuantity(String(maxAllowed));
        } else {
            setQuantity(String(qty));
        }
    };

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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={0}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => { }}
                        className="bg-white rounded-t-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
                            <View className="flex-1 mr-3">
                                <Text className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">
                                    Add Quantity
                                </Text>
                                <Text className="text-text-primary text-lg font-bold" numberOfLines={1}>
                                    {displayName}
                                </Text>
                                <Text className="text-primary-600 font-semibold text-sm">
                                    {currencySymbol}{price.toFixed(2)} each
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                                <IconSymbol name="xmark" size={14} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Quantity Input */}
                        <View className="px-5 pb-3">
                            <TextInput
                                ref={inputRef}
                                value={quantity}
                                onChangeText={(text) => setQuantity(text.replace(/[^0-9]/g, ''))}
                                placeholder="Enter quantity"
                                keyboardType="number-pad"
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-xl text-center font-bold"
                                placeholderTextColor="#94A3B8"
                                onSubmitEditing={handleSubmit}
                                returnKeyType="done"
                            />
                            {stockLimit != null && (
                                <Text className="text-text-muted text-xs text-center mt-1.5">
                                    {maxAllowed > 0 ? `Max ${maxAllowed} available` : 'Out of stock'}
                                </Text>
                            )}
                        </View>

                        {/* Quick Pick Buttons */}
                        <View className="flex-row gap-2.5 px-5 pb-4">
                            {QUICK_PICKS.map((qty) => {
                                const disabled = stockLimit != null && qty > maxAllowed;
                                return (
                                    <TouchableOpacity
                                        key={qty}
                                        onPress={() => handleQuickPick(qty)}
                                        disabled={disabled}
                                        className={`flex-1 py-3 rounded-xl border items-center ${quantity === String(qty)
                                            ? 'border-primary-500 bg-primary-50'
                                            : disabled
                                                ? 'border-gray-100 bg-gray-50 opacity-40'
                                                : 'border-gray-200 bg-white'
                                            }`}
                                    >
                                        <Text className={`font-bold text-base ${quantity === String(qty) ? 'text-primary-600' : 'text-text-primary'}`}>
                                            {qty}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Total Preview + Add Button */}
                        <View className="px-5 pb-8">
                            {parsedQty > 0 && !isOverLimit && (
                                <Text className="text-text-muted text-sm text-center mb-3">
                                    Total: <Text className="text-primary-600 font-bold">{currencySymbol}{(price * parsedQty).toFixed(2)}</Text>
                                </Text>
                            )}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={parsedQty <= 0 || isOverLimit}
                                className={`rounded-xl py-4 items-center ${parsedQty <= 0 || isOverLimit ? 'bg-gray-200' : 'bg-primary-500'}`}
                            >
                                <Text className={`font-bold text-base ${parsedQty <= 0 || isOverLimit ? 'text-gray-400' : 'text-white'}`}>
                                    {parsedQty > 0 ? `Add ${parsedQty}` : 'Enter Quantity'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </TouchableOpacity>
        </Modal>
    );
}
