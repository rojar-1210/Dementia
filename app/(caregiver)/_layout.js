import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function CaregiverLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.subtext,
      tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 6, backgroundColor: COLORS.card, borderTopColor: COLORS.border },
      tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid" size={28} color={color} /> }} />
      <Tabs.Screen name="patients" options={{ title: 'Patients', tabBarIcon: ({ color }) => <Ionicons name="people" size={28} color={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: ({ color }) => <Ionicons name="notifications" size={28} color={color} />, tabBarActiveTintColor: COLORS.danger }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={28} color={color} /> }} />
    </Tabs>
  );
}
