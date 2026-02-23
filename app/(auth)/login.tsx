import { useSignIn } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top', 'bottom']}>
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
                    <Text className="text-3xl font-bold text-text-primary dark:text-slate-100">BillSnapr</Text>
                    <Text className="text-text-secondary dark:text-slate-400 mt-2">POS & Receipt Printing</Text>
                </View>

                {/* Form */}
                <View className="gap-4">
                    <View>
                        <Text className="text-text-secondary dark:text-slate-400 text-sm mb-2">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@restaurant.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            className="bg-surface-subtle dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-4 text-text-primary dark:text-slate-100 text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View>
                        <Text className="text-text-secondary dark:text-slate-400 text-sm mb-2">Password</Text>
                        <View className="relative">
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                                className="bg-surface-subtle dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl pl-4 pr-12 py-4 text-text-primary dark:text-slate-100 text-base"
                                placeholderTextColor="#94A3B8"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-0 bottom-0 justify-center"
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#94A3B8"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {signIn.error && (
                        <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                            <Text className="text-red-600 dark:text-red-400 text-sm text-center">
                                {signIn.error.message}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/forgot-password')}
                        className="self-end"
                    >
                        <Text className="text-primary-500 text-sm font-medium">
                            Forgot password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={signIn.isPending || !email || !password}
                        className={`rounded-xl py-4 mt-2 ${signIn.isPending || !email || !password
                            ? 'bg-gray-300 dark:bg-slate-700'
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
                    <Text className="text-text-secondary dark:text-slate-400">Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                        <Text className="text-primary-500 font-semibold">Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
