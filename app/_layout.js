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
    const inRole = segments[0] === 'role-select';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && !profile && !inRole && !inAuth) {
      router.replace('/role-select');
    } else if (user && profile?.role === 'patient' && !segments[0]?.includes('patient') && !inAuth) {
      router.replace('/(patient)/dashboard');
    } else if (user && profile?.role === 'caregiver' && !segments[0]?.includes('caregiver') && !inAuth) {
      router.replace('/(caregiver)/dashboard');
    }
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
      <Stack.Screen name="role-select" />
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
