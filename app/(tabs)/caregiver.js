import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  getAllPatients, getActivityLogs,
  getPatientReminders, addPatientReminder, deletePatientReminder,
  getPatientAppointments, addPatientAppointment, deletePatientAppointment,
} from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const TABS = ['Overview', 'Reminders', 'Appointments'];
const REMINDER_TYPES = [
  { key: 'medication', label: 'Medication', emoji: '💊' },
  { key: 'water', label: 'Water', emoji: '💧' },
  { key: 'food', label: 'Meal', emoji: '🍽️' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
];

export default function CaregiverScreen() {
  const { user, profile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [logs, setLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Reminder modal state
  const [rModal, setRModal] = useState(false);
  const [rTitle, setRTitle] = useState('');
  const [rTime, setRTime] = useState('08:00');
  const [rType, setRType] = useState('medication');

  // Appointment modal state
  const [aModal, setAModal] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aDoctor, setADoctor] = useState('');
  const [aDate, setADate] = useState('');
  const [aTime, setATime] = useState('');
  const [aNotes, setANotes] = useState('');

  const loadPatients = async () => { try { setPatients(await getAllPatients()); } catch (_) {} };

  const loadPatientData = async (p) => {
    if (!p) return;
    try {
      const [l, r, a] = await Promise.all([getActivityLogs(p.uid), getPatientReminders(p.uid), getPatientAppointments(p.uid)]);
      setLogs(l); setReminders(r); setAppointments(a);
    } catch (_) {}
  };

  useEffect(() => { loadPatients(); }, []);
  useEffect(() => { loadPatientData(selectedPatient); }, [selectedPatient]);

  const onRefresh = async () => { setRefreshing(true); await loadPatients(); await loadPatientData(selectedPatient); setRefreshing(false); };

  const selectPatient = (p) => { setSelectedPatient(p); setTab('Overview'); };

  const addReminder = async () => {
    if (!rTitle.trim()) return Alert.alert('Error', 'Enter a reminder title');
    await addPatientReminder(selectedPatient.uid, { title: rTitle.trim(), time: rTime, type: rType, repeat: 'Daily' }, user.uid);
    setRModal(false); setRTitle(''); setRTime('08:00'); setRType('medication');
    loadPatientData(selectedPatient);
  };

  const addAppointment = async () => {
    if (!aTitle.trim() || !aDoctor.trim() || !aDate.trim()) return Alert.alert('Error', 'Title, doctor and date are required');
    await addPatientAppointment(selectedPatient.uid, { title: aTitle.trim(), doctor: aDoctor.trim(), date: aDate, time: aTime, notes: aNotes.trim() }, user.uid);
    setAModal(false); setATitle(''); setADoctor(''); setADate(''); setATime(''); setANotes('');
    loadPatientData(selectedPatient);
  };

  if (profile?.role !== 'caregiver') {
    return (
      <View style={styles.restricted}>
        <Text style={{ fontSize: 64 }}>🔒</Text>
        <Text style={styles.restrictedTitle}>Caregiver Only</Text>
        <Text style={styles.restrictedSub}>This panel is only accessible to caregivers.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍⚕️ Caregiver Panel</Text>
        <Text style={styles.headerSub}>Welcome, {profile?.name || 'Caregiver'}</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        {/* Patient Selector */}
        <Text style={styles.sectionTitle}>Your Patients ({patients.length})</Text>
        {patients.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48 }}>👤</Text>
            <Text style={styles.emptyText}>No patients found in the system</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientScroll}>
          {patients.map(p => (
            <TouchableOpacity key={p.id} style={[styles.patientChip, selectedPatient?.id === p.id && styles.patientChipActive]} onPress={() => selectPatient(p)}>
              <View style={[styles.avatar, selectedPatient?.id === p.id && { backgroundColor: COLORS.white }]}>
                <Text style={[styles.avatarText, selectedPatient?.id === p.id && { color: COLORS.primary }]}>{p.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={[styles.chipName, selectedPatient?.id === p.id && { color: COLORS.white }]}>{p.name}</Text>
              {p.location && <Ionicons name="location" size={14} color={selectedPatient?.id === p.id ? COLORS.white : COLORS.success} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Patient Detail */}
        {selectedPatient && (
          <View style={styles.detailSection}>
            {/* Patient Info Card */}
            <View style={styles.patientInfoCard}>
              <View style={styles.patientInfoLeft}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>{selectedPatient.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{selectedPatient.name}</Text>
                  <Text style={styles.patientEmail}>{selectedPatient.email}</Text>
                  {selectedPatient.location && (
                    <Text style={styles.locationText}>📍 {selectedPatient.location.lat?.toFixed(3)}, {selectedPatient.location.lng?.toFixed(3)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.patientActions}>
                <TouchableOpacity style={styles.actionIcon} onPress={() => Linking.openURL(`tel:${selectedPatient.phone || ''}`)}>
                  <Ionicons name="call" size={22} color={COLORS.success} />
                </TouchableOpacity>
                {selectedPatient.location && (
                  <TouchableOpacity style={styles.actionIcon} onPress={() => Linking.openURL(`https://maps.google.com/?q=${selectedPatient.location.lat},${selectedPatient.location.lng}`)}>
                    <Ionicons name="map" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {TABS.map(t => (
                <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Overview Tab */}
            {tab === 'Overview' && (
              <View>
                <View style={styles.statsRow}>
                  {[
                    { num: reminders.length, label: 'Reminders', color: '#EAF2FF', icon: '⏰' },
                    { num: appointments.length, label: 'Appointments', color: '#FFF3E0', icon: '📅' },
                    { num: logs.length, label: 'Activities', color: '#E8F5E9', icon: '✅' },
                  ].map((s, i) => (
                    <View key={i} style={[styles.statCard, { backgroundColor: s.color }]}>
                      <Text style={{ fontSize: 28 }}>{s.icon}</Text>
                      <Text style={styles.statNum}>{s.num}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.subTitle}>Recent Activity</Text>
                {logs.length === 0 && <Text style={styles.emptyText}>No activity recorded yet.</Text>}
                {logs.slice(0, 5).map(log => (
                  <View key={log.id} style={styles.logCard}>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                      <Text style={styles.logActivity}>{log.activity}</Text>
                      <Text style={styles.logTime}>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Reminders Tab */}
            {tab === 'Reminders' && (
              <View>
                <TouchableOpacity style={styles.addRowBtn} onPress={() => setRModal(true)}>
                  <Ionicons name="add-circle" size={22} color={COLORS.white} />
                  <Text style={styles.addRowBtnText}>Add Reminder for {selectedPatient.name}</Text>
                </TouchableOpacity>
                {reminders.length === 0 && <Text style={styles.emptyText}>No reminders set for this patient.</Text>}
                {reminders.map(r => {
                  const t = REMINDER_TYPES.find(x => x.key === r.type);
                  return (
                    <View key={r.id} style={styles.itemCard}>
                      <Text style={{ fontSize: 28, marginRight: SPACING.sm }}>{t?.emoji || '🔔'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{r.title}</Text>
                        <Text style={styles.itemSub}>🕐 {r.time}  •  {t?.label || r.type}</Text>
                      </View>
                      <TouchableOpacity onPress={async () => { await deletePatientReminder(r.id); loadPatientData(selectedPatient); }}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Appointments Tab */}
            {tab === 'Appointments' && (
              <View>
                <TouchableOpacity style={styles.addRowBtn} onPress={() => setAModal(true)}>
                  <Ionicons name="add-circle" size={22} color={COLORS.white} />
                  <Text style={styles.addRowBtnText}>Book Appointment for {selectedPatient.name}</Text>
                </TouchableOpacity>
                {appointments.length === 0 && <Text style={styles.emptyText}>No appointments booked.</Text>}
                {appointments.map(a => (
                  <View key={a.id} style={styles.itemCard}>
                    <View style={styles.apptDate}>
                      <Text style={styles.apptDay}>{a.date?.split('-')[2] || '--'}</Text>
                      <Text style={styles.apptMon}>{getMonth(a.date)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                      <Text style={styles.itemTitle}>{a.title}</Text>
                      <Text style={styles.itemSub}>👨‍⚕️ {a.doctor}{a.time ? `  •  🕐 ${a.time}` : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={async () => { await deletePatientAppointment(a.id); loadPatientData(selectedPatient); }}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={rModal} transparent animationType="slide" onRequestClose={() => setRModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => setRModal(false)}><Ionicons name="close-circle" size={28} color={COLORS.subtext} /></TouchableOpacity>
            </View>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Take Morning Pill" placeholderTextColor={COLORS.subtext} value={rTitle} onChangeText={setRTitle} />
            <Text style={styles.label}>Time</Text>
            <TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor={COLORS.subtext} value={rTime} onChangeText={setRTime} keyboardType="numbers-and-punctuation" />
            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {REMINDER_TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, rType === t.key && styles.typeBtnActive]} onPress={() => setRType(t.key)}>
                  <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, rType === t.key && { color: COLORS.primary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addReminder}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Appointment Modal */}
      <Modal visible={aModal} transparent animationType="slide" onRequestClose={() => setAModal(false)}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setAModal(false)}><Ionicons name="close-circle" size={28} color={COLORS.subtext} /></TouchableOpacity>
            </View>
            {[
              { label: 'Title *', placeholder: 'e.g. Brain Checkup', value: aTitle, set: setATitle },
              { label: 'Doctor *', placeholder: 'e.g. Dr. Smith', value: aDoctor, set: setADoctor },
              { label: 'Date * (YYYY-MM-DD)', placeholder: '2025-08-15', value: aDate, set: setADate },
              { label: 'Time (HH:MM)', placeholder: '10:30', value: aTime, set: setATime },
              { label: 'Notes', placeholder: 'Optional notes...', value: aNotes, set: setANotes },
            ].map((f, i) => (
              <View key={i}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={COLORS.subtext} value={f.value} onChangeText={f.set} />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addAppointment}><Text style={styles.saveText}>Book</Text></TouchableOpacity>
            </View>
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const getMonth = (d) => { if (!d) return ''; const m = parseInt(d.split('-')[1], 10); return MONTHS[m-1] || ''; };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  patientScroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
  patientChip: { alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.sm, minWidth: 90, borderWidth: 2, borderColor: COLORS.border, elevation: 1 },
  patientChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  avatarText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  chipName: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  detailSection: { paddingHorizontal: SPACING.lg },
  patientInfoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, elevation: 2 },
  patientInfoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarLargeText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  patientName: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.text },
  patientEmail: { fontSize: FONTS.small, color: COLORS.subtext },
  locationText: { fontSize: FONTS.small, color: COLORS.success, marginTop: 2 },
  patientActions: { gap: SPACING.sm },
  actionIcon: { backgroundColor: COLORS.background, borderRadius: RADIUS.full, padding: SPACING.sm },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.md, elevation: 1 },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.subtext },
  tabTextActive: { color: COLORS.white },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  subTitle: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.xs, elevation: 1 },
  logActivity: { fontSize: FONTS.medium, color: COLORS.text },
  logTime: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.xs },
  addRowBtnText: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.white, flex: 1 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2 },
  itemTitle: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  itemSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  apptDate: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  apptDay: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  apptMon: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  emptyBox: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: SPACING.xs },
  restricted: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.lg },
  restrictedTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  restrictedSub: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: SPACING.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  label: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border },
  typeBtn: { alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.sm, minWidth: 72 },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  typeLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 3 },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  saveBtn: { flex: 1.5, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
