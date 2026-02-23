import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
    }, [opacity]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: '#E2E8F0',
                },
                animStyle,
                style,
            ]}
        />
    );
}

/** Product card placeholder */
export function ProductCardSkeleton() {
    return (
        <View className="bg-surface-muted rounded-2xl overflow-hidden">
            <Skeleton width="100%" height={100} borderRadius={0} />
            <View className="p-3 gap-2">
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={14} />
            </View>
        </View>
    );
}

/** Product grid loading state */
export function ProductGridSkeleton({ columns = 3 }: { columns?: number }) {
    return (
        <View className="flex-row flex-wrap gap-3 p-4">
            {Array.from({ length: columns * 2 }).map((_, i) => (
                <View key={i} style={{ width: `${(100 / columns) - 2}%` as any }}>
                    <ProductCardSkeleton />
                </View>
            ))}
        </View>
    );
}

/** Order list row placeholder */
export function OrderRowSkeleton() {
    return (
        <View className="flex-row items-center p-4 gap-3">
            <Skeleton width={40} height={40} borderRadius={20} />
            <View className="flex-1 gap-1.5">
                <Skeleton width="60%" height={14} />
                <Skeleton width="35%" height={12} />
            </View>
            <Skeleton width={60} height={14} />
        </View>
    );
}

/** Order list loading state */
export function OrderListSkeleton() {
    return (
        <View>
            {Array.from({ length: 6 }).map((_, i) => (
                <OrderRowSkeleton key={i} />
            ))}
        </View>
    );
}

/** Dashboard stats card placeholder */
export function DashboardSkeleton() {
    return (
        <View className="p-4 gap-4">
            {/* Stats cards row */}
            <View className="flex-row gap-3">
                <View className="flex-1 bg-surface-muted rounded-2xl p-4 gap-2">
                    <Skeleton width="50%" height={12} />
                    <Skeleton width="70%" height={24} />
                </View>
                <View className="flex-1 bg-surface-muted rounded-2xl p-4 gap-2">
                    <Skeleton width="50%" height={12} />
                    <Skeleton width="70%" height={24} />
                </View>
            </View>
            {/* Chart area */}
            <View className="bg-surface-muted rounded-2xl p-4 gap-3">
                <Skeleton width="40%" height={16} />
                <Skeleton width="100%" height={160} borderRadius={12} />
            </View>
            {/* Recent orders */}
            <View className="bg-surface-muted rounded-2xl p-4 gap-3">
                <Skeleton width="50%" height={16} />
                <OrderRowSkeleton />
                <OrderRowSkeleton />
                <OrderRowSkeleton />
            </View>
        </View>
    );
}
