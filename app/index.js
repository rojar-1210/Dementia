import { View, Text, StyleSheet, Image } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(auth)/login'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🧠</Text>
      <Text style={styles.title}>Memory Care</Text>
      <Text style={styles.subtitle}>Assistant</Text>
      <Text style={styles.tagline}>Caring for every moment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: FONTS.title, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONTS.xlarge, color: COLORS.white, opacity: 0.9 },
  tagline: { fontSize: FONTS.medium, color: COLORS.white, opacity: 0.7, marginTop: 12 },
});
