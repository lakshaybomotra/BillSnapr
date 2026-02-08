import { useSignIn } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const signIn = useSignIn();

    const handleLogin = () => {
        if (!email || !password) return;

        signIn.mutate(
            { email, password },
            {
                onSuccess: () => {
                    // AuthProvider will handle navigation based on isOnboarded
                },
            }
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={20}
            >
                {/* Logo & Header */}
                <View className="items-center mb-12">
                    <View className="w-20 h-20 bg-primary-500 rounded-2xl items-center justify-center mb-4">
                        <Text className="text-white text-3xl font-bold">B</Text>
                    </View>
                    <Text className="text-3xl font-bold text-text-primary">BillSnapr</Text>
                    <Text className="text-text-secondary mt-2">POS & Receipt Printing</Text>
                </View>

                {/* Form */}
                <View className="gap-4">
                    <View>
                        <Text className="text-text-secondary text-sm mb-2">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@restaurant.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View>
                        <Text className="text-text-secondary text-sm mb-2">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            autoComplete="password"
                            className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    {signIn.error && (
                        <View className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <Text className="text-red-600 text-sm text-center">
                                {signIn.error.message}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={signIn.isPending || !email || !password}
                        className={`rounded-xl py-4 mt-2 ${signIn.isPending || !email || !password
                            ? 'bg-gray-300'
                            : 'bg-primary-500'
                            }`}
                    >
                        {signIn.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-semibold text-base">
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Register Link */}
                <View className="flex-row justify-center mt-8">
                    <Text className="text-text-secondary">Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                        <Text className="text-primary-500 font-semibold">Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
