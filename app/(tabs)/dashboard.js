import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Animated, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getReminders, getAppointments, getActivityLogs } from '../../services/firestoreService';
import { logOut } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { format } from 'date-fns';
import NotificationDebug from '../../components/NotificationDebug';

const REMINDER_EMOJI = { medication: '💊', water: '💧', food: '🍽️', sleep: '😴', exercise: '🏃' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const getMonth = (d) => { if (!d) return ''; const m = parseInt(d.split('-')[1], 10); return MONTHS[m-1] || ''; };
const getTimeOfDay = () => { const h = new Date().getHours(); if (h < 12) return 'Morning'; if (h < 17) return 'Afternoon'; return 'Evening'; };

const TIPS = [
  '💧 Drink at least 8 glasses of water today.',
  '🚶 A short walk improves memory and mood.',
  '😴 Good sleep helps the brain stay sharp.',
  '🧩 Brain games keep your mind active.',
  '🍎 Eat fruits and vegetables every day.',
];

export default function DashboardScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [debugModal, setDebugModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    if (!user) return;
    try {
      const [r, a, logs] = await Promise.all([
        getReminders(user.uid),
        getAppointments(user.uid),
        getActivityLogs(user.uid),
      ]);
      setReminders(r.slice(0, 3));
      setAppointments(a.slice(0, 2));
      const today = new Date().toDateString();
      setCompletedToday(logs.filter(l => l.timestamp?.toDate?.()?.toDateString() === today).length);
    } catch (_) {}
  };

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
            <Text style={styles.name}>{profile?.name || 'User'}</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
            <TouchableOpacity onPress={() => setDebugModal(true)} style={styles.debugBtn}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logOut} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={26} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.statsRow}>
          {[
            { num: reminders.length, label: 'Reminder' + (reminders.length !== 1 ? 's' : '') },
            { num: appointments.length, label: 'Appointment' + (appointments.length !== 1 ? 's' : '') },
            { num: completedToday, label: 'Done Today' },
          ].map((s, i) => (
            <View key={i} style={styles.statBox}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statContent}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {[
            { emoji: '⏰', label: 'Reminders', color: '#EAF2FF', route: '/(tabs)/reminders', badge: reminders.length },
            { emoji: '📅', label: 'Appointments', color: '#FFF3E0', route: '/(tabs)/appointments', badge: appointments.length },
            { emoji: '🆘', label: 'Emergency', color: '#FFEBEE', route: '/(tabs)/emergency' },
            { emoji: '🧩', label: 'Activities', color: '#E8F5E9', route: '/(tabs)/activities' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={[styles.quickCard, { backgroundColor: item.color }]} onPress={() => router.push(item.route)} activeOpacity={0.8}>
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
              {item.badge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Reminders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Reminders</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/reminders')}><Text style={styles.seeAll}>See All →</Text></TouchableOpacity>
        </View>
        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyText}>No reminders set</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/reminders')}>
              <Text style={styles.emptyBtnText}>+ Add Reminder</Text>
            </TouchableOpacity>
          </View>
        ) : reminders.map((r) => (
          <View key={r.id} style={styles.reminderCard}>
            <View style={[styles.iconBox, { backgroundColor: '#EAF2FF' }]}>
              <Text style={{ fontSize: 26 }}>{REMINDER_EMOJI[r.type] || '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardSub}>🕐 {r.displayTime || r.time} • {r.type}</Text>
            </View>
            <View style={styles.typePill}><Text style={styles.typePillText}>{r.repeat || 'Daily'}</Text></View>
          </View>
        ))}

        {/* Upcoming Appointments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}><Text style={styles.seeAll}>See All →</Text></TouchableOpacity>
        </View>
        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/appointments')}>
              <Text style={styles.emptyBtnText}>+ Book Appointment</Text>
            </TouchableOpacity>
          </View>
        ) : appointments.map((a) => (
          <View key={a.id} style={styles.apptCard}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{a.date?.split('-')[2] || '--'}</Text>
              <Text style={styles.dateMon}>{getMonth(a.date)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardSub}>👨‍⚕️ {a.doctor}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
          </View>
        ))}

        {/* Health Tip */}
        <View style={styles.tipCard}>
          <Text style={{ fontSize: 30, marginRight: SPACING.sm }}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Daily Health Tip</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        </View>
      </Animated.View>
      <View style={{ height: 100 }} />

      {/* Debug Modal */}
      <Modal visible={debugModal} animationType="slide" onRequestClose={() => setDebugModal(false)}>
        <NotificationDebug />
        <TouchableOpacity style={styles.closeDebugBtn} onPress={() => setDebugModal(false)}>
          <Ionicons name="close-circle" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  greeting: { fontSize: FONTS.medium, color: 'rgba(255,255,255,0.85)' },
  name: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  date: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  debugBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, padding: SPACING.sm },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, padding: SPACING.sm },
  closeDebugBtn: { position: 'absolute', top: 56, right: SPACING.lg, backgroundColor: COLORS.danger, borderRadius: RADIUS.full, padding: SPACING.xs },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, padding: SPACING.md },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)', marginRight: SPACING.sm },
  statContent: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.lg, marginTop: SPACING.md },
  seeAll: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.lg },
  quickCard: { width: '47%', borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  quickEmoji: { fontSize: 44, marginBottom: SPACING.xs },
  quickLabel: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, borderRadius: RADIUS.full, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.white },
  reminderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  apptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2 },
  iconBox: { width: 52, height: 52, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  cardTitle: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2, textTransform: 'capitalize' },
  typePill: { backgroundColor: '#EAF2FF', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  typePillText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  dateBox: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  dateDay: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  dateMon: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  emptyCard: { backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', elevation: 1 },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.xs },
  emptyText: { fontSize: FONTS.medium, color: COLORS.subtext, marginBottom: SPACING.sm },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs },
  emptyBtnText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: '600' },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDE7', marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 1, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  tipTitle: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text },
  tipText: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
});
