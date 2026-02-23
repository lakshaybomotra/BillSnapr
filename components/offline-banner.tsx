import { useNetworkStatus } from '@/hooks/use-network';
import { getPendingCount } from '@/lib/offline-queue';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

export function OfflineBanner() {
    const { isOnline } = useNetworkStatus();
    const slideAnim = useRef(new Animated.Value(-60)).current;
    const [pendingCount, setPendingCount] = useState(0);

    // Poll pending count from AsyncStorage queue
    useEffect(() => {
        getPendingCount().then(setPendingCount);
    }, [isOnline]);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: isOnline ? -60 : 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
        }).start();
    }, [isOnline, slideAnim]);

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 999,
            }}
        >
            <View className="bg-red-500 py-2 px-4 flex-row items-center justify-center gap-2">
                <Text className="text-white text-xs font-semibold">
                    ⚡ You&apos;re offline
                </Text>
                {pendingCount > 0 && (
                    <View className="bg-white/25 rounded-xl px-2 py-0.5">
                        <Text className="text-white text-xs-plus font-bold">
                            {pendingCount} order{pendingCount > 1 ? 's' : ''} pending sync
                        </Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}
