import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addAppointment, getAppointments, deleteAppointment } from '../../services/firestoreService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', doctor: '', date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setAppointments(await getAppointments(user.uid));
    } catch (e) {
      Alert.alert('Error', 'Failed to load appointments.');
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.doctor.trim() || !form.date.trim())
      return Alert.alert('Error', 'Title, doctor and date are required');
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/))
      return Alert.alert('Error', 'Date format must be YYYY-MM-DD');

    setSaving(true);
    try {
      await addAppointment(user.uid, {
        title: form.title.trim(),
        doctor: form.doctor.trim(),
        date: form.date.trim(),
        notes: form.notes.trim(),
      });
      setModal(false);
      setForm({ title: '', doctor: '', date: '', notes: '' });
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Appointment', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteAppointment(id);
            setAppointments(prev => prev.filter(a => a.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete. Try again.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const getMonth = (dateStr) => {
    if (!dateStr) return '';
    const m = parseInt(dateStr.split('-')[1], 10);
    return MONTHS[m - 1] || '';
  };

  const getDay = (dateStr) => dateStr?.split('-')[2] || '--';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {appointments.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySub}>Tap + to book your first appointment</Text>
          </View>
        )}
        {appointments.map(a => (
          <View key={a.id} style={styles.card}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{getDay(a.date)}</Text>
              <Text style={styles.dateMonth}>{getMonth(a.date)}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardSub}>👨⚕️ {a.doctor}</Text>
              {a.notes ? <Text style={styles.cardNotes}>{a.notes}</Text> : null}
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(a.id, a.title)}
              disabled={deletingId === a.id}
            >
              {deletingId === a.id
                ? <ActivityIndicator size="small" color={COLORS.danger} />
                : <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              }
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            {[
              { key: 'title', label: 'Title *', placeholder: 'e.g. Cardiology Checkup' },
              { key: 'doctor', label: 'Doctor *', placeholder: 'e.g. Dr. Smith' },
              { key: 'date', label: 'Date * (YYYY-MM-DD)', placeholder: '2024-12-25' },
              { key: 'notes', label: 'Notes (optional)', placeholder: 'Any special instructions...' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.subtext}
                  value={form[f.key]}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.key === 'date' ? 'numbers-and-punctuation' : 'default'}
                />
              </View>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveText}>Book Appointment</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, padding: 8 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.large, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: FONTS.small, color: COLORS.subtext },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  dateBox: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    width: 54, height: 54, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  dateDay: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  dateMonth: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 3 },
  cardNotes: { fontSize: FONTS.small, color: COLORS.subtext, fontStyle: 'italic', marginTop: 2 },
  deleteBtn: { padding: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  label: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.sm, borderWidth: 1.5,
    borderColor: COLORS.border, padding: SPACING.sm, fontSize: FONTS.medium,
    color: COLORS.text, marginBottom: SPACING.md,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  saveBtn: { flex: 2, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
