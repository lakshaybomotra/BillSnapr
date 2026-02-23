import { useSignUp } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const signUp = useSignUp();

    const passwordsMatch = password === confirmPassword;
    const isValid = fullName && email && password && confirmPassword && passwordsMatch;

    const handleRegister = () => {
        if (!isValid) return;

        signUp.mutate(
            { email, password, fullName },
            {
                onSuccess: (data) => {


                    if (data.session) {
                        // Session exists, AuthProvider handles navigation

                    } else if (data.user && !data.session) {
                        // Signup successful but no session -> Email verification required

                        router.push({
                            pathname: '/(auth)/verify',
                            params: { email }
                        });
                    }
                },
                onError: (error) => {
                    console.error('Signup error:', error);
                    Alert.alert('Registration Failed', error.message);
                }
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
                {/* Header */}
                <View className="items-center mb-10">
                    <View className="w-16 h-16 bg-primary-500 rounded-2xl items-center justify-center mb-4">
                        <Text className="text-white text-2xl font-bold">B</Text>
                    </View>
                    <Text className="text-2xl font-bold text-text-primary dark:text-slate-100">Create Account</Text>
                    <Text className="text-text-secondary dark:text-slate-400 mt-1">Start your free trial today</Text>
                </View>

                {/* Form */}
                <View className="gap-4">
                    <View>
                        <Text className="text-text-secondary dark:text-slate-400 text-sm mb-2">Full Name</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="John Doe"
                            autoComplete="name"
                            className="bg-surface-subtle dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-4 text-text-primary dark:text-slate-100 text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

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
                                placeholder="Min. 6 characters"
                                secureTextEntry={!showPassword}
                                autoComplete="new-password"
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

                    <View>
                        <Text className="text-text-secondary dark:text-slate-400 text-sm mb-2">Confirm Password</Text>
                        <View className="relative">
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="••••••••"
                                secureTextEntry={!showConfirmPassword}
                                autoComplete="new-password"
                                className={`bg-surface-subtle dark:bg-slate-800 border rounded-xl pl-4 pr-12 py-4 text-text-primary dark:text-slate-100 text-base ${confirmPassword && !passwordsMatch ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'
                                    }`}
                                placeholderTextColor="#94A3B8"
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-0 bottom-0 justify-center"
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#94A3B8"
                                />
                            </TouchableOpacity>
                        </View>
                        {confirmPassword && !passwordsMatch && (
                            <Text className="text-red-500 text-xs mt-1">Passwords don&apos;t match</Text>
                        )}
                    </View>

                    {signUp.error && (
                        <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                            <Text className="text-red-600 dark:text-red-400 text-sm text-center">
                                {signUp.error.message}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={signUp.isPending || !isValid}
                        className={`rounded-xl py-4 mt-2 ${signUp.isPending || !isValid
                            ? 'bg-gray-300 dark:bg-slate-700'
                            : 'bg-primary-500'
                            }`}
                    >
                        {signUp.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-semibold text-base">
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Login Link */}
                <View className="flex-row justify-center mt-8">
                    <Text className="text-text-secondary dark:text-slate-400">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                        <Text className="text-primary-500 font-semibold">Sign In</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
