import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inPatient = segments[0] === '(patient)';
    const inCaregiver = segments[0] === '(caregiver)';

    if (!user) {
      // Not logged in → go to login
      if (!inAuth) router.replace('/(auth)/login');
    } else if (user && profile) {
      // Logged in with profile → route to correct dashboard
      if (profile.role === 'caregiver' && !inCaregiver) {
        router.replace('/(caregiver)/dashboard');
      } else if (profile.role === 'patient' && !inPatient) {
        router.replace('/(patient)/dashboard');
      }
    }
    // If user exists but no profile yet, wait for profile to load
  }, [user, profile, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(patient)" />
      <Stack.Screen name="(caregiver)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
