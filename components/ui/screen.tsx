import React from 'react';
import { ScrollView, StatusBar, StatusBarStyle, View, ViewProps } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

interface ScreenProps extends ViewProps {
    scrollable?: boolean;
    safeArea?: boolean; // Default true
    safeAreaEdges?: SafeAreaViewProps['edges']; // Default ['top']
    statusBarStyle?: StatusBarStyle; // Default 'dark-content'
    contentClassName?: string;
}

export function Screen({
    children,
    scrollable = true,
    safeArea = true,
    safeAreaEdges = ['top', 'left', 'right'],
    statusBarStyle = 'dark-content',
    className,
    contentClassName,
    ...props
}: ScreenProps) {
    const Container = safeArea ? SafeAreaView : View;
    const Wrapper = scrollable ? ScrollView : View;

    return (
        <Container
            className={`flex-1 bg-surface ${className || ''}`}
            {...(safeArea ? { edges: safeAreaEdges } : {})}
            {...props}
        >
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor="transparent"
                translucent
            />
            <Wrapper
                className={`flex-1 ${scrollable ? '' : 'px-4'}`}
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
