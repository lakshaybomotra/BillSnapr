import { IconSymbol } from '@/components/ui/icon-symbol';
import { useInviteStaff, useStaffMembers } from '@/hooks/use-staff';
import { useGate } from '@/hooks/use-subscription';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const ROLES = [
    { value: 'staff', label: 'Staff', desc: 'Can view products & create orders' },
    { value: 'manager', label: 'Manager', desc: 'Staff + manage products & categories' },
    { value: 'admin', label: 'Admin', desc: 'Full access including staff management' },
] as const;

const METHODS = [
    { value: 'magic_link', label: 'Email Link', icon: '📧', desc: 'Send a sign-in link to their email' },
    { value: 'temp_password', label: 'Temporary Password', icon: '🔑', desc: 'Create account with a password you share' },
] as const;

function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export default function InviteStaffModal() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'manager' | 'staff'>('staff');
    const [method, setMethod] = useState<'magic_link' | 'temp_password'>('magic_link');
    const [tempPassword] = useState(generatePassword());
    const inviteStaff = useInviteStaff();
    const { data: staffMembers } = useStaffMembers();
    const staffGate = useGate('staff', (staffMembers?.length ?? 0));

    const handleInvite = () => {
        if (!email.trim()) return;

        // if (!staffGate.allowed) {
        //     staffGate.showPaywall();
        //     return;
        // }

        hapticLight();

        inviteStaff.mutate(
            { email: email.trim(), role, method, tempPassword: method === 'temp_password' ? tempPassword : undefined },
            {
                onSuccess: () => {
                    hapticSuccess();
                    if (method === 'temp_password') {
                        Alert.alert(
                            '✅ Staff Created',
                            `Account created for ${email}\n\nTemporary password:\n${tempPassword}\n\nShare this securely with the staff member.`,
                            [{ text: 'Done', onPress: () => router.back() }]
                        );
                    } else {
                        Alert.alert(
                            '✅ Invitation Sent',
                            `A sign-in link has been sent to ${email}`,
                            [{ text: 'Done', onPress: () => router.back() }]
                        );
                    }
                },
                onError: (error: any) => {
                    Alert.alert('Error', error.message || 'Failed to send invitation.');
                },
            }
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    presentation: 'modal',
                    title: 'Invite Staff',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#ffffff' },
                    headerShadowVisible: false,
                    headerTintColor: '#1E293B',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} className="mr-3">
                            <Text className="text-primary-500 font-semibold text-base">Cancel</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <KeyboardAwareScrollView
                className="flex-1 bg-surface-muted"
                contentContainerStyle={{ padding: 20, gap: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Email */}
                <View>
                    <Text className="text-text-primary font-semibold text-sm mb-2">Email Address</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="staff@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-text-primary text-base"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                {/* Role Selection */}
                <View>
                    <Text className="text-text-primary font-semibold text-sm mb-2">Role</Text>
                    <View className="gap-2">
                        {ROLES.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                onPress={() => { setRole(r.value); hapticLight(); }}
                                className={`flex-row items-center p-4 rounded-xl border ${role === r.value
                                    ? 'bg-primary-50 border-primary-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${role === r.value
                                    ? 'border-primary-500'
                                    : 'border-gray-300'
                                    }`}>
                                    {role === r.value && (
                                        <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className={`font-semibold text-sm ${role === r.value ? 'text-primary-700' : 'text-text-primary'}`}>
                                        {r.label}
                                    </Text>
                                    <Text className="text-text-muted text-xs mt-0.5">{r.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Invite Method */}
                <View>
                    <Text className="text-text-primary font-semibold text-sm mb-2">How to Invite</Text>
                    <View className="gap-2">
                        {METHODS.map((m) => (
                            <TouchableOpacity
                                key={m.value}
                                onPress={() => { setMethod(m.value); hapticLight(); }}
                                className={`flex-row items-center p-4 rounded-xl border ${method === m.value
                                    ? 'bg-primary-50 border-primary-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <Text className="text-xl mr-3">{m.icon}</Text>
                                <View className="flex-1">
                                    <Text className={`font-semibold text-sm ${method === m.value ? 'text-primary-700' : 'text-text-primary'}`}>
                                        {m.label}
                                    </Text>
                                    <Text className="text-text-muted text-xs mt-0.5">{m.desc}</Text>
                                </View>
                                {method === m.value && (
                                    <IconSymbol name="checkmark.circle.fill" size={20} color="#00936E" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Temp Password Preview */}
                {method === 'temp_password' && (
                    <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <Text className="text-amber-800 text-xs font-semibold mb-2">
                            Generated Password (share securely)
                        </Text>
                        <View className="bg-white border border-amber-200 rounded-lg px-4 py-3">
                            <Text className="text-text-primary font-mono text-lg tracking-widest text-center">
                                {tempPassword}
                            </Text>
                        </View>
                        <Text className="text-amber-600 text-xxs mt-2">
                            The staff member can change this after signing in.
                        </Text>
                    </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                    onPress={handleInvite}
                    disabled={inviteStaff.isPending || !email.trim()}
                    className={`rounded-xl py-4 mt-2 ${inviteStaff.isPending || !email.trim()
                        ? 'bg-gray-300'
                        : 'bg-primary-500'
                        }`}
                >
                    {inviteStaff.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-base">
                            {method === 'magic_link' ? 'Send Invitation' : 'Create Account'}
                        </Text>
                    )}
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </>
    );
}
