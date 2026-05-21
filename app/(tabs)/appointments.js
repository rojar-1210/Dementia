import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addAppointment, getAppointments, deleteAppointment } from '../../services/firestoreService';
import { scheduleReminder } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const getMonth = (d) => { if (!d) return ''; const m = parseInt(d.split('-')[1], 10); return MONTHS[m-1] || ''; };
const SPECIALTIES = ['General', 'Neurologist', 'Cardiologist', 'Psychiatrist', 'Physiotherapist', 'Other'];

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [specialty, setSpecialty] = useState('General');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('Upcoming');

  const load = async () => { if (!user) return; try { setAppointments(await getAppointments(user.uid)); } catch (_) {} };

  useEffect(() => { load(); }, []);

  const reset = () => { setTitle(''); setDoctor(''); setDate(''); setTime(''); setSpecialty('General'); setNotes(''); };

  const handleAdd = async () => {
    if (!title.trim() || !doctor.trim() || !date.trim()) return Alert.alert('Error', 'Title, doctor and date are required');
    try {
      await addAppointment(user.uid, { title: title.trim(), doctor: doctor.trim(), date, time, specialty, notes: notes.trim() });
      if (time) {
        const [h, m] = time.split(':').map(Number);
        const trigger = new Date(date);
        trigger.setHours(h || 9, m || 0, 0, 0);
        if (trigger > new Date()) await scheduleReminder(`📅 ${title}`, `Appointment with ${doctor} today!`, trigger);
      }
      setModal(false); reset(); load();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id) =>
    Alert.alert('Delete Appointment', 'Remove this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAppointment(id); load(); } },
    ]);

  const today = new Date().toISOString().split('T')[0];
  const filtered = filter === 'Upcoming'
    ? appointments.filter(a => a.date >= today)
    : appointments.filter(a => a.date < today);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📅 Appointments</Text>
          <Text style={styles.headerSub}>{appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {['Upcoming', 'Past'].map(f => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 60 }}>📅</Text>
            <Text style={styles.emptyTitle}>No {filter.toLowerCase()} appointments</Text>
            <Text style={styles.emptySub}>Tap + to book one</Text>
          </View>
        )}
        {filtered.map(a => (
          <View key={a.id} style={styles.card}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{a.date?.split('-')[2] || '--'}</Text>
              <Text style={styles.dateMon}>{getMonth(a.date)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardSub}>👨⚕️ {a.doctor}</Text>
              {a.time ? <Text style={styles.cardSub}>🕐 {a.time}</Text> : null}
              <View style={styles.specialtyPill}>
                <Text style={styles.specialtyText}>{a.specialty || 'General'}</Text>
              </View>
              {a.notes ? <Text style={styles.cardNotes}>📝 {a.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleDelete(a.id)} style={{ padding: SPACING.xs }}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); reset(); }}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modalBox} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => { setModal(false); reset(); }}>
                <Ionicons name="close-circle" size={30} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Appointment Title *', placeholder: 'e.g. Brain Checkup', value: title, set: setTitle },
              { label: 'Doctor Name *', placeholder: 'e.g. Dr. Smith', value: doctor, set: setDoctor },
              { label: 'Date * (YYYY-MM-DD)', placeholder: '2025-08-15', value: date, set: setDate, keyboard: 'numbers-and-punctuation' },
              { label: 'Time (HH:MM)', placeholder: '10:30', value: time, set: setTime, keyboard: 'numbers-and-punctuation' },
              { label: 'Notes', placeholder: 'Any special instructions...', value: notes, set: setNotes },
            ].map((f, i) => (
              <View key={i}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={COLORS.subtext} value={f.value} onChangeText={f.set} keyboardType={f.keyboard || 'default'} />
              </View>
            ))}

            <Text style={styles.label}>Specialty</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {SPECIALTIES.map(s => (
                <TouchableOpacity key={s} style={[styles.specBtn, specialty === s && styles.specBtnActive]} onPress={() => setSpecialty(s)}>
                  <Text style={[styles.specText, specialty === s && { color: COLORS.primary, fontWeight: '700' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModal(false); reset(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Ionicons name="calendar" size={20} color={COLORS.white} />
                <Text style={styles.saveText}>Book</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.sm },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, padding: SPACING.sm },
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginVertical: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 4, elevation: 1 },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.subtext },
  tabTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text, marginTop: SPACING.sm },
  emptySub: { fontSize: FONTS.medium, color: COLORS.subtext, marginTop: SPACING.xs },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2 },
  dateBox: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  dateDay: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  dateMon: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  cardTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  cardNotes: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 4, fontStyle: 'italic' },
  specialtyPill: { alignSelf: 'flex-start', backgroundColor: '#EAF2FF', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: SPACING.xs },
  specialtyText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  label: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border },
  specBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.xs },
  specBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  specText: { fontSize: FONTS.small, color: COLORS.subtext },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  saveBtn: { flex: 1.5, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
