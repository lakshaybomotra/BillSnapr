import { GateFeature, useGate } from '@/hooks/use-subscription';
import { useAuthStore } from '@/store';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface UpgradePromptProps {
    feature: string;
    message?: string;
    onUpgrade: () => void;
    buttonText?: string;
}

/**
 * Inline upgrade banner shown when a feature is gated.
 */
export function UpgradePrompt({ feature, message, onUpgrade, buttonText }: UpgradePromptProps) {
    return (
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mx-4 my-2">
            <View className="flex-row items-center gap-3 mb-2">
                <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                    <Text className="text-lg">👑</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-amber-900 font-bold text-sm">
                        Pro Feature
                    </Text>
                    <Text className="text-amber-700 text-xs mt-0.5">
                        {message || `Upgrade to Pro to unlock ${feature}.`}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={onUpgrade}
                className="bg-amber-500 rounded-xl py-2.5 items-center mt-1"
                activeOpacity={0.8}
            >
                <Text className="text-white font-bold text-sm">{buttonText || 'Upgrade to Pro'}</Text>
            </TouchableOpacity>
        </View>
    );
}

interface GateProps {
    feature: GateFeature;
    currentCount?: number;
    children: React.ReactNode;
    fallbackMessage?: string;
}

/**
 * Gate wrapper: renders children if allowed, otherwise shows upgrade prompt.
 */
export function Gate({ feature, currentCount, children, fallbackMessage }: GateProps) {
    const { allowed, max, loading, showPaywall } = useGate(feature, currentCount);
    const role = useAuthStore((s) => s.role);
    const isAdmin = role === 'admin';

    if (loading) return <>{children}</>;

    if (!allowed) {
        const msg = max
            ? isAdmin
                ? `You've reached the free plan limit of ${max}. Upgrade to Pro for unlimited access.`
                : `Your restaurant has reached the free plan limit of ${max}. Ask your admin to upgrade.`
            : fallbackMessage || (isAdmin
                ? 'This feature requires a Pro subscription.'
                : 'This feature requires Pro. Ask your admin to upgrade.');

        return <UpgradePrompt
            feature={feature}
            message={msg}
            onUpgrade={showPaywall}
            buttonText={isAdmin ? 'Upgrade to Pro' : 'Pro Feature — Ask Admin'}
        />;
    }

    return <>{children}</>;
}
