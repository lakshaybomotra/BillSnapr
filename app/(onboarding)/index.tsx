import { useAuthStore } from '@/store';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingWelcome() {
    const user = useAuthStore((s) => s.user);
    const tenant = useAuthStore((s) => s.tenant);

    return (
        <View className="flex-1 bg-surface justify-center px-6">
            {/* Welcome Illustration */}
            <View className="items-center mb-10">
                <View className="w-32 h-32 bg-primary-100 rounded-full items-center justify-center mb-6">
                    <Text className="text-6xl">🎉</Text>
                </View>
                <Text className="text-3xl font-bold text-text-primary text-center">
                    Welcome to BillSnapr!
                </Text>
                <Text className="text-text-secondary text-center mt-3 text-base leading-6">
                    Let's set up your restaurant in just a few steps.
                </Text>
            </View>

            {/* Checklist Preview */}
            <View className="bg-surface-subtle rounded-2xl p-5 mb-10">
                <Text className="text-text-secondary text-sm mb-4">What we&apos;ll set up:</Text>

                <View className="gap-3">
                    {[
                        { icon: '🏪', text: 'Restaurant details' },
                        { icon: '🧾', text: 'Receipt customization' },
                        { icon: '📦', text: 'Your first product' },
                    ].map((item, index) => (
                        <View key={index} className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                                <Text className="text-xl">{item.icon}</Text>
                            </View>
                            <Text className="text-text-primary text-base">{item.text}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                onPress={() => router.push('/(onboarding)/restaurant')}
                className="bg-primary-500 rounded-xl py-4"
            >
                <Text className="text-white text-center font-semibold text-base">
                    Let's Get Started
                </Text>
            </TouchableOpacity>

            <Text className="text-text-muted text-center mt-4 text-sm">
                Takes about 2 minutes
            </Text>
        </View>
    );
}
