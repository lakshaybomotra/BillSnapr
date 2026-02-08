import { useUpdateTenant } from '@/hooks/use-auth';
import { useAuthStore } from '@/store';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export default function RestaurantSetup() {
    const tenant = useAuthStore((s) => s.tenant);
    const [name, setName] = useState(tenant?.name || '');
    const [currency, setCurrency] = useState(tenant?.currency || 'INR');
    const updateTenant = useUpdateTenant();

    const handleNext = () => {
        updateTenant.mutate(
            { name, currency },
            {
                onSuccess: () => {
                    router.push('/(onboarding)/receipt');
                },
                onError: (error) => {
                    console.error('[RestaurantSetup] Mutation failed:', error);
                    // Alert user about the error
                    alert(`Failed to save: ${error.message}`);
                },
            }
        );
    };

    return (
        <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="flex-1 px-6 pt-16 pb-8">
                {/* Progress */}
                <View className="flex-row gap-2 mb-8">
                    <View className="h-1 flex-1 bg-primary-500 rounded-full" />
                    <View className="h-1 flex-1 bg-gray-200 rounded-full" />
                    <View className="h-1 flex-1 bg-gray-200 rounded-full" />
                </View>

                {/* Header */}
                <Text className="text-2xl font-bold text-text-primary mb-2">
                    Tell us about your restaurant
                </Text>
                <Text className="text-text-secondary mb-8">
                    This will appear on your receipts
                </Text>

                {/* Form */}
                <View className="gap-6 flex-1">
                    <View>
                        <Text className="text-text-secondary text-sm mb-2">Restaurant Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="My Awesome Restaurant"
                            className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View>
                        <Text className="text-text-secondary text-sm mb-3">Currency</Text>
                        <View className="gap-2">
                            {CURRENCIES.map((curr) => (
                                <TouchableOpacity
                                    key={curr.code}
                                    onPress={() => setCurrency(curr.code)}
                                    className={`flex-row items-center p-4 rounded-xl border ${currency === curr.code
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 bg-surface-subtle'
                                        }`}
                                >
                                    <View className="w-10 h-10 bg-white rounded-lg items-center justify-center mr-3 shadow-sm">
                                        <Text className="text-lg font-bold text-text-primary">{curr.symbol}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-text-primary font-medium">{curr.code}</Text>
                                        <Text className="text-text-muted text-sm">{curr.name}</Text>
                                    </View>
                                    {currency === curr.code && (
                                        <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                                            <Text className="text-white text-xs">✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Next Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    disabled={updateTenant.isPending || !name}
                    className={`rounded-xl py-4 mt-6 ${updateTenant.isPending || !name ? 'bg-gray-300' : 'bg-primary-500'
                        }`}
                >
                    {updateTenant.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            Continue
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
