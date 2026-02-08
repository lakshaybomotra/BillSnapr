import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { useUpdateTenant } from '@/hooks/use-auth';
import { useAuthStore } from '@/store';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

export default function ReceiptSetup() {
    const tenant = useAuthStore((s) => s.tenant);
    const [header, setHeader] = useState(tenant?.receipt_header || '');
    const [footer, setFooter] = useState(tenant?.receipt_footer || 'Thank you for dining with us!');
    const updateTenant = useUpdateTenant();

    const handleNext = () => {
        updateTenant.mutate(
            { receipt_header: header || null, receipt_footer: footer || null },
            {
                onSuccess: () => {
                    router.push('/(onboarding)/first-product');
                },
            }
        );
    };

    return (
        <Screen className="justify-between">
            <View>
                {/* Progress */}
                <View className="flex-row gap-2 mb-8 mt-2">
                    <View className="h-1.5 flex-1 bg-primary-500 rounded-full" />
                    <View className="h-1.5 flex-1 bg-primary-500 rounded-full" />
                    <View className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                </View>

                {/* Header */}
                <Text className="text-2xl font-bold text-text-primary mb-2">
                    Receipt Branding
                </Text>
                <Text className="text-text-secondary mb-8 leading-5">
                    Customize how your receipts look. You can change this later.
                </Text>

                {/* Preview Card */}
                <Card variant="flat" className="mb-6 p-6 items-center border-dashed border-2 border-gray-200 bg-gray-50">
                    <Text className="text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Receipt Preview</Text>
                    <View className="bg-white p-4 shadow-sm w-full max-w-[280px]">
                        <View className="items-center border-b border-dashed border-gray-200 pb-4 mb-4">
                            <Text className="font-bold text-lg">{tenant?.name || 'Restaurant'}</Text>
                            <Text className="text-xs text-gray-500 text-center mt-1">{header || 'Address / Phone / GST'}</Text>
                        </View>
                        <View className="space-y-2 mb-4">
                            <View className="flex-row justify-between"><Text className="text-xs">Item 1</Text><Text className="text-xs">100.00</Text></View>
                            <View className="flex-row justify-between"><Text className="text-xs">Item 2</Text><Text className="text-xs">250.00</Text></View>
                        </View>
                        <View className="items-center border-t border-dashed border-gray-200 pt-4">
                            <Text className="text-xs text-center font-medium italic">{footer}</Text>
                        </View>
                    </View>
                </Card>

                {/* Form */}
                <View className="gap-4">
                    <Input
                        label="Header Text"
                        value={header}
                        onChangeText={setHeader}
                        placeholder="e.g., GST: 12345 | Ph: 9876543210"
                        multiline
                        numberOfLines={2}
                    />
                    <Input
                        label="Footer Message"
                        value={footer}
                        onChangeText={setFooter}
                        placeholder="e.g., Thank you! Visit again!"
                        multiline
                        numberOfLines={2}
                    />
                </View>
            </View>

            {/* Footer */}
            <View className="gap-3 mt-8 pb-4">
                <Button
                    label="Continue"
                    onPress={handleNext}
                    loading={updateTenant.isPending}
                    icon={<IconSymbol name="chevron.right" size={18} color="white" />}
                />
                <Button
                    variant="ghost"
                    label="Skip for now"
                    onPress={() => router.push('/(onboarding)/first-product')}
                />
            </View>
        </Screen>
    );
}
