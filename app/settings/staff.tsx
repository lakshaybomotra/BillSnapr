import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCancelInvite, usePendingInvites, useRemoveStaff, useStaffMembers, useUpdateStaffRole } from '@/hooks/use-staff';
import { useAuthStore } from '@/store';
import { Stack, useRouter } from 'expo-router';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLE_COLORS = {
    admin: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    manager: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    staff: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export default function StaffScreen() {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.user);
    const { data: staff, isLoading: staffLoading, refetch: refetchStaff } = useStaffMembers();
    const { data: invites, isLoading: invitesLoading, refetch: refetchInvites } = usePendingInvites();
    const cancelInvite = useCancelInvite();
    const removeStaff = useRemoveStaff();
    const updateRole = useUpdateStaffRole();

    const isLoading = staffLoading || invitesLoading;

    const onRefresh = async () => {
        await Promise.all([refetchStaff(), refetchInvites()]);
    };

    const handleRoleChange = (profileId: string, currentRole: string) => {
        const roles = ['admin', 'manager', 'staff'] as const;
        Alert.alert(
            'Change Role',
            'Select a new role for this staff member:',
            [
                ...roles
                    .filter(r => r !== currentRole)
                    .map(role => ({
                        text: role.charAt(0).toUpperCase() + role.slice(1),
                        onPress: () => updateRole.mutate({ profileId, role }),
                    })),
                { text: 'Cancel', style: 'cancel' as const },
            ]
        );
    };

    const handleRemoveStaff = (profileId: string, name: string | null) => {
        if (profileId === currentUser?.id) {
            Alert.alert('Error', "You can't remove yourself.");
            return;
        }
        Alert.alert(
            'Remove Staff',
            `Remove ${name || 'this person'} from your team? They will lose access to all data.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeStaff.mutate(profileId),
                },
            ]
        );
    };

    const handleCancelInvite = (inviteId: string, email: string) => {
        Alert.alert(
            'Cancel Invitation',
            `Cancel the pending invite to ${email}?`,
            [
                { text: 'Keep', style: 'cancel' },
                {
                    text: 'Cancel Invite',
                    style: 'destructive',
                    onPress: () => cancelInvite.mutate(inviteId),
                },
            ]
        );
    };

    const renderStaffItem = ({ item }: { item: any }) => {
        const isCurrentUser = item.id === currentUser?.id;
        const colors = ROLE_COLORS[item.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.staff;

        return (
            <View className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                        <View className="w-10 h-10 bg-primary-50 rounded-full items-center justify-center">
                            <Text className="text-primary-600 font-bold text-base">
                                {(item.full_name || '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-text-primary font-semibold text-base" numberOfLines={1}>
                                    {item.full_name || 'Unnamed'}
                                </Text>
                                {isCurrentUser && (
                                    <Text className="text-primary-500 text-xs font-medium">(You)</Text>
                                )}
                            </View>
                            <View className={`self-start px-2 py-0.5 rounded-full mt-1 ${colors.bg} border ${colors.border}`}>
                                <Text className={`text-xxs font-bold uppercase tracking-wider ${colors.text}`}>
                                    {item.role}
                                </Text>
                            </View>
                        </View>
                    </View>
                    {!isCurrentUser && (
                        <View className="flex-row gap-1">
                            <TouchableOpacity
                                onPress={() => handleRoleChange(item.id, item.role)}
                                className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
                            >
                                <IconSymbol name="pencil" size={14} color="#64748B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleRemoveStaff(item.id, item.full_name)}
                                className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                            >
                                <IconSymbol name="trash" size={14} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderInviteItem = ({ item }: { item: any }) => {
        const colors = ROLE_COLORS[item.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.staff;

        return (
            <View className="bg-amber-50 p-4 mb-3 rounded-2xl border border-amber-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                        <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                            <IconSymbol name="envelope" size={16} color="#D97706" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-text-primary font-medium text-sm" numberOfLines={1}>
                                {item.email}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <View className={`px-2 py-0.5 rounded-full ${colors.bg} border ${colors.border}`}>
                                    <Text className={`text-xxs font-bold uppercase tracking-wider ${colors.text}`}>
                                        {item.role}
                                    </Text>
                                </View>
                                <Text className="text-amber-600 text-xxs font-medium">
                                    {item.invite_method === 'magic_link' ? '📧 Email Link' : '🔑 Temp Password'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleCancelInvite(item.id, item.email)}
                        className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center"
                    >
                        <IconSymbol name="xmark" size={14} color="#D97706" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const ListHeader = () => (
        <View>
            {/* Pending Invitations */}
            {invites && invites.length > 0 && (
                <View className="mb-6">
                    <Text className="text-text-muted text-xs uppercase font-bold tracking-widest mb-3">
                        Pending Invitations ({invites.length})
                    </Text>
                    {invites.map((invite: any) => (
                        <View key={invite.id}>
                            {renderInviteItem({ item: invite })}
                        </View>
                    ))}
                </View>
            )}

            {/* Staff Header */}
            <Text className="text-text-muted text-xs uppercase font-bold tracking-widest mb-3">
                Team Members ({staff?.length || 0})
            </Text>
        </View>
    );

    return (
        <>
            <Stack.Screen options={{ title: 'Staff & Access' }} />
            <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
                <FlatList
                    data={staff || []}
                    keyExtractor={(item) => item.id}
                    renderItem={renderStaffItem}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#00936E" />
                    }
                    ListEmptyComponent={
                        !isLoading ? (
                            <View className="items-center py-10">
                                <Text className="text-3xl mb-2">👥</Text>
                                <Text className="text-text-muted text-sm">No team members yet</Text>
                            </View>
                        ) : null
                    }
                />

                {/* FAB - Invite Staff */}
                <TouchableOpacity
                    onPress={() => router.push('/modal-invite-staff' as any)}
                    className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-primary-500 items-center justify-center"
                    style={{
                        elevation: 8,
                        shadowColor: '#00936E',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                >
                    <IconSymbol name="plus" size={24} color="white" />
                </TouchableOpacity>
            </SafeAreaView>
        </>
    );
}
