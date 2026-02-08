import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    const { session, isLoading, isOnboarded, setSession, setUser, setTenant, setLoading, setOnboarded } = useAuthStore();

    // Listen for auth state changes
    useEffect(() => {
        setLoading(true);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('AuthProvider: Auth state change:', _event, session?.user?.id);
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setTenant(null);
                setOnboarded(false);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Fetch user profile and tenant
    const fetchProfile = async (userId: string) => {
        try {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, tenant:tenants(*)')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                setLoading(false);
                return;
            }

            if (profile?.tenant) {
                setTenant(profile.tenant);
            }

            setOnboarded(profile?.is_onboarded ?? false);
        } catch (error) {
            console.error('Fetch profile error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Redirect based on auth state (only when navigation is ready)
    useEffect(() => {
        // Wait until navigation is ready
        if (!navigationState?.key) return;
        if (isLoading) {
            console.log('AuthProvider: Loading...');
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === '(onboarding)';

        console.log('AuthProvider: Checking redirect', {
            hasSession: !!session,
            isOnboarded,
            segment: segments[0],
            inAuthGroup,
            inOnboarding
        });

        if (!session) {
            // Not logged in, redirect to login
            if (!inAuthGroup) {
                console.log('AuthProvider: Redirecting to login');
                router.replace('/(auth)/login');
            }
        } else if (!isOnboarded) {
            // Logged in but not onboarded
            if (!inOnboarding) {
                console.log('AuthProvider: Redirecting to onboarding');
                router.replace('/(onboarding)');
            }
        } else {
            // Logged in and onboarded
            if (inAuthGroup || inOnboarding) {
                console.log('AuthProvider: Redirecting to tabs');
                router.replace('/(tabs)');
            }
        }
    }, [session, isLoading, isOnboarded, segments, navigationState?.key]);

    // Show loading screen while initializing
    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#00936E" />
            </View>
        );
    }

    return <>{children}</>;
}
