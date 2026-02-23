import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { useUpdateProfile } from '@/hooks/use-auth';
import { useCreateProduct } from '@/hooks/use-products';
import { useAuthStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function FirstProductSetup() {
    const tenant = useAuthStore((s) => s.tenant);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    // Hooks
    const createProduct = useCreateProduct();
    const updateProfile = useUpdateProfile();
    const queryClient = useQueryClient();

    const handleFinish = async () => {
        try {
            if (name && price) {
                await createProduct.mutateAsync({
                    name,
                    price: parseFloat(price),
                    tax_rate: 0,
                    category_id: null // Default to no category for first product
                });
            }

            // Mark as onboarded
            await updateProfile.mutateAsync({ is_onboarded: true });

            // Force refresh of profile to update global state
            queryClient.invalidateQueries({ queryKey: ['profile'] });

            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error finishing onboarding:', error);
            // Optional: Add Alert here if needed
        }
    };

    const isLoading = createProduct.isPending || updateProfile.isPending;

    const currencySymbol = tenant?.currency === 'USD' ? '$' :
        tenant?.currency === 'EUR' ? '€' :
            tenant?.currency === 'GBP' ? '£' : '₹';

    return (
        <Screen className="justify-between">
            <View>
                {/* Progress */}
                <View className="flex-row gap-2 mb-8 mt-2">
                    <View className="h-1.5 flex-1 bg-primary-500 rounded-full" />
                    <View className="h-1.5 flex-1 bg-primary-500 rounded-full" />
                    <View className="h-1.5 flex-1 bg-primary-500 rounded-full" />
                </View>

                {/* Header */}
                <Text className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-2">
                    Add your first product
                </Text>
                <Text className="text-text-secondary dark:text-slate-400 mb-8 leading-5">
                    Start selling immediately. You can add more later.
                </Text>

                {/* Form */}
                <View className="gap-6">
                    <Input
                        label="Product Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g., Tandoori Chicken"
                        leftIcon={<IconSymbol name="cube.box" size={20} color="#94A3B8" />}
                    />

                    <Input
                        label="Price"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        leftIcon={<Text className="text-lg font-bold text-gray-500">{currencySymbol}</Text>}
                    />

                    {/* Quick Suggestions */}
                    <View>
                        <Text className="text-xs font-semibold text-text-muted dark:text-slate-500 mb-3 uppercase tracking-wider">Quick Suggestions</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {['Chicken Biryani', 'Paneer Tikka', 'Masala Dosa', 'Coffee'].map((suggestion) => (
                                <TouchableOpacity
                                    key={suggestion}
                                    onPress={() => setName(suggestion)}
                                    className="bg-white border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow-sm dark:bg-slate-800"
                                >
                                    <Text className="text-text-secondary dark:text-slate-400 text-sm font-medium">{suggestion}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View className="gap-3 mt-8 pb-4">
                <Button
                    label={name && price ? 'Add Product & Finish' : 'Skip & Finish'}
                    onPress={handleFinish}
                    loading={isLoading}
                    variant={name && price ? 'primary' : 'secondary'}
                />
            </View>
        </Screen>
    );
}
