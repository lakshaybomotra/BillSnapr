import { UpgradePrompt } from '@/components/gate';
import { useUpdateTenant } from '@/hooks/use-auth';
import { useGate } from '@/hooks/use-subscription';
import { useAuthStore } from '@/store';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReceiptSettingsScreen() {
    const tenant = useAuthStore((s) => s.tenant);
    const setTenant = useAuthStore((s) => s.setTenant);
    const [header, setHeader] = useState(tenant?.receipt_header || '');
    const [footer, setFooter] = useState(tenant?.receipt_footer || '');
    const updateTenant = useUpdateTenant();

    const hasChanges =
        header !== (tenant?.receipt_header || '') ||
        footer !== (tenant?.receipt_footer || '');

    const receiptGate = useGate('receipt_customization');

    const handleSave = () => {
        updateTenant.mutate(
            { receipt_header: header || null, receipt_footer: footer || null },
            {
                onSuccess: (data) => {
                    if (data) setTenant(data);
                    Alert.alert('Saved', 'Receipt template updated successfully.');
                },
                onError: (error) => {
                    Alert.alert('Error', error.message || 'Failed to save changes.');
                },
            }
        );
    };

    return (
        <View className="flex-1 bg-surface">
            <Stack.Screen options={{ title: 'Receipt Template' }} />

            <ScrollView className="flex-1 p-5" contentContainerStyle={{ gap: 24 }}>
                {!receiptGate.allowed && (
                    <UpgradePrompt
                        feature="Receipt Customization"
                        message="Customize receipt headers & footers with Pro."
                        onUpgrade={receiptGate.showPaywall}
                    />
                )}
                {/* Live Preview */}
                <View className="p-5 items-center border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl">
                    <Text className="text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">
                        Receipt Preview
                    </Text>
                    <View className="bg-white p-4 shadow-sm w-full max-w-receipt rounded-lg">
                        <View className="items-center border-b border-dashed border-gray-200 pb-4 mb-4">
                            <Text className="font-bold text-lg">{tenant?.name || 'Restaurant'}</Text>
                            <Text className="text-xs text-gray-500 text-center mt-1">
                                {header || 'Address / Phone / GST'}
                            </Text>
                        </View>
                        <View className="gap-2 mb-4">
                            <View className="flex-row justify-between">
                                <Text className="text-xs">Item 1</Text>
                                <Text className="text-xs">100.00</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-xs">Item 2</Text>
                                <Text className="text-xs">250.00</Text>
                            </View>
                        </View>
                        <View className="items-center border-t border-dashed border-gray-200 pt-4">
                            <Text className="text-xs text-center font-medium italic">
                                {footer || 'Thank you!'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Form */}
                <View style={!receiptGate.allowed ? { opacity: 0.5 } : undefined}>
                    <Text className="text-text-secondary text-sm font-medium mb-2">Header Text</Text>
                    <TextInput
                        value={header}
                        onChangeText={setHeader}
                        placeholder="e.g., GST: 12345 | Ph: 9876543210"
                        multiline
                        numberOfLines={3}
                        editable={receiptGate.allowed}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base min-h-textarea"
                    />
                    <Text className="text-text-muted text-xs mt-1 ml-1">
                        Appears below the restaurant name on printed receipts
                    </Text>
                </View>

                <View style={!receiptGate.allowed ? { opacity: 0.5 } : undefined}>
                    <Text className="text-text-secondary text-sm font-medium mb-2">Footer Message</Text>
                    <TextInput
                        value={footer}
                        onChangeText={setFooter}
                        placeholder="e.g., Thank you! Visit again!"
                        multiline
                        numberOfLines={3}
                        editable={receiptGate.allowed}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base min-h-textarea"
                    />
                    <Text className="text-text-muted text-xs mt-1 ml-1">
                        Appears at the bottom of printed receipts
                    </Text>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View className="p-5 bg-white border-t border-gray-100">
                <TouchableOpacity
                    onPress={() => {
                        if (!receiptGate.allowed) {
                            receiptGate.showPaywall();
                            return;
                        }
                        handleSave();
                    }}
                    disabled={updateTenant.isPending || (!hasChanges && receiptGate.allowed)}
                    className={`rounded-xl py-4 ${!receiptGate.allowed
                        ? 'bg-amber-500'
                        : updateTenant.isPending || !hasChanges
                            ? 'bg-gray-300'
                            : 'bg-primary-500'
                        }`}
                >
                    {updateTenant.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            {!receiptGate.allowed ? '👑 Upgrade to Customize' : 'Save Changes'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
