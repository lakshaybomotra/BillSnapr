import { useColorScheme } from 'nativewind';
import React from 'react';
import { ScrollView, StatusBar, View, ViewProps } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

interface ScreenProps extends ViewProps {
    scrollable?: boolean;
    safeArea?: boolean;
    safeAreaEdges?: SafeAreaViewProps['edges'];
    contentClassName?: string;
}

export function Screen({
    children,
    scrollable = true,
    safeArea = true,
    safeAreaEdges = ['top', 'left', 'right'],
    className,
    contentClassName,
    ...props
}: ScreenProps) {
    const { colorScheme } = useColorScheme();
    const Container = safeArea ? SafeAreaView : View;
    const Wrapper = scrollable ? ScrollView : View;

    return (
        <Container
            className={`flex-1 bg-surface-muted ${className || ''}`}
            {...(safeArea ? { edges: safeAreaEdges } : {})}
            {...props}
        >
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <Wrapper
                className={'flex-1'}
                contentContainerStyle={scrollable ? { flexGrow: 1 } : undefined}
                showsVerticalScrollIndicator={false}
                bounces={scrollable}
            >
                <View className={`flex-1 ${scrollable ? 'px-4 py-2' : ''} ${contentClassName || ''}`}>
                    {children}
                </View>
            </Wrapper>
        </Container>
    );
}

