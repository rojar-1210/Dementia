import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const NAV = [
  { name: 'dashboard', label: 'Home', icon: 'home' },
  { name: 'reminders', label: 'Reminders', icon: 'alarm' },
  { name: 'emergency', label: 'SOS', icon: 'warning' },
  { name: 'games', label: 'Games', icon: 'game-controller' },
  { name: 'settings', label: 'Settings', icon: 'settings' },
];

export default function PatientLayout() {
  const { colors } = useTheme();
  const C = colors;
  const router = useRouter();
  const segments = useSegments();
  const current = segments[segments.length - 1];

  if (Platform.OS !== 'web') {
    const { Tabs } = require('expo-router');
    const { COLORS } = require('../../constants/theme');
    return (
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 6, backgroundColor: C.card, borderTopColor: C.border },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}>
        {NAV.map(n => (
          <Tabs.Screen key={n.name} name={n.name} options={{ title: n.label, tabBarIcon: ({ color }) => <Ionicons name={n.icon} size={28} color={color} />, tabBarActiveTintColor: n.name === 'emergency' ? COLORS.danger : COLORS.primary }} />
        ))}
      </Tabs>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.sidebar, { backgroundColor: C.card, borderRightColor: C.border }]}>
        <Text style={[styles.brand, { color: C.primary }]}>🧠 Memory Care</Text>
        {NAV.map(n => {
          const active = current === n.name;
          return (
            <TouchableOpacity key={n.name} style={[styles.navItem, active && { backgroundColor: C.primary + '22' }]} onPress={() => router.replace(`/(patient)/${n.name}`)}>
              <Ionicons name={n.icon} size={22} color={n.name === 'emergency' ? (active ? '#E74C3C' : C.subtext) : (active ? C.primary : C.subtext)} />
              <Text style={[styles.navLabel, { color: n.name === 'emergency' ? (active ? '#E74C3C' : C.subtext) : (active ? C.primary : C.subtext), fontWeight: active ? '700' : '500' }]}>{n.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 220, paddingTop: 40, paddingHorizontal: 16, borderRightWidth: 1 },
  brand: { fontSize: 18, fontWeight: '800', marginBottom: 32, paddingHorizontal: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  navLabel: { fontSize: 15 },
  content: { flex: 1 },
});
