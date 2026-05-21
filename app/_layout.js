import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasRouted = useRef(false);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inPatient = segments[0] === '(patient)';
    const inCaregiver = segments[0] === '(caregiver)';

    // Not logged in
    if (!user) {
      hasRouted.current = false;
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // Logged in but profile not loaded yet — wait
    if (!profile) return;

    // Already on correct screen — don't re-route
    if (profile.role === 'caregiver' && inCaregiver) return;
    if (profile.role === 'patient' && inPatient) return;

    // Route to correct dashboard
    if (profile.role === 'caregiver') {
      router.replace('/(caregiver)/dashboard');
    } else if (profile.role === 'patient') {
      router.replace('/(patient)/dashboard');
    }
  }, [user, profile, loading, segments[0]]);

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
