import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

const TAB_ICON_SIZE = 28;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <Ionicons name="alarm" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color }) => <Ionicons name="warning" size={TAB_ICON_SIZE} color={color} />,
          tabBarActiveTintColor: COLORS.danger,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="caregiver"
        options={{
          title: 'Caregiver',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}
