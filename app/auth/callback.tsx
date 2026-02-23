import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Signing in...' }} />
            <View className="flex-1 bg-surface items-center justify-center">
                <ActivityIndicator size="large" color="#00936E" />
                <Text className="text-text-secondary mt-4 text-sm">Signing you in...</Text>
            </View>
        </>
    );
}
