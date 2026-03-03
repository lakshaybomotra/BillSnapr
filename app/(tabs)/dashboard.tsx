import { PendingOrdersBadge } from '@/components/pending-orders';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { useStats } from '@/hooks/use-orders';
import { getCurrencySymbol } from '@/lib/currency';
import { useAuthStore } from '@/store';
import { format, startOfWeek } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    const router = useRouter();
    const tenant = useAuthStore((s) => s.tenant);
    const cs = getCurrencySymbol(tenant?.currency);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

    const { dateFrom, dateTo } = useMemo(() => {
        const now = new Date();
        switch (selectedPeriod) {
            case 'today': {
                const d = new Date(now);
                d.setHours(0, 0, 0, 0);
                return { dateFrom: d.toISOString(), dateTo: undefined };
            }
            case 'yesterday': {
                const d = new Date(now);
                d.setDate(d.getDate() - 1);
                d.setHours(0, 0, 0, 0);
                const end = new Date(d);
                end.setHours(23, 59, 59, 999);
                return { dateFrom: d.toISOString(), dateTo: end.toISOString() };
            }
            case 'week': {
                const d = startOfWeek(now, { weekStartsOn: 1 });
                return { dateFrom: d.toISOString(), dateTo: undefined };
            }
            case 'month': {
                const d = new Date(now.getFullYear(), now.getMonth(), 1);
                return { dateFrom: d.toISOString(), dateTo: undefined };
            }
        }
    }, [selectedPeriod]);

    const { data: stats, isLoading, refetch, isRefetching } = useStats(dateFrom, dateTo);

    const periodLabel = useMemo(() => {
        const now = new Date();
        switch (selectedPeriod) {
            case 'today': return format(now, 'EEEE, MMMM d, yyyy');
            case 'yesterday': {
                const d = new Date(now);
                d.setDate(d.getDate() - 1);
                return format(d, 'EEEE, MMMM d, yyyy');
            }
            case 'week': {
                const start = startOfWeek(now, { weekStartsOn: 1 });
                return `${format(start, 'MMM d')} – ${format(now, 'MMM d, yyyy')}`;
            }
            case 'month': return format(now, 'MMMM yyyy');
        }
    }, [selectedPeriod]);

    const periods = [
        { id: 'today' as const, label: 'Today' },
        { id: 'yesterday' as const, label: 'Yesterday' },
        { id: 'week' as const, label: 'This Weeks' },
        { id: 'month' as const, label: 'This Month' },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 9)
            return "🌅 Good morning. Prep time — let’s set up for a smooth service.";

        if (hour >= 9 && hour < 12)
            return "☀️ Good morning. Let’s make today’s service smooth and profitable.";

        if (hour >= 12 && hour < 15)
            return "🍽️ Lunch hours are on. Keep the tables turning.";

        if (hour >= 15 && hour < 18)
            return "📊 Good afternoon. A great time to review performance.";

        if (hour >= 18 && hour < 22)
            return "🌆 Dinner service is live. Let’s close strong.";

        return "🌙 Good evening. Wrapping up the day?";
    };

    const avgOrder = stats && stats.orderCount > 0
        ? (stats.totalSales / stats.orderCount)
        : 0;

    const paymentBreakdown = [
        { label: 'Cash', value: stats?.cashSales ?? 0, color: 'bg-emerald-500', bgColor: 'bg-emerald-50', icon: 'banknote' as const },
        { label: 'Card', value: stats?.cardSales ?? 0, color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: 'creditcard' as const },
        { label: 'Other', value: stats?.otherSales ?? 0, color: 'bg-amber-500', bgColor: 'bg-amber-50', icon: 'qrcode' as const },
    ];

    const maxPayment = Math.max(...paymentBreakdown.map(p => p.value), 1);

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-gray-100">
                <Text className="text-text-muted text-sm font-medium">{getGreeting()}</Text>
                <Text className="text-2xl font-bold text-text-primary">{tenant?.name || 'Dashboard'}</Text>
                <Text className="text-text-muted text-xs mt-1">
                    {periodLabel}
                </Text>
            </View>

            {/* Period Selector */}
            <View className="bg-white border-b border-gray-100 py-2.5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                    {periods.map((period) => {
                        const isActive = selectedPeriod === period.id;
                        return (
                            <TouchableOpacity
                                key={period.id}
                                onPress={() => setSelectedPeriod(period.id)}
                                className={`px-4 py-2 rounded-full ${isActive ? 'bg-primary-500' : 'bg-gray-50 border border-gray-200'}`}
                            >
                                <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <PendingOrdersBadge />

            <ScrollView
                className="flex-1 p-5"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#00936E" />
                }
            >
                {isLoading ? (
                    <DashboardSkeleton />
                ) : (
                    <View className="gap-5">
                        {/* Main Stats Grid */}
                        <View className="flex-row gap-3">
                            {/* Total Sales — larger card */}
                            <View className="flex-1 bg-primary-500 p-5 rounded-2xl shadow-sm">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <View className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center">
                                        <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color="white" />
                                    </View>
                                    <Text className="text-white/80 text-sm font-medium">Today&apos;s Sales</Text>
                                </View>
                                <Text className="text-white text-3xl font-bold">
                                    {cs}{(stats?.totalSales ?? 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            {/* Order Count */}
                            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <View className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center mb-3">
                                    <IconSymbol name="list.bullet.rectangle.fill" size={18} color="#3b82f6" />
                                </View>
                                <Text className="text-text-muted text-xs font-medium mb-1">Orders</Text>
                                <Text className="text-text-primary text-2xl font-bold">
                                    {stats?.orderCount ?? 0}
                                </Text>
                            </View>

                            {/* Average Order */}
                            <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <View className="w-9 h-9 bg-amber-50 rounded-xl items-center justify-center mb-3">
                                    <IconSymbol name="chart.bar.fill" size={18} color="#f59e0b" />
                                </View>
                                <Text className="text-text-muted text-xs font-medium mb-1">Avg. Order</Text>
                                <Text className="text-text-primary text-2xl font-bold">
                                    {cs}{avgOrder.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        {/* Payment Breakdown */}
                        <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <Text className="text-text-primary font-bold text-base mb-4">Payment Breakdown</Text>
                            <View className="gap-4">
                                {paymentBreakdown.map((method) => (
                                    <View key={method.label} className="gap-2">
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center gap-2">
                                                <View className={`w-7 h-7 ${method.bgColor} rounded-lg items-center justify-center`}>
                                                    <IconSymbol name={method.icon} size={14} color="#475569" />
                                                </View>
                                                <Text className="text-text-secondary text-sm font-medium">{method.label}</Text>
                                            </View>
                                            <Text className="text-text-primary font-bold">
                                                {cs}{method.value.toFixed(2)}
                                            </Text>
                                        </View>
                                        {/* Progress Bar */}
                                        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <View
                                                className={`h-full ${method.color} rounded-full`}
                                                style={{ width: `${(method.value / maxPayment) * 100}%` }}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Quick Actions */}
                        <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <Text className="text-text-primary font-bold text-base mb-4">Quick Actions</Text>
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)')}
                                    className="flex-1 bg-primary-50 p-4 rounded-xl items-center border border-primary-100"
                                >
                                    <IconSymbol name="cart.fill" size={22} color="#00936E" />
                                    <Text className="text-primary-700 text-xs font-semibold mt-2 text-center" numberOfLines={2}>New Sale</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/orders')}
                                    className="flex-1 bg-blue-50 p-4 rounded-xl items-center border border-blue-100"
                                >
                                    <IconSymbol name="list.bullet.rectangle.fill" size={22} color="#3b82f6" />
                                    <Text className="text-blue-700 text-xs font-semibold mt-2 text-center" numberOfLines={2}>Orders</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => router.push('/modal-product')}
                                    className="flex-1 bg-amber-50 p-4 rounded-xl items-center border border-amber-100"
                                >
                                    <IconSymbol name="plus.circle.fill" size={22} color="#f59e0b" />
                                    <Text className="text-amber-700 text-xs font-semibold mt-2 text-center" numberOfLines={2}>Add Products</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
