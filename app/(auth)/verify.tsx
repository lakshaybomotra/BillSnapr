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
                        console.log('OTP Verified, session created.');
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
        <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={20}
            >
                <View className="items-center mb-10">
                    <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
                        <Text className="text-3xl">✉️</Text>
                    </View>
                    <Text className="text-2xl font-bold text-text-primary text-center">Check your Email</Text>
                    <Text className="text-text-secondary mt-2 text-center">
                        We've sent a 6-digit verification code to
                    </Text>
                    <Text className="text-text-primary font-semibold text-center mt-1">{email}</Text>
                </View>

                <View className="gap-4">
                    <View>
                        <Text className="text-text-secondary text-sm mb-2">Verification Code</Text>
                        <TextInput
                            value={token}
                            onChangeText={setToken}
                            placeholder="123456"
                            keyboardType="number-pad"
                            maxLength={6}
                            autoComplete="sms-otp"
                            className="bg-surface-subtle border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-center text-2xl tracking-widest font-mono"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={verifyOtp.isPending || token.length !== 6}
                        className={`rounded-xl py-4 mt-4 ${verifyOtp.isPending || token.length !== 6
                            ? 'bg-gray-300'
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
