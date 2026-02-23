import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSignOut } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useAuthStore } from '@/store';
import { useSubscriptionStore } from '@/store/subscription';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, tenant, role } = useAuthStore();
    const signOut = useSignOut();
    const isPro = useSubscriptionStore((s) => s.isProUser);
    const { canManageSettings } = useRole();

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => {
                    signOut.mutate(undefined, {
                        onSuccess: () => router.replace('/(auth)/login'),
                    });
                },
            },
        ]);
    };

    const roleBadgeColor = {
        admin: { bg: 'bg-primary-100', text: 'text-primary-700' },
        manager: { bg: 'bg-blue-100', text: 'text-blue-700' },
        staff: { bg: 'bg-gray-100', text: 'text-gray-700' },
    };
    const badge = roleBadgeColor[role ?? 'staff'];

    return (
        <SafeAreaView className="flex-1 bg-surface-muted" edges={['top']}>
            <View className="px-5 py-4 bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-text-primary">Settings</Text>
            </View>

            <ScrollView className="flex-1 p-5">
                {/* Profile Section */}
                <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-8 flex-row items-center relative overflow-hidden">
                    <View className="absolute top-0 left-0 w-full h-1 bg-primary-500" />
                    <View className="w-16 h-16 bg-primary-50 rounded-2xl items-center justify-center mr-5 border border-primary-100">
                        <Text className="text-3xl font-bold text-primary-600">
                            {tenant?.name?.charAt(0) || 'R'}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-xl text-text-primary mb-1">{tenant?.name}</Text>
                        <Text className="text-text-secondary text-sm font-medium">{user?.email}</Text>
                        <View className="flex-row mt-2 gap-2">
                            <View className={`${badge.bg} px-2.5 py-0.5 rounded-full`}>
                                <Text className={`${badge.text} text-xxs font-bold uppercase`}>
                                    {role ?? 'staff'}
                                </Text>
                            </View>
                            <View className="bg-gray-100 px-2 py-0.5 rounded">
                                <Text className="text-text-muted text-xxs font-mono tracking-wider">
                                    ID: {tenant?.id?.slice(0, 8)}...
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Settings Groups */}
                <View className="gap-8">
                    {/* General — admin only */}
                    {canManageSettings && (
                        <View>
                            <Text className="text-text-muted text-xs uppercase font-bold tracking-widest mb-3 ml-2">General</Text>
                            <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <TouchableOpacity onPress={() => router.push('/settings/restaurant' as any)} className="flex-row items-center justify-between p-4 border-b border-gray-50">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                                            <IconSymbol name="building.2" size={16} color="#3b82f6" />
                                        </View>
                                        <View>
                                            <Text className="text-text-primary font-semibold text-base">Restaurant Details</Text>
                                            <Text className="text-text-muted text-xs mt-0.5">Name, address &amp; branding</Text>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => router.push('/settings/receipt' as any)} className="flex-row items-center justify-between p-4 border-b border-gray-50">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-8 h-8 rounded-full bg-purple-50 items-center justify-center">
                                            <IconSymbol name="doc.text" size={16} color="#a855f7" />
                                        </View>
                                        <View>
                                            <Text className="text-text-primary font-semibold text-base">Receipt Template</Text>
                                            <Text className="text-text-muted text-xs mt-0.5">Header &amp; footer customization</Text>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => router.push('/settings/staff' as any)} className="flex-row items-center justify-between p-4 border-b border-gray-50">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-8 h-8 rounded-full bg-teal-50 items-center justify-center">
                                            <IconSymbol name="person.2" size={16} color="#14B8A6" />
                                        </View>
                                        <View>
                                            <Text className="text-text-primary font-semibold text-base">Staff &amp; Access</Text>
                                            <Text className="text-text-muted text-xs mt-0.5">Manage team members &amp; roles</Text>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => router.push('/settings/subscription' as any)} className="flex-row items-center justify-between p-4">
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-8 h-8 rounded-full bg-amber-50 items-center justify-center">
                                            <Text className="text-base">👑</Text>
                                        </View>
                                        <View>
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-text-primary font-semibold text-base">Subscription</Text>
                                                <View className={`px-2 py-0.5 rounded-full ${isPro ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                                    <Text className={`text-xxs font-bold uppercase ${isPro ? 'text-primary-700' : 'text-text-muted'}`}>
                                                        {isPro ? 'PRO' : 'FREE'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-text-muted text-xs mt-0.5">Manage your plan &amp; billing</Text>
                                        </View>
                                    </View>
                                    <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View>
                        <Text className="text-text-muted text-xs uppercase font-bold tracking-widest mb-3 ml-2">Hardware</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <TouchableOpacity
                                onPress={() => router.push('/settings/printer' as any)}
                                className="flex-row items-center justify-between p-4"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center">
                                        <IconSymbol name="printer" size={16} color="#f97316" />
                                    </View>
                                    <View>
                                        <Text className="text-text-primary font-semibold text-base">Printer Settings</Text>
                                        <Text className="text-text-muted text-xs mt-0.5">Bluetooth &amp; thermal printer</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-text-muted text-xs font-medium bg-gray-100 px-2 py-1 rounded">Configure</Text>
                                    <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text className="text-text-muted text-xs uppercase font-bold tracking-widest mb-3 ml-2">Account</Text>
                        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <TouchableOpacity
                                onPress={handleSignOut}
                                className="flex-row items-center justify-between p-4"
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
                                    </View>
                                    <Text className="text-red-600 font-semibold text-base">Sign Out</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="items-center mt-10 mb-8">
                    <Text className="text-text-muted text-xs font-semibold uppercase tracking-widest">BillSnapr POS</Text>
                    <Text className="text-text-muted text-xxs mt-1 opacity-60">Version 1.0.1 • Build 2026.2</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
