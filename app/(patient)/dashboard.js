import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getReminders, getAppointments } from '../../services/firestoreService';
import { logOut } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { format } from 'date-fns';

const REMINDER_EMOJI = { medication: '💊', water: '💧', food: '🍽️', sleep: '😴', exercise: '🏃' };

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
};

export default function PatientDashboard() {
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

  const QUICK = [
    { emoji: '⏰', label: 'Reminders', color: '#EAF2FF', route: '/(patient)/reminders' },
    { emoji: '🆘', label: 'SOS', color: '#FFEBEE', route: '/(patient)/emergency' },
    { emoji: '🧩', label: 'Games', color: '#E8F5E9', route: '/(patient)/games' },
    { emoji: '🎥', label: 'Exercises', color: '#FFF3E0', route: '/(patient)/exercises' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{profile?.name || 'Patient'}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={async () => { await logOut(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out-outline" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* SOS Banner */}
      <TouchableOpacity style={styles.sosBanner} onPress={() => router.push('/(patient)/emergency')}>
        <Text style={styles.sosEmoji}>🆘</Text>
        <Text style={styles.sosText}>TAP FOR EMERGENCY HELP</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        {QUICK.map((q) => (
          <TouchableOpacity key={q.label} style={[styles.quickCard, { backgroundColor: q.color }]} onPress={() => router.push(q.route)}>
            <Text style={styles.quickEmoji}>{q.emoji}</Text>
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Reminders */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Today's Reminders</Text>
        <TouchableOpacity onPress={() => router.push('/(patient)/reminders')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>
      {reminders.length === 0
        ? <Text style={styles.empty}>No reminders set</Text>
        : reminders.map(r => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.cardEmoji}>{REMINDER_EMOJI[r.type] || '🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardSub}>{r.time}</Text>
            </View>
          </View>
        ))}

      {/* Upcoming Appointments */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        <TouchableOpacity onPress={() => router.push('/(patient)/appointments')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
      </View>
      {appointments.length === 0
        ? <Text style={styles.empty}>No upcoming appointments</Text>
        : appointments.map(a => (
          <View key={a.id} style={styles.card}>
            <Ionicons name="medical" size={28} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardSub}>{a.date} • {a.doctor}</Text>
            </View>
          </View>
        ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  greeting: { fontSize: FONTS.medium, color: 'rgba(255,255,255,0.85)' },
  name: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  date: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sosBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.sm },
  sosEmoji: { fontSize: 28 },
  sosText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white, letterSpacing: 1 },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.lg, marginTop: SPACING.md },
  seeAll: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.lg },
  quickCard: { width: '47%', borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', elevation: 2 },
  quickEmoji: { fontSize: 40, marginBottom: SPACING.xs },
  quickLabel: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 1 },
  cardEmoji: { fontSize: 30, marginRight: SPACING.sm },
  cardTitle: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
});
