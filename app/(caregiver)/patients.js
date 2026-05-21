import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getAllPatients, getPatientReminders, addPatientReminder, deletePatientReminder, getPatientAppointments, addPatientAppointment, deletePatientAppointment } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const TABS = ['Reminders', 'Appointments'];
const TYPES = [
  { key: 'medication', label: 'Medicine', emoji: '💊' },
  { key: 'water', label: 'Water', emoji: '💧' },
  { key: 'food', label: 'Meal', emoji: '🍽️' },
];

export default function PatientsScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('Reminders');
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [type, setType] = useState('medication');

  useEffect(() => { getAllPatients().then(setPatients); }, []);

  useEffect(() => {
    if (!selected) return;
    getPatientReminders(selected.uid).then(setReminders);
    getPatientAppointments(selected.uid).then(setAppointments);
  }, [selected]);

  const addItem = async () => {
    if (!selected) return;
    if (tab === 'Reminders') {
      if (!form.title || !form.time) return Alert.alert('Error', 'Fill all fields');
      await addPatientReminder(selected.uid, { ...form, type }, user.uid);
      getPatientReminders(selected.uid).then(setReminders);
    } else {
      if (!form.title || !form.doctor || !form.date) return Alert.alert('Error', 'Fill all fields');
      await addPatientAppointment(selected.uid, form, user.uid);
      getPatientAppointments(selected.uid).then(setAppointments);
    }
    setModal(false); setForm({});
  };

  if (!selected) return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>👥 Patients</Text></View>
      <ScrollView contentContainerStyle={styles.list}>
        {patients.length === 0 && <Text style={styles.empty}>No patients registered yet.</Text>}
        {patients.map(p => (
          <TouchableOpacity key={p.id} style={styles.patientCard} onPress={() => setSelected(p)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{p.name?.[0]?.toUpperCase() || '?'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{p.name}</Text>
              <Text style={styles.patientEmail}>{p.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.subtext} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const data = tab === 'Reminders' ? reminders : appointments;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelected(null)}>
          <Ionicons name="arrow-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selected.name}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {data.length === 0 && <Text style={styles.empty}>No {tab.toLowerCase()} set.</Text>}
        {data.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemEmoji}>{tab === 'Reminders' ? (TYPES.find(t => t.key === item.type)?.emoji || '🔔') : '📅'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{tab === 'Reminders' ? item.time : `${item.date} • ${item.doctor}`}</Text>
            </View>
            <TouchableOpacity onPress={async () => {
              if (tab === 'Reminders') { await deletePatientReminder(item.id); getPatientReminders(selected.uid).then(setReminders); }
              else { await deletePatientAppointment(item.id); getPatientAppointments(selected.uid).then(setAppointments); }
            }}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add {tab === 'Reminders' ? 'Reminder' : 'Appointment'}</Text>
            {tab === 'Reminders' ? (
              <>
                <TextInput style={styles.input} placeholder="Title" placeholderTextColor={COLORS.subtext} value={form.title || ''} onChangeText={v => setForm({ ...form, title: v })} />
                <TextInput style={styles.input} placeholder="Time (HH:MM)" placeholderTextColor={COLORS.subtext} value={form.time || ''} onChangeText={v => setForm({ ...form, time: v })} />
                <TextInput style={styles.input} placeholder="Dosage (optional)" placeholderTextColor={COLORS.subtext} value={form.dosage || ''} onChangeText={v => setForm({ ...form, dosage: v })} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                  {TYPES.map(t => (
                    <TouchableOpacity key={t.key} style={[styles.typeBtn, type === t.key && styles.typeBtnActive]} onPress={() => setType(t.key)}>
                      <Text style={styles.typeEmoji}>{t.emoji}</Text>
                      <Text style={[styles.typeLabel, type === t.key && { color: COLORS.primary }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Title *" placeholderTextColor={COLORS.subtext} value={form.title || ''} onChangeText={v => setForm({ ...form, title: v })} />
                <TextInput style={styles.input} placeholder="Doctor *" placeholderTextColor={COLORS.subtext} value={form.doctor || ''} onChangeText={v => setForm({ ...form, doctor: v })} />
                <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD) *" placeholderTextColor={COLORS.subtext} value={form.date || ''} onChangeText={v => setForm({ ...form, date: v })} />
                <TextInput style={styles.input} placeholder="Notes" placeholderTextColor={COLORS.subtext} value={form.notes || ''} onChangeText={v => setForm({ ...form, notes: v })} />
              </>
            )}
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addItem}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white, flex: 1, marginLeft: SPACING.sm },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, padding: SPACING.xs },
  list: { padding: SPACING.lg },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: SPACING.xl },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  patientName: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  patientEmail: { fontSize: FONTS.small, color: COLORS.subtext },
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 4 },
  tabBtn: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 1 },
  itemEmoji: { fontSize: 32, marginRight: SPACING.sm },
  itemTitle: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  itemSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  typeBtn: { alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.sm, minWidth: 72 },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  typeEmoji: { fontSize: 28 },
  typeLabel: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },
  modalRow: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext },
  saveBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
