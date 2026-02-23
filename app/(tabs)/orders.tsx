import { PendingOrdersBadge } from '@/components/pending-orders';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { OrderListSkeleton } from '@/components/ui/skeleton';
import { Order, OrderFilters, useOrders } from '@/hooks/use-orders';
import { useGate } from '@/hooks/use-subscription';
import { getCurrencySymbol } from '@/lib/currency';
import { useAuthStore } from '@/store';
import { format, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'all' | 'completed' | 'voided' | 'pending';
type DatePreset = 'all' | 'today' | 'week' | 'month' | 'yesterday';

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'voided', label: 'Voided' },
    { key: 'pending', label: 'Pending' },
];

const DATE_OPTIONS: { key: DatePreset; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week ' },
    { key: 'month', label: 'This Month' },
];

export default function OrdersScreen() {
    const router = useRouter();
    const tenant = useAuthStore((s) => s.tenant);

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchGate = useGate('full_search');

    // Debounce search input
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 500);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchInput]);

    // Build filters object
    const filters: OrderFilters = useMemo(() => {
        const f: OrderFilters = {};

        if (debouncedSearch.trim()) f.search = debouncedSearch.trim();
        if (statusFilter !== 'all') f.status = statusFilter;

        const now = new Date();
        switch (datePreset) {
            case 'today':
                f.dateFrom = startOfDay(now).toISOString();
                break;
            case 'yesterday':
                f.dateFrom = startOfDay(subDays(now, 1)).toISOString();
                f.dateTo = startOfDay(now).toISOString();
                break;
            case 'week':
                f.dateFrom = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
                break;
            case 'month':
                f.dateFrom = startOfMonth(now).toISOString();
                break;
        }

        return f;
    }, [debouncedSearch, statusFilter, datePreset]);

    const { data: orders, isLoading, refetch } = useOrders(filters);

    const hasActiveFilters = statusFilter !== 'all' || datePreset !== 'all' || searchInput.trim() !== '';

    const clearFilters = useCallback(() => {
        setSearchInput('');
        setDebouncedSearch('');
        setStatusFilter('all');
        setDatePreset('all');
    }, []);

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (datePreset !== 'all' ? 1 : 0);

    // Temporary filter state for the modal — only applied on "Apply"
    const [tempStatus, setTempStatus] = useState<StatusFilter>(statusFilter);
    const [tempDate, setTempDate] = useState<DatePreset>(datePreset);

    const openFilterModal = useCallback(() => {
        setTempStatus(statusFilter);
        setTempDate(datePreset);
        setFilterModalVisible(true);
    }, [statusFilter, datePreset]);

    const applyFilters = useCallback(() => {
        setStatusFilter(tempStatus);
        setDatePreset(tempDate);
        setFilterModalVisible(false);
    }, [tempStatus, tempDate]);

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'text-green-700 bg-green-50 border-green-200';
            case 'voided': return 'text-red-700 bg-red-50 dark:bg-red-900/30 border-red-200';
            default: return 'text-amber-700 bg-amber-50 border-amber-200';
        }
    };

    const getStatusLabel = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'voided': return 'Voided';
            default: return 'Pending';
        }
    };

    const ListHeader = () => (
        <View className="mb-4">
            {/* Active Filters Info */}
            {hasActiveFilters && (
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-text-muted dark:text-slate-500 text-xs">
                        {orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''} found
                    </Text>
                    <TouchableOpacity onPress={clearFilters} className="flex-row items-center gap-1">
                        <IconSymbol name="xmark" size={10} color="#EF4444" />
                        <Text className="text-red-500 text-xs font-medium">Clear filters</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const filterModal = (
        <Modal
            visible={filterModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <Pressable
                className="flex-1 bg-black/40"
                onPress={() => setFilterModalVisible(false)}
            />
            <View className="bg-white dark:bg-slate-800 rounded-t-3xl px-5 pt-4 pb-8">
                {/* Handle */}
                <View className="w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full self-center mb-5" />

                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-lg font-bold text-text-primary dark:text-slate-100">Filters</Text>
                    {(tempStatus !== 'all' || tempDate !== 'all') && (
                        <TouchableOpacity onPress={() => { setTempStatus('all'); setTempDate('all'); }}>
                            <Text className="text-red-500 text-sm font-medium">Reset All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Status Section */}
                <Text className="text-text-muted font-bold text-xs uppercase tracking-widest mb-3">Status</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                    {STATUS_OPTIONS.map((opt) => {
                        const isLocked = !searchGate.allowed && opt.key !== 'all';
                        const isActive = tempStatus === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                onPress={() => {
                                    if (isLocked) { searchGate.showPaywall(); return; }
                                    setTempStatus(opt.key);
                                }}
                                className={`px-4 py-2.5 rounded-xl border flex-row items-center gap-1.5 ${isLocked
                                    ? 'bg-gray-50 border-gray-200 dark:border-slate-600 opacity-60'
                                    : isActive
                                        ? 'bg-primary-500 border-primary-500'
                                        : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                                    }`}
                            >
                                <Text className={`text-sm font-semibold ${isLocked
                                    ? 'text-text-muted'
                                    : isActive ? 'text-white' : 'text-text-secondary dark:text-slate-300'
                                    }`}>
                                    {opt.label}
                                </Text>
                                {isLocked && <Text className="text-xs">🔒</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Date Section */}
                <Text className="text-text-muted font-bold text-xs uppercase tracking-widest mb-3">Time Period</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                    {DATE_OPTIONS.map((opt) => {
                        const isLocked = !searchGate.allowed && opt.key !== 'today';
                        const isActive = tempDate === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                onPress={() => {
                                    if (isLocked) { searchGate.showPaywall(); return; }
                                    setTempDate(opt.key);
                                }}
                                className={`px-4 py-2.5 rounded-xl border flex-row items-center gap-1.5 ${isLocked
                                    ? 'bg-gray-50 border-gray-200 dark:border-slate-600 opacity-60'
                                    : isActive
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                                    }`}
                            >
                                <Text className={`text-sm font-semibold ${isLocked
                                    ? 'text-text-muted'
                                    : isActive ? 'text-white' : 'text-text-secondary dark:text-slate-300'
                                    }`}>
                                    {opt.label}
                                </Text>
                                {isLocked && <Text className="text-xs">🔒</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Apply Button */}
                <TouchableOpacity
                    onPress={applyFilters}
                    className="bg-primary-500 py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-base">Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top']}>
            <View className="px-5 py-4 bg-white border-b border-gray-100 dark:border-slate-700">
                <Text className="text-2xl font-bold text-text-primary dark:text-slate-100">Order History</Text>
            </View>

            {/* Sticky Search + Filter Bar */}
            <View className="px-4 py-3 bg-surface dark:bg-slate-900 flex-row items-center gap-3 border-b border-gray-100 dark:border-slate-700">
                <View className="flex-1 flex-row items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-3 shadow-sm">
                    <IconSymbol name="magnifyingglass" size={16} color="#94A3B8" />
                    <TextInput
                        value={searchInput}
                        onChangeText={setSearchInput}
                        placeholder="Search by order #"
                        keyboardType="number-pad"
                        className="flex-1 py-3 px-2 text-text-primary dark:text-slate-100 text-sm"
                        placeholderTextColor="#94A3B8"
                    />
                    {searchInput.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchInput(''); setDebouncedSearch(''); }}>
                            <IconSymbol name="xmark.circle.fill" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    onPress={openFilterModal}
                    className={`px-4 py-3 rounded-xl border flex-row items-center gap-2 ${activeFilterCount > 0
                        ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-700'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600'
                        }`}
                >
                    <IconSymbol name="line.3.horizontal.decrease" size={16} color={activeFilterCount > 0 ? '#00936E' : '#64748B'} />
                    {activeFilterCount > 0 && (
                        <View className="bg-primary-500 w-5 h-5 rounded-full items-center justify-center">
                            <Text className="text-white text-xs font-bold">{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <PendingOrdersBadge />

            {isLoading && !orders ? (
                <OrderListSkeleton />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    ListHeaderComponent={ListHeader}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00936E" />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <View className="w-16 h-16 bg-surface-subtle dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                                <Text className="text-3xl">{hasActiveFilters ? '🔍' : '🧾'}</Text>
                            </View>
                            <Text className="text-text-primary dark:text-slate-100 text-lg font-semibold">
                                {hasActiveFilters ? 'No matching orders' : 'No orders yet'}
                            </Text>
                            {hasActiveFilters && (
                                <TouchableOpacity onPress={clearFilters} className="mt-3 px-4 py-2 bg-primary-50 rounded-full">
                                    <Text className="text-primary-600 text-sm font-medium">Clear filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
                            className="bg-white p-5 mb-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm dark:bg-slate-800"
                        >
                            <View className="flex-row justify-between items-start mb-3">
                                <View>
                                    <View className="flex-row items-center mb-1">
                                        <Text className="font-bold text-text-primary dark:text-slate-100 text-lg mr-2">
                                            Order #{item.order_number}
                                        </Text>
                                        <View className={`px-2.5 py-0.5 rounded-full border ${getStatusColor(item.status).replace('text-', 'border-').split(' ')[2]}`}>
                                            <Text className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(item.status).split(' ')[0]}`}>
                                                {getStatusLabel(item.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-text-muted dark:text-slate-500 text-xs font-medium uppercase tracking-wide">
                                        {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
                                    </Text>
                                    {item.customer_name && (
                                        <Text className="text-text-secondary dark:text-slate-400 text-xs font-medium mt-0.5">
                                            👤 {item.customer_name}
                                        </Text>
                                    )}
                                </View>
                                <Text className="text-xl font-bold text-text-primary dark:text-slate-100 dark:text-slate-100">
                                    {getCurrencySymbol(tenant?.currency)}{item.total.toFixed(2)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50 dark:border-slate-700 dark:border-slate-700">
                                <View className="flex-row items-center gap-2">
                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${item.payment_method === 'cash' ? 'bg-green-100' :
                                        item.payment_method === 'card' ? 'bg-blue-100' : 'bg-purple-100'
                                        }`}>
                                        <IconSymbol
                                            name={item.payment_method === 'cash' ? 'banknote' : item.payment_method === 'card' ? 'creditcard' : 'qrcode'}
                                            size={14}
                                            color={
                                                item.payment_method === 'cash' ? '#15803d' :
                                                    item.payment_method === 'card' ? '#1d4ed8' : '#7e22ce'
                                            }
                                        />
                                    </View>
                                    <Text className="text-text-secondary dark:text-slate-400 text-sm capitalize font-medium">
                                        {item.payment_method} Payment
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Text className="text-text-muted dark:text-slate-500 text-xs font-medium mr-1">Details</Text>
                                    <IconSymbol name="chevron.right" size={12} color="#94A3B8" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {filterModal}
        </SafeAreaView>
    );
}
