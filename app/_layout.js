import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';
import { useFonts } from 'expo-font';
import { COLORS } from '../constants/theme';

function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    'PlayfairDisplay': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inPatient = segments[0] === '(patient)';
    const inCaregiver = segments[0] === '(caregiver)';
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (user && profile) {
      if (profile.role === 'caregiver' && !inCaregiver) router.replace('/(caregiver)/dashboard');
      else if (profile.role === 'patient' && !inPatient) router.replace('/(patient)/dashboard');
    }
  }, [user, profile, loading]);

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
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
