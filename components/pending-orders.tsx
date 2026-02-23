import { getPendingCount } from '@/lib/offline-queue';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function PendingOrdersBadge() {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const check = () => getPendingCount().then(setPendingCount);
        check();
        const interval = setInterval(check, 3000);
        return () => clearInterval(interval);
    }, []);

    if (pendingCount === 0) return null;

    return (
        <View className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-2.5 mx-4 mt-2 flex-row items-center gap-2">
            <Text className="text-base">⏳</Text>
            <Text className="text-amber-800 text-sm-minus font-semibold flex-1">
                {pendingCount} order{pendingCount > 1 ? 's' : ''} waiting to sync
            </Text>
            <Text className="text-amber-700 text-xs-plus">
                Will auto-sync when online
            </Text>
        </View>
    );
}
