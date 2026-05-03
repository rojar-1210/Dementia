import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { getActivityLogs } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function CaregiverScreen() {
  const { user, profile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'patient'));
    const snap = await getDocs(q);
    setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const loadLogs = async (uid) => {
    const data = await getActivityLogs(uid);
    setLogs(data);
  };

  useEffect(() => { loadPatients(); }, []);

  useEffect(() => {
    if (selectedPatient) loadLogs(selectedPatient.uid);
  }, [selectedPatient]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    if (selectedPatient) await loadLogs(selectedPatient.uid);
    setRefreshing(false);
  };

  if (profile?.role !== 'caregiver') {
    return (
      <View style={styles.restricted}>
        <Text style={styles.restrictedEmoji}>🔒</Text>
        <Text style={styles.restrictedText}>This panel is for caregivers only.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨⚕️ Caregiver Panel</Text>
      </View>

      {/* Patients List */}
      <Text style={styles.sectionTitle}>Your Patients</Text>
      {patients.length === 0 && (
        <Text style={styles.empty}>No patients found in the system.</Text>
      )}
      {patients.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={[styles.patientCard, selectedPatient?.id === p.id && styles.patientCardActive]}
          onPress={() => setSelectedPatient(p)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{p.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{p.name}</Text>
            <Text style={styles.patientEmail}>{p.email}</Text>
            {p.location && (
              <Text style={styles.locationText}>
                📍 {p.location.lat?.toFixed(4)}, {p.location.lng?.toFixed(4)}
              </Text>
            )}
          </View>
          <View style={styles.patientActions}>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${p.phone || ''}`)}>
              <Ionicons name="call" size={26} color={COLORS.success} />
            </TouchableOpacity>
            {p.location && (
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(`https://maps.google.com/?q=${p.location.lat},${p.location.lng}`)
                }
              >
                <Ionicons name="map" size={26} color={COLORS.primary} style={{ marginTop: 8 }} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Activity Logs */}
      {selectedPatient && (
        <>
          <Text style={styles.sectionTitle}>Activity Log — {selectedPatient.name}</Text>
          {logs.length === 0 && <Text style={styles.empty}>No activity recorded yet.</Text>}
          {logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.logActivity}>{log.activity}</Text>
                <Text style={styles.logTime}>
                  {log.timestamp?.toDate
                    ? log.timestamp.toDate().toLocaleString()
                    : 'Just now'}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, padding: SPACING.lg, paddingBottom: SPACING.sm },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  patientCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.md,
    padding: SPACING.md, elevation: 2, borderWidth: 2, borderColor: 'transparent',
  },
  patientCardActive: { borderColor: COLORS.primary },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  patientName: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  patientEmail: { fontSize: FONTS.small, color: COLORS.subtext },
  locationText: { fontSize: FONTS.small, color: COLORS.success, marginTop: 2 },
  patientActions: { alignItems: 'center' },
  logCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.xs, borderRadius: RADIUS.sm,
    padding: SPACING.md, elevation: 1,
  },
  logActivity: { fontSize: FONTS.medium, color: COLORS.text },
  logTime: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  restricted: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  restrictedEmoji: { fontSize: 64, marginBottom: SPACING.md },
  restrictedText: { fontSize: FONTS.large, color: COLORS.subtext, textAlign: 'center' },
});
