import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllPatients, getActivityLogs } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function AlertsScreen() {
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const pts = await getAllPatients();
    setPatients(pts);
    const allLogs = [];
    for (const p of pts) {
      const l = await getActivityLogs(p.uid);
      allLogs.push(...l.map(log => ({ ...log, patientName: p.name })));
    }
    allLogs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    setLogs(allLogs.slice(0, 20));
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 SOS & Alerts</Text>
      </View>

      {/* Patient Location Cards */}
      <Text style={styles.sectionTitle}>Patient Locations</Text>
      {patients.length === 0 && <Text style={styles.empty}>No patients found.</Text>}
      {patients.map(p => (
        <View key={p.id} style={styles.locCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{p.name?.[0]?.toUpperCase() || '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{p.name}</Text>
            {p.location
              ? <Text style={styles.locText}>📍 {p.location.lat?.toFixed(4)}, {p.location.lng?.toFixed(4)}</Text>
              : <Text style={styles.noLoc}>📍 Location not available</Text>}
            {p.location?.updatedAt && <Text style={styles.locTime}>Updated: {new Date(p.location.updatedAt).toLocaleTimeString()}</Text>}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => p.phone && Linking.openURL(`tel:${p.phone}`)}>
              <Ionicons name="call" size={26} color={COLORS.success} />
            </TouchableOpacity>
            {p.location && (
              <TouchableOpacity style={{ marginTop: 8 }} onPress={() => Linking.openURL(`https://maps.google.com/?q=${p.location.lat},${p.location.lng}`)}>
                <Ionicons name="navigate" size={26} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Alert History */}
      <Text style={styles.sectionTitle}>Activity & Alert History</Text>
      {logs.length === 0 && <Text style={styles.empty}>No activity recorded.</Text>}
      {logs.map(log => (
        <View key={log.id} style={styles.logCard}>
          <Ionicons
            name={log.activity?.includes('SOS') ? 'warning' : 'checkmark-circle'}
            size={24}
            color={log.activity?.includes('SOS') ? COLORS.danger : COLORS.success}
          />
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={styles.logPatient}>{log.patientName}</Text>
            <Text style={styles.logActivity}>{log.activity}</Text>
            <Text style={styles.logTime}>
              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recently'}
            </Text>
          </View>
        </View>
      ))}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.danger, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  locCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  patientName: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  locText: { fontSize: FONTS.small, color: COLORS.success, marginTop: 2 },
  noLoc: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  locTime: { fontSize: 12, color: COLORS.subtext },
  actions: { alignItems: 'center' },
  logCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, marginBottom: SPACING.xs, borderRadius: RADIUS.sm, padding: SPACING.md, elevation: 1 },
  logPatient: { fontSize: FONTS.small, fontWeight: '700', color: COLORS.primary },
  logActivity: { fontSize: FONTS.medium, color: COLORS.text },
  logTime: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
});
