import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addReminder, getReminders, deleteReminder } from '../../services/firestoreService';
import { scheduleReminder, requestPermissions } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const TYPES = [
  { key: 'medication', label: 'Medicine', emoji: '💊' },
  { key: 'water', label: 'Water', emoji: '💧' },
  { key: 'food', label: 'Meal', emoji: '🍽️' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
];

export default function RemindersScreen() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [type, setType] = useState('medication');
  const [dosage, setDosage] = useState('');

  const load = async () => setReminders(await getReminders(user.uid));

  useEffect(() => { load(); requestPermissions(); }, []);

  const handleAdd = async () => {
    if (!title || !time) return Alert.alert('Error', 'Fill all fields');
    const [h, m] = time.split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);
    if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);
    await addReminder(user.uid, { title, time, type, dosage });
    await scheduleReminder(`⏰ ${title}`, `Time for your ${type}!${dosage ? ` Dosage: ${dosage}` : ''}`, trigger);
    setModal(false); setTitle(''); setTime('08:00'); setDosage('');
    load();
  };

  const handleDelete = (id) =>
    Alert.alert('Delete', 'Remove this reminder?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteReminder(id); load(); } },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⏰ My Reminders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {reminders.length === 0 && <Text style={styles.empty}>No reminders yet. Tap + to add one.</Text>}
        {reminders.map(r => {
          const t = TYPES.find(x => x.key === r.type);
          return (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardEmoji}>{t?.emoji || '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardSub}>{t?.label}{r.dosage ? ` • ${r.dosage}` : ''} • {r.time}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(r.id)}>
                <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            <TextInput style={styles.input} placeholder="Title (e.g. Morning Medicine)" placeholderTextColor={COLORS.subtext} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Time (HH:MM)" placeholderTextColor={COLORS.subtext} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
            <TextInput style={styles.input} placeholder="Dosage (optional)" placeholderTextColor={COLORS.subtext} value={dosage} onChangeText={setDosage} />
            <Text style={styles.label}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, type === t.key && styles.typeBtnActive]} onPress={() => setType(t.key)}>
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, type === t.key && { color: COLORS.primary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, padding: SPACING.xs },
  list: { padding: SPACING.lg },
  empty: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginTop: SPACING.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2 },
  cardEmoji: { fontSize: 36, marginRight: SPACING.sm },
  cardTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.sm },
  typeBtn: { alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.sm, minWidth: 72 },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  typeEmoji: { fontSize: 28 },
  typeLabel: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },
  row: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext },
  saveBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
