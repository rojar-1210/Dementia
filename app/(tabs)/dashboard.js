import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getReminders, getAppointments } from '../../services/firestoreService';
import { logOut } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { format } from 'date-fns';

const QuickCard = ({ emoji, label, color, onPress }) => (
  <TouchableOpacity style={[styles.quickCard, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.quickEmoji}>{emoji}</Text>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    const [r, a] = await Promise.all([getReminders(user.uid), getAppointments(user.uid)]);
    setReminders(r.slice(0, 3));
    setAppointments(a.slice(0, 2));
  };

  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity onPress={logOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={28} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickCard emoji="⏰" label="Reminders" color="#EAF2FF" onPress={() => router.push('/(tabs)/reminders')} />
        <QuickCard emoji="📅" label="Appointments" color="#FFF3E0" onPress={() => router.push('/(tabs)/appointments')} />
        <QuickCard emoji="🆘" label="Emergency" color="#FFEBEE" onPress={() => router.push('/(tabs)/emergency')} />
        <QuickCard emoji="🧩" label="Activities" color="#E8F5E9" onPress={() => router.push('/(tabs)/activities')} />
      </View>

      {/* Today's Reminders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Reminders</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/reminders')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {reminders.length === 0 ? (
        <Text style={styles.empty}>No reminders set</Text>
      ) : (
        reminders.map((r) => (
          <View key={r.id} style={styles.reminderCard}>
            <Text style={styles.reminderEmoji}>{REMINDER_EMOJI[r.type] || '🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>{r.title}</Text>
              <Text style={styles.reminderTime}>{r.time}</Text>
            </View>
          </View>
        ))
      )}

      {/* Upcoming Appointments */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {appointments.length === 0 ? (
        <Text style={styles.empty}>No upcoming appointments</Text>
      ) : (
        appointments.map((a) => (
          <View key={a.id} style={styles.apptCard}>
            <Ionicons name="medical" size={28} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.reminderTitle}>{a.title}</Text>
              <Text style={styles.reminderTime}>{a.date} • {a.doctor}</Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const REMINDER_EMOJI = { medication: '💊', water: '💧', food: '🍽️', sleep: '😴', exercise: '🏃' };

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    paddingTop: 56,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  greeting: { fontSize: FONTS.medium, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  date: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: { padding: SPACING.xs, marginTop: 4 },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.lg, marginTop: SPACING.md },
  seeAll: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.lg },
  quickCard: {
    width: '47%',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  quickEmoji: { fontSize: 40, marginBottom: SPACING.xs },
  quickLabel: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    elevation: 1,
  },
  reminderEmoji: { fontSize: 30, marginRight: SPACING.sm },
  reminderTitle: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  reminderTime: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    elevation: 1,
  },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
});
