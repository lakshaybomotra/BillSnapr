import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <View className="flex-1 bg-surface-muted items-center justify-center p-8">
                    <Text className="text-5xl mb-4">😵</Text>
                    <Text className="text-xl font-bold text-text-primary mb-2 text-center">
                        Something went wrong
                    </Text>
                    <Text className="text-sm text-text-secondary text-center mb-6 leading-5">
                        An unexpected error occurred.{'\n'}Please try again.
                    </Text>
                    <TouchableOpacity
                        onPress={this.handleRetry}
                        className="bg-primary-500 px-8 py-3.5 rounded-xl"
                    >
                        <Text className="text-white text-base font-semibold">
                            Try Again
                        </Text>
                    </TouchableOpacity>
                    {__DEV__ && this.state.error && (
                        <Text className="text-xs-plus text-text-muted mt-6 text-center font-mono">
                            {this.state.error.message}
                        </Text>
                    )}
                </View>
            );
        }

        return this.props.children;
    }
}
