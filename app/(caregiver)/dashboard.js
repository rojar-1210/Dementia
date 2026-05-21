import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getAllPatients, getActivityLogs } from '../../services/firestoreService';
import { logOut } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { format } from 'date-fns';

export default function CaregiverDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const pts = await getAllPatients();
    setPatients(pts);
    if (pts.length > 0) {
      const logs = await getActivityLogs(pts[0].uid);
      setRecentLogs(logs.slice(0, 5));
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const STATS = [
    { label: 'Patients', value: patients.length, emoji: '👥', color: '#EAF2FF' },
    { label: 'Active', value: patients.filter(p => p.location).length, emoji: '📍', color: '#E8F5E9' },
    { label: 'Alerts', value: 0, emoji: '🔔', color: '#FFF3E0' },
    { label: 'Today', value: recentLogs.length, emoji: '📋', color: '#F3E5F5' },
  ];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Caregiver Panel 👨⚕️</Text>
          <Text style={styles.name}>{profile?.name || 'Caregiver'}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity onPress={async () => { await logOut(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out-outline" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {STATS.map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.color }]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(caregiver)/patients')}>
          <Ionicons name="people" size={28} color={COLORS.primary} />
          <Text style={styles.quickLabel}>View Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(caregiver)/alerts')}>
          <Ionicons name="notifications" size={28} color={COLORS.danger} />
          <Text style={styles.quickLabel}>SOS Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Patients Overview */}
      <Text style={styles.sectionTitle}>Patients Overview</Text>
      {patients.length === 0 && <Text style={styles.empty}>No patients registered yet.</Text>}
      {patients.map(p => (
        <View key={p.id} style={styles.patientCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{p.name?.[0]?.toUpperCase() || '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{p.name}</Text>
            <Text style={styles.patientEmail}>{p.email}</Text>
            {p.location
              ? <Text style={styles.locationText}>📍 Location available</Text>
              : <Text style={styles.noLocation}>📍 No location data</Text>}
          </View>
          <View style={styles.patientActions}>
            <TouchableOpacity onPress={() => p.phone && Linking.openURL(`tel:${p.phone}`)}>
              <Ionicons name="call" size={26} color={COLORS.success} />
            </TouchableOpacity>
            {p.location && (
              <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${p.location.lat},${p.location.lng}`)}>
                <Ionicons name="map" size={26} color={COLORS.primary} style={{ marginTop: 8 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentLogs.length === 0 && <Text style={styles.empty}>No recent activity.</Text>}
      {recentLogs.map(log => (
        <View key={log.id} style={styles.logCard}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={styles.logText}>{log.activity}</Text>
            <Text style={styles.logTime}>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recently'}</Text>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { width: '47%', borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', elevation: 2 },
  statEmoji: { fontSize: 32, marginBottom: 4 },
  statValue: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: FONTS.small, color: COLORS.subtext },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  quickRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.md },
  quickBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', elevation: 2, gap: SPACING.xs },
  quickLabel: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  patientName: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  patientEmail: { fontSize: FONTS.small, color: COLORS.subtext },
  locationText: { fontSize: FONTS.small, color: COLORS.success, marginTop: 2 },
  noLocation: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  patientActions: { alignItems: 'center' },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.xs, borderRadius: RADIUS.sm, padding: SPACING.md, elevation: 1 },
  logText: { fontSize: FONTS.medium, color: COLORS.text },
  logTime: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
});
