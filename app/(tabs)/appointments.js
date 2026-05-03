import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addAppointment, getAppointments, deleteAppointment } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => setAppointments(await getAppointments(user.uid));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!title || !doctor || !date) return Alert.alert('Error', 'Fill required fields');
    await addAppointment(user.uid, { title, doctor, date, notes });
    setModal(false);
    setTitle(''); setDoctor(''); setDate(''); setNotes('');
    load();
  };

  const handleDelete = (id) =>
    Alert.alert('Delete', 'Remove this appointment?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAppointment(id); load(); } },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {appointments.length === 0 && (
          <Text style={styles.empty}>No appointments. Tap + to book one.</Text>
        )}
        {appointments.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{a.date?.split('-')[2] || '--'}</Text>
              <Text style={styles.monthText}>{getMonth(a.date)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardSub}>👨‍⚕️ {a.doctor}</Text>
              {a.notes ? <Text style={styles.cardNotes}>{a.notes}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleDelete(a.id)}>
              <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            {[
              { placeholder: 'Appointment title *', value: title, onChange: setTitle },
              { placeholder: 'Doctor name *', value: doctor, onChange: setDoctor },
              { placeholder: 'Date (YYYY-MM-DD) *', value: date, onChange: setDate },
              { placeholder: 'Notes (optional)', value: notes, onChange: setNotes },
            ].map((f, i) => (
              <TextInput
                key={i}
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.subtext}
                value={f.value}
                onChangeText={f.onChange}
              />
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveText}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const getMonth = (dateStr) => {
  if (!dateStr) return '';
  const m = parseInt(dateStr.split('-')[1], 10);
  return MONTHS[m - 1] || '';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, padding: SPACING.xs },
  list: { padding: SPACING.lg },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: SPACING.xl },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2,
  },
  dateBox: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    width: 56, height: 56, justifyContent: 'center', alignItems: 'center',
  },
  dateText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  monthText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  cardTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  cardNotes: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2, fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext },
  saveBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
