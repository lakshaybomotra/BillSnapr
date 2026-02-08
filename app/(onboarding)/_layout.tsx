import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="restaurant" />
            <Stack.Screen name="receipt" />
            <Stack.Screen name="first-product" />
        </Stack>
    );
}
