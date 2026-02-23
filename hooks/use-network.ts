import { processOfflineQueue } from '@/lib/offline-queue';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

// Sync TanStack Query's online state with actual connectivity
// AND process the offline order queue when reconnecting.
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        let wasOffline = false;

        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = !!state.isConnected && !!state.isInternetReachable;
            onlineManager.setOnline(online);
            setIsOnline(online);

            if (!online) {
                wasOffline = true;
            }

            // Coming back online — process the queue
            if (online && wasOffline) {
                wasOffline = false;
                processOfflineQueue().then(({ synced }) => {
                    if (synced > 0) {
                        // Refresh order & dashboard data after syncing
                        queryClient.invalidateQueries({ queryKey: ['orders'] });
                        queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
                    }
                });
            }
        });

        // Also try processing queue on mount (app restart while online)
        NetInfo.fetch().then((state) => {
            const online = !!state.isConnected && !!state.isInternetReachable;
            if (online) {
                processOfflineQueue().then(({ synced }) => {
                    if (synced > 0) {
                        queryClient.invalidateQueries({ queryKey: ['orders'] });
                        queryClient.invalidateQueries({ queryKey: ['daily-stats'] });
                    }
                });
            }
        });

        return () => unsubscribe();
    }, [queryClient]);

    return { isOnline };
}
