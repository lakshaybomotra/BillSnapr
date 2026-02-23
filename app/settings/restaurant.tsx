import { useUpdateTenant } from '@/hooks/use-auth';
import { CURRENCIES } from '@/lib/currency';
import { useAuthStore } from '@/store';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RestaurantSettingsScreen() {
    const tenant = useAuthStore((s) => s.tenant);
    const setTenant = useAuthStore((s) => s.setTenant);
    const [name, setName] = useState(tenant?.name || '');
    const [currency, setCurrency] = useState(tenant?.currency || 'INR');
    const updateTenant = useUpdateTenant();

    const hasChanges = name !== (tenant?.name || '') || currency !== (tenant?.currency || 'INR');

    const handleSave = () => {
        if (!name.trim()) return;

        updateTenant.mutate(
            { name: name.trim(), currency },
            {
                onSuccess: (data) => {
                    if (data) setTenant(data);
                    Alert.alert('Saved', 'Restaurant details updated successfully.');
                },
                onError: (error) => {
                    Alert.alert('Error', error.message || 'Failed to save changes.');
                },
            }
        );
    };

    return (
        <View className="flex-1 bg-surface">
            <Stack.Screen options={{ title: 'Restaurant Details' }} />

            <ScrollView className="flex-1 p-5" contentContainerStyle={{ gap: 24 }}>
                {/* Restaurant Name */}
                <View>
                    <Text className="text-text-secondary text-sm font-medium mb-2">Restaurant Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="My Awesome Restaurant"
                        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                {/* Currency Selection */}
                <View>
                    <Text className="text-text-secondary text-sm font-medium mb-3">Currency</Text>
                    <View className="gap-2">
                        {CURRENCIES.map((curr) => (
                            <TouchableOpacity
                                key={curr.code}
                                onPress={() => setCurrency(curr.code)}
                                className={`flex-row items-center p-4 rounded-xl border ${currency === curr.code
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <View className="w-10 h-10 bg-surface rounded-lg items-center justify-center mr-3 border border-gray-100">
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
            </ScrollView>

            {/* Save Button */}
            <View className="p-5 bg-white border-t border-gray-100">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={updateTenant.isPending || !name.trim() || !hasChanges}
                    className={`rounded-xl py-4 ${updateTenant.isPending || !name.trim() || !hasChanges
                        ? 'bg-gray-300' : 'bg-primary-500'
                        }`}
                >
                    {updateTenant.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            Save Changes
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
