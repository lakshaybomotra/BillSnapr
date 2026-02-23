import 'react-native-reanimated';
import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { asyncStoragePersister } from '@/lib/mmkv';
import { initRevenueCat } from '@/lib/revenuecat';
import { AuthProvider } from '@/providers/auth-provider';
import { usePrinterStore } from '@/store/printer';
import '@/store/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
    },
  },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [navTheme, setNavTheme] = useState(
    colorScheme === 'dark' ? DarkTheme : DefaultTheme
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNavTheme(colorScheme === 'dark' ? DarkTheme : DefaultTheme);
    }, 100);
    return () => clearTimeout(timeout);
  }, [colorScheme]);

  useEffect(() => {
    initRevenueCat();
    // Delay auto-reconnect so it doesn't compete with auth + theme AsyncStorage reads on startup
    const timeout = setTimeout(() => {
      usePrinterStore.getState().tryAutoReconnect();
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
      }}
      onSuccess={() => {
        queryClient.invalidateQueries();
      }}
    >
      <ThemeProvider value={navTheme}>
        <AuthProvider>
          <ErrorBoundary>
            <OfflineBanner />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(onboarding)"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: 'fade',
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="modal-invite-staff" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}