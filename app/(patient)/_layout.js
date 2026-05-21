import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function PatientLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.subtext,
      tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 6, backgroundColor: COLORS.card, borderTopColor: COLORS.border },
      tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }} />
      <Tabs.Screen name="reminders" options={{ title: 'Reminders', tabBarIcon: ({ color }) => <Ionicons name="alarm" size={28} color={color} /> }} />
      <Tabs.Screen name="emergency" options={{ title: 'SOS', tabBarIcon: ({ color }) => <Ionicons name="warning" size={28} color={color} />, tabBarActiveTintColor: COLORS.danger }} />
      <Tabs.Screen name="games" options={{ title: 'Games', tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={28} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={28} color={color} /> }} />
    </Tabs>
  );
}
