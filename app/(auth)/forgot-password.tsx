import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
            if (error) throw error;
            setSent(true);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top', 'bottom']}>
                <View className="flex-1 justify-center items-center p-8">
                    <Text className="text-5xl mb-4">📧</Text>
                    <Text className="text-xl font-bold text-text-primary dark:text-slate-100 text-center mb-2">
                        Check your email
                    </Text>
                    <Text className="text-text-muted dark:text-slate-500 text-center text-sm leading-5 mb-8">
                        We sent a password reset link to{'\n'}
                        <Text className="font-semibold text-text-primary dark:text-slate-100">{email}</Text>
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-primary-500 rounded-xl py-4 px-8"
                    >
                        <Text className="text-white font-semibold text-base">
                            Back to Sign In
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top', 'bottom']}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View className="mb-10">
                    <Text className="text-3xl font-bold text-text-primary dark:text-slate-100 text-center mb-2">
                        Reset Password
                    </Text>
                    <Text className="text-text-muted dark:text-slate-500 text-center text-sm">
                        Enter your email and we&apos;ll send you a reset link.
                    </Text>
                </View>

                {/* Form */}
                <View className="gap-5">
                    <View>
                        <Text className="text-text-secondary dark:text-slate-400 text-sm mb-2">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            className="bg-surface-subtle dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-4 text-text-primary dark:text-slate-100 text-base"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleReset}
                        disabled={loading || !email.trim()}
                        className={`rounded-xl py-4 mt-2 ${loading || !email.trim()
                            ? 'bg-gray-300 dark:bg-slate-700'
                            : 'bg-primary-500'
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-semibold text-base">
                                Send Reset Link
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Back to login */}
                <View className="flex-row justify-center mt-8">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text className="text-primary-500 font-semibold">← Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
