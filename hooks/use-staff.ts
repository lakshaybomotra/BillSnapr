import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface StaffMember {
    id: string;
    full_name: string | null;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    created_at: string;
}

export interface Invitation {
    id: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    invite_method: 'magic_link' | 'temp_password';
    status: 'pending' | 'accepted' | 'expired';
    expires_at: string;
    created_at: string;
}

// List all staff in the current tenant
export function useStaffMembers() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['staff', tenant?.id],
        queryFn: async () => {
            if (!tenant) return [];

            // Join profiles with auth.users to get emails
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role, created_at')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Get emails from auth — we need to map profile IDs
            // Since we can't query auth.users directly from client,
            // we'll get the current user's email and show profile data
            return (data || []) as StaffMember[];
        },
        enabled: !!tenant,
    });
}

// List pending invitations
export function usePendingInvites() {
    const tenant = useAuthStore((s) => s.tenant);

    return useQuery({
        queryKey: ['invitations', tenant?.id],
        queryFn: async () => {
            if (!tenant) return [];

            const { data, error } = await supabase
                .from('invitations')
                .select('*')
                .eq('tenant_id', tenant.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as Invitation[];
        },
        enabled: !!tenant,
    });
}

// Invite staff member via Edge Function (uses Admin API for pre-verified users)
export function useInviteStaff() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);
    const user = useAuthStore((s) => s.user);

    return useMutation({
        mutationFn: async ({
            email,
            role,
            method,
            tempPassword,
        }: {
            email: string;
            role: 'admin' | 'manager' | 'staff';
            method: 'magic_link' | 'temp_password';
            tempPassword?: string;
        }) => {
            if (!tenant || !user) throw new Error('Not authenticated');

            // 1. Create the invitation record
            const { data: invite, error: inviteError } = await supabase
                .from('invitations')
                .insert({
                    tenant_id: tenant.id,
                    email: email.toLowerCase().trim(),
                    role,
                    invite_method: method,
                    invited_by: user.id,
                })
                .select()
                .single();

            if (inviteError) throw inviteError;

            // 2. Call Edge Function to create pre-verified user via Admin API
            const { data, error: fnError } = await supabase.functions.invoke('invite-staff', {
                body: {
                    email: email.toLowerCase().trim(),
                    role,
                    method,
                    tempPassword: method === 'temp_password' ? tempPassword : undefined,
                    invitationId: invite.id,
                },
            });

            if (fnError) {
                // Clean up the invitation if user creation fails
                await supabase.from('invitations').delete().eq('id', invite.id);
                // Try to extract custom error message from the response body
                try {
                    const errorBody = await fnError.context?.json?.();
                    if (errorBody?.error) throw new Error(errorBody.error);
                } catch (parseErr) {
                    if (parseErr instanceof Error && parseErr.message !== fnError.message) throw parseErr;
                }
                throw fnError;
            }

            // Check for application-level errors from the edge function
            if (data?.error) {
                await supabase.from('invitations').delete().eq('id', invite.id);
                throw new Error(data.error);
            }

            return invite;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}

// Cancel/delete invitation
export function useCancelInvite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inviteId: string) => {
            const { error } = await supabase
                .from('invitations')
                .delete()
                .eq('id', inviteId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
        },
    });
}

// Update staff member role
export function useUpdateStaffRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ profileId, role }: { profileId: string; role: 'admin' | 'manager' | 'staff' }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', profileId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}

// Remove staff member (unlink from tenant)
export function useRemoveStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileId: string) => {
            const { error } = await supabase
                .from('profiles')
                .update({ tenant_id: null, role: 'staff' })
                .eq('id', profileId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}
