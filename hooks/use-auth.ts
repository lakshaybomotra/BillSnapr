import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Sign up with email and password
export function useSignUp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, password, fullName }: {
            email: string;
            password: string;
            fullName: string;
        }) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] });
        },
    });
}

// Sign in with email and password
export function useSignIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] });
        },
    });
}

// Sign out
export function useSignOut() {
    const reset = useAuthStore((s) => s.reset);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            reset();
            queryClient.clear();
        },
    });
}

// Verify OTP
export function useVerifyOtp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, token }: { email: string; token: string }) => {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'signup',
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] });
        },
    });
}

// Get current session
export function useSession() {
    const setSession = useAuthStore((s) => s.setSession);
    const setUser = useAuthStore((s) => s.setUser);
    const setLoading = useAuthStore((s) => s.setLoading);

    return useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            return session;
        },
    });
}

// Get user profile with tenant
export function useProfile() {
    const setTenant = useAuthStore((s) => s.setTenant);
    const setOnboarded = useAuthStore((s) => s.setOnboarded);
    const user = useAuthStore((s) => s.user);

    return useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select(`
          *,
          tenant:tenants(*)
        `)
                .eq('id', user.id)
                .single();

            if (error) throw error;

            setTenant(data.tenant);
            setOnboarded(data.is_onboarded);

            return data;
        },
        enabled: !!user,
    });
}

// Update profile onboarding status
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    return useMutation({
        mutationFn: async (updates: { full_name?: string; is_onboarded?: boolean }) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data.is_onboarded !== undefined) {
                useAuthStore.getState().setOnboarded(data.is_onboarded);
            }
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
}

// Update tenant details
export function useUpdateTenant() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);

    return useMutation({
        mutationFn: async (updates: {
            name?: string | null;
            currency?: string | null;
            logo_url?: string | null;
            receipt_header?: string | null;
            receipt_footer?: string | null;
        }) => {
            if (!tenant) throw new Error('No tenant');

            const { data, error } = await supabase
                .from('tenants')
                .update(updates)
                .eq('id', tenant.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
}
