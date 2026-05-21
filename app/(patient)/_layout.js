import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, Slot, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const NAV = [
  { name: 'dashboard', label: 'Home', icon: 'home' },
  { name: 'reminders', label: 'Reminders', icon: 'alarm' },
  { name: 'emergency', label: 'SOS', icon: 'warning' },
  { name: 'games', label: 'Games', icon: 'game-controller' },
  { name: 'settings', label: 'Settings', icon: 'settings' },
];

export default function PatientLayout() {
  const router = useRouter();
  const segments = useSegments();
  const current = segments[segments.length - 1];

  if (Platform.OS !== 'web') {
    return (
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 6, backgroundColor: COLORS.card, borderTopColor: COLORS.border },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}>
        {NAV.map(n => (
          <Tabs.Screen
            key={n.name}
            name={n.name}
            options={{
              title: n.label,
              tabBarIcon: ({ color }) => <Ionicons name={n.icon} size={28} color={color} />,
              tabBarActiveTintColor: n.name === 'emergency' ? COLORS.danger : COLORS.primary,
            }}
          />
        ))}
      </Tabs>
    );
  }

  // Web: sidebar layout
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>🧠 Memory Care</Text>
        {NAV.map(n => {
          const active = current === n.name;
          const isEmergency = n.name === 'emergency';
          const color = isEmergency
            ? (active ? COLORS.danger : COLORS.subtext)
            : (active ? COLORS.primary : COLORS.subtext);
          return (
            <TouchableOpacity
              key={n.name}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.replace(`/(patient)/${n.name}`)}
            >
              <Ionicons name={n.icon} size={22} color={color} />
              <Text style={[styles.navLabel, { color, fontWeight: active ? '700' : '500' }]}>
                {n.label}
              </Text>
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
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.background },
  sidebar: {
    width: 220, paddingTop: 40, paddingHorizontal: 16,
    backgroundColor: COLORS.card, borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  brand: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 32, paddingHorizontal: 8 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
  },
  navItemActive: { backgroundColor: COLORS.primary + '18' },
  navLabel: { fontSize: 15 },
  content: { flex: 1 },
});
