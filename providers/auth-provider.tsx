import { getCustomerInfo, identifyUser, logoutRevenueCat } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { useSubscriptionStore } from '@/store/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, AppState, View } from 'react-native';
import Purchases from 'react-native-purchases';

const AUTH_CACHE_KEY = 'billsnapr-auth-cache';

interface CachedAuth {
    tenant: any;
    isOnboarded: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    const { session, isLoading, isOnboarded, setSession, setUser, setTenant, setRole, setLoading, setOnboarded } = useAuthStore();

    // Listen for auth state changes
    useEffect(() => {
        setLoading(true);

        // Get initial session (Supabase restores from SecureStore — works offline)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Handle deep link URLs (magic link callback)
        const handleDeepLink = async (url: string) => {
            if (!url) return;

            // Extract tokens from URL fragment: billsnapr://auth/callback#access_token=...&refresh_token=...
            const hashIndex = url.indexOf('#');
            if (hashIndex === -1) return;

            const fragment = url.substring(hashIndex + 1);
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (!accessToken || !refreshToken) return;

            const applySession = async () => {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (error) {
                    console.error('Deep link auth error:', error.message);
                    Alert.alert(
                        'Link Expired',
                        'This invite link has already been used or has expired. Please log in with your credentials.',
                        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
                    );
                }
                // On success, onAuthStateChange fires and navigation handles redirect
            };

            // Check if user is already logged in
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
                Alert.alert(
                    'Switch Account?',
                    `You're currently signed in as ${currentSession.user.email}. Do you want to switch to the invited account?`,
                    [
                        {
                            text: 'Stay',
                            style: 'cancel',
                            onPress: () => {
                                // Navigate back to where they were
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace('/(tabs)');
                                }
                            },
                        },
                        {
                            text: 'Switch',
                            onPress: async () => {
                                await supabase.auth.signOut();
                                await applySession();
                            },
                        },
                    ]
                );
            } else {
                await applySession();
            }
        };

        // Check if app was opened via a deep link
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        // Listen for deep links while app is running
        const linkSubscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                setLoading(true);
                fetchProfile(session.user.id);
            } else {
                setTenant(null);
                setRole(null);
                setOnboarded(false);
                setLoading(false);
                logoutRevenueCat();
                useSubscriptionStore.getState().reset();
            }
        });

        return () => {
            subscription.unsubscribe();
            linkSubscription.remove();
        };
    }, []);

    // Listen for RevenueCat customer info updates (admin only)
    useEffect(() => {
        Purchases.addCustomerInfoUpdateListener((info) => {
            if (useAuthStore.getState().role !== 'admin') return;
            useSubscriptionStore.getState().syncFromCustomerInfo(info);
        });
    }, []);

    // Re-check subscription on app foreground (catches passive expirations)
    const appState = useRef(AppState.currentState);
    useEffect(() => {
        const sub = AppState.addEventListener('change', async (nextState) => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                // Only admin syncs from RevenueCat on foreground
                if (useAuthStore.getState().role === 'admin') {
                    const info = await getCustomerInfo();
                    if (info) {
                        useSubscriptionStore.getState().syncFromCustomerInfo(info);
                    }
                }
            }
            appState.current = nextState;
        });
        return () => sub.remove();
    }, []);

    // Fetch user profile and tenant — falls back to cache when offline
    const fetchProfile = async (userId: string) => {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, tenant:tenants(*)')
                .eq('id', userId)
                .single();

            if (profileError) {
                // Network or DB error — try loading from cache
                const cached = await loadCachedAuth();
                if (cached) {
                    setTenant(cached.tenant);
                    setOnboarded(cached.isOnboarded);
                } else {
                    console.error('Profile fetch error (no cache):', profileError);
                }
                setLoading(false);
                return;
            }

            if (profile?.tenant) {
                setTenant(profile.tenant);
            }

            // Sync subscription: admin from RevenueCat, staff/manager from tenant row
            if (profile?.role === 'admin') {
                const customerInfo = await identifyUser(userId);
                if (customerInfo) {
                    useSubscriptionStore.getState().syncFromCustomerInfo(customerInfo);
                }
            } else {
                useSubscriptionStore.getState().syncFromTenant(
                    profile?.tenant?.subscription_tier ?? 'free',
                    profile?.tenant?.subscription_expires_at ?? null,
                );
            }

            const onboarded = profile?.is_onboarded ?? false;
            setOnboarded(onboarded);
            setRole(profile?.role ?? null);

            // Cache auth data for offline restarts
            await saveCachedAuth({
                tenant: profile?.tenant ?? null,
                isOnboarded: onboarded,
            });
        } catch (error) {
            // Network failure — try loading from cache
            const cached = await loadCachedAuth();
            if (cached) {
                setTenant(cached.tenant);
                setOnboarded(cached.isOnboarded);
            } else {
                console.error('Fetch profile error (no cache):', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Redirect based on auth state (only when navigation is ready)
    useEffect(() => {
        if (!navigationState?.key) return;
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === '(onboarding)';

        if (!session) {
            if (!inAuthGroup) {
                router.replace('/(auth)/login');
            }
        } else if (!isOnboarded) {
            if (!inOnboarding) {
                router.replace('/(onboarding)');
            }
        } else {
            if (inAuthGroup || inOnboarding) {
                router.replace('/(tabs)');
            }
        }
    }, [session, isLoading, isOnboarded, segments, navigationState?.key]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#00936E" />
            </View>
        );
    }

    return <>{children}</>;
}

// Persist auth state for offline restarts
async function saveCachedAuth(data: CachedAuth) {
    try {
        await AsyncStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
    } catch { }
}

async function loadCachedAuth(): Promise<CachedAuth | null> {
    try {
        const raw = await AsyncStorage.getItem(AUTH_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
