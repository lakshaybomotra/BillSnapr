import { useSubscription } from '@/hooks/use-subscription';
import { ENTITLEMENT_ID } from '@/lib/revenuecat';
import { format } from 'date-fns';
import { Stack } from 'expo-router';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
    { name: 'Unlimited Products', free: '10', pro: '∞' },
    { name: 'Staff Members', free: '1', pro: '∞' },
    { name: 'Orders / Month', free: '50', pro: '∞' },
    { name: 'Stock Tracking', free: '✗', pro: '✓' },
    { name: 'Receipt Customization', free: '✗', pro: '✓' },
    { name: 'Advanced Filters', free: '✗', pro: '✓' },
];

export default function SubscriptionScreen() {
    const { isPro, isTrialing, expiresAt } = useSubscription();

    const handleUpgrade = async () => {
        try {
            await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: ENTITLEMENT_ID,
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not open paywall.');
        }
    };

    const handleManage = async () => {
        try {
            await RevenueCatUI.presentCustomerCenter();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not open subscription management.');
        }
    };

    const handleRestore = async () => {
        try {
            const info = await Purchases.restorePurchases();
            const restored = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
            if (restored) {
                Alert.alert('✅ Restored', 'Your Pro subscription has been restored.');
            } else {
                Alert.alert('No Subscription Found', 'No active subscription was found for this account.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not restore purchases.');
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Subscription' }} />
            <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top']}>
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    {/* Current Plan Card */}
                    <View className={`p-5 rounded-2xl mb-5 border ${isPro ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}>
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-3">
                                <View className={`w-12 h-12 rounded-full items-center justify-center ${isPro ? 'bg-primary-100' : 'bg-gray-200'}`}>
                                    <Text className="text-2xl">{isPro ? '👑' : '🆓'}</Text>
                                </View>
                                <View>
                                    <Text className={`text-xl font-bold ${isPro ? 'text-primary-700' : 'text-text-primary'}`}>
                                        {isPro ? 'BillSnapr Pro' : 'Free Plan'}
                                    </Text>
                                    {isTrialing && (
                                        <View className="bg-amber-100 px-2 py-0.5 rounded-full self-start mt-1">
                                            <Text className="text-amber-700 text-xxs font-bold uppercase">Trial Active</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {expiresAt && (
                            <Text className="text-text-muted dark:text-slate-500 text-xs">
                                {isTrialing ? 'Trial ends' : 'Renews'}: {format(new Date(expiresAt), 'MMM d, yyyy')}
                            </Text>
                        )}

                        {!isPro && (
                            <Text className="text-text-muted dark:text-slate-500 text-xs mt-1">
                                Upgrade to unlock all features with a 14-day free trial.
                            </Text>
                        )}
                    </View>

                    {/* Feature Comparison */}
                    <View className="bg-white rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-5">
                        <View className="flex-row bg-gray-50 border-b border-gray-100 dark:border-slate-700 px-4 py-3">
                            <Text className="flex-1 text-text-muted dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Feature</Text>
                            <Text className="w-14 text-center text-text-muted dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Free</Text>
                            <Text className="w-14 text-center text-primary-600 text-xs font-bold uppercase tracking-wider">Pro</Text>
                        </View>
                        {FEATURES.map((feat, i) => (
                            <View key={feat.name} className={`flex-row items-center px-4 py-3 ${i < FEATURES.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <Text className="flex-1 text-text-primary dark:text-slate-100 text-sm font-medium">{feat.name}</Text>
                                <Text className="w-14 text-center text-text-muted dark:text-slate-500 text-sm">{feat.free}</Text>
                                <Text className="w-14 text-center text-primary-600 text-sm font-bold">{feat.pro}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    {isPro ? (
                        <TouchableOpacity
                            onPress={handleManage}
                            className="bg-white border border-gray-200 dark:border-slate-600 rounded-2xl py-4 items-center mb-3"
                            activeOpacity={0.8}
                        >
                            <Text className="text-text-primary dark:text-slate-100 font-semibold text-base">Manage Subscription</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleUpgrade}
                            className="bg-primary-500 rounded-2xl py-4 items-center mb-3"
                            activeOpacity={0.8}
                        >
                            <View className="flex-row items-center gap-2">
                                <Text className="text-lg">👑</Text>
                                <Text className="text-white font-bold text-base">Upgrade to Pro</Text>
                            </View>
                            <Text className="text-white/70 text-xs mt-1">14-day free trial • Cancel anytime</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={handleRestore}
                        className="py-3 items-center"
                        activeOpacity={0.6}
                    >
                        <Text className="text-text-muted dark:text-slate-500 text-sm font-medium">Restore Purchases</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
