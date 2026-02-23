import { useVerifyOtp } from '@/hooks/use-auth';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [token, setToken] = useState('');
    const verifyOtp = useVerifyOtp();

    const handleVerify = () => {
        if (!token || token.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter a valid 6-digit code.');
            return;
        }

        verifyOtp.mutate(
            { email: email!, token },
            {
                onSuccess: (data) => {
                    if (data.session) {
                        // AuthProvider will detect session and redirect to onboarding/tabs

                    } else {
                        Alert.alert('Verification Failed', 'Could not verify code. Please try again.');
                    }
                },
                onError: (error) => {
                    Alert.alert('Verification Failed', error.message);
                },
            }
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-surface dark:bg-slate-900" edges={['top', 'bottom']}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={20}
            >
                <View className="items-center mb-10">
                    <View className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-4">
                        <Text className="text-3xl">✉️</Text>
                    </View>
                    <Text className="text-2xl font-bold text-text-primary dark:text-slate-100 text-center">Check your Email</Text>
                    <Text className="text-text-secondary dark:text-slate-400 mt-2 text-center">
                        We&apos;ve sent a 6-digit verification code to
                    </Text>
                    <Text className="text-text-primary dark:text-slate-100 font-semibold text-center mt-1">{email}</Text>
                </View>

                <View className="gap-4">
                    <View>
                        <Text className="text-text-secondary dark:text-slate-400 text-sm mb-2">Verification Code</Text>
                        <TextInput
                            value={token}
                            onChangeText={setToken}
                            placeholder="123456"
                            keyboardType="number-pad"
                            maxLength={6}
                            autoComplete="sms-otp"
                            className="bg-surface-subtle dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-4 text-text-primary dark:text-slate-100 text-center text-2xl tracking-widest font-mono"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={verifyOtp.isPending || token.length !== 6}
                        className={`rounded-xl py-4 mt-4 ${verifyOtp.isPending || token.length !== 6
                            ? 'bg-gray-300 dark:bg-slate-700'
                            : 'bg-primary-500'
                            }`}
                    >
                        {verifyOtp.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-semibold text-base">
                                Verify Account
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
