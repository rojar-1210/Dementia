import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => router.replace('/(auth)/login'), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={styles.emoji}>🧠</Text>
        <Text style={styles.title}>Memory Care</Text>
        <Text style={styles.subtitle}>Assistant</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Caring for every moment</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 90, marginBottom: 16 },
  title: { fontSize: FONTS.title, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONTS.xlarge, color: COLORS.white, opacity: 0.9 },
  divider: { width: 60, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, marginVertical: 16 },
  tagline: { fontSize: FONTS.medium, color: COLORS.white, opacity: 0.75 },
});
