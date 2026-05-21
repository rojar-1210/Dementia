import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  useEffect(() => { router.replace('/(auth)/login'); }, []);
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#4A90D9" /></View>;
}
