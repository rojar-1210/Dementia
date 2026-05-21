import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { addReminder, getReminders, deleteReminder } from '../../services/firestoreService';
import { scheduleReminder, requestPermissions, initializeNotifications, cancelNotification, rescheduleAllReminders } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const TYPES = [
  { key: 'medication', label: 'Medication', emoji: '💊', color: '#FFEBEE' },
  { key: 'water', label: 'Water', emoji: '💧', color: '#E3F2FD' },
  { key: 'food', label: 'Meal', emoji: '🍽️', color: '#FFF3E0' },
  { key: 'sleep', label: 'Sleep', emoji: '😴', color: '#EDE7F6' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃', color: '#E8F5E9' },
];
const REPEATS = ['Once', 'Daily', 'Weekly'];

export default function RemindersScreen() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [type, setType] = useState('medication');
  const [repeat, setRepeat] = useState('Daily');
  const [voiceAlert, setVoiceAlert] = useState(true);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    if (!user) return;
    try {
      const data = await getReminders(user.uid);
      setReminders(data);
      await rescheduleAllReminders(data); // re-sync notifications on every load
    } catch (_) {}
  };

  useEffect(() => { 
    load(); 
    initializeNotifications(); // Initialize background notifications
  }, []);

  const reset = () => { setTitle(''); setTime('08:00'); setType('medication'); setRepeat('Daily'); setVoiceAlert(true); };

  const handleAdd = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a reminder title');
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return Alert.alert('Error', 'Enter valid time as HH:MM');
    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);
    if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);
    try {
      const reminderData = { title: title.trim(), time, type, repeat, voiceAlert };
      await addReminder(user.uid, reminderData);
      
      // Schedule notification with repeat
      const notificationId = await scheduleReminder(
        `${TYPES.find(t => t.key === type)?.emoji} ${title}`, 
        `Time for your ${type}!`, 
        trigger,
        repeat
      );
      
      if (notificationId) {
        Alert.alert('✅ Success', `Reminder set! It will repeat ${repeat.toLowerCase()}.`);
      }
      
      setModal(false); reset(); load();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id) =>
    Alert.alert('Delete Reminder', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteReminder(id); load(); } },
    ]);

  const filtered = filter === 'All' ? reminders : reminders.filter(r => r.type === TYPES.find(t => t.label === filter)?.key);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⏰ Reminders</Text>
          <Text style={styles.headerSub}>{reminders.length} active reminder{reminders.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {['All', ...TYPES.map(t => t.label)].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 60 }}>⏰</Text>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first reminder</Text>
          </View>
        )}
        {filtered.map(r => {
          const t = TYPES.find(x => x.key === r.type);
          return (
            <View key={r.id} style={[styles.card, { borderLeftColor: COLORS.primary }]}>
              <View style={[styles.cardIcon, { backgroundColor: t?.color || '#EAF2FF' }]}>
                <Text style={{ fontSize: 28 }}>{t?.emoji || '🔔'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardSub}>🕐 {r.time}  •  🔁 {r.repeat || 'Daily'}{r.voiceAlert ? '  •  🔊' : ''}</Text>
                <View style={[styles.pill, { backgroundColor: t?.color || '#EAF2FF' }]}>
                  <Text style={styles.pillText}>{t?.label || r.type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(r.id)} style={{ padding: SPACING.xs }}>
                <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); reset(); }}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modalBox} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => { setModal(false); reset(); }}>
                <Ionicons name="close-circle" size={30} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Take Blood Pressure Pill" placeholderTextColor={COLORS.subtext} value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Time *</Text>
            <TextInput style={styles.input} placeholder="HH:MM  e.g. 08:30" placeholderTextColor={COLORS.subtext} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, type === t.key && styles.typeBtnActive]} onPress={() => setType(t.key)}>
                  <Text style={{ fontSize: 26 }}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, type === t.key && { color: COLORS.primary, fontWeight: '700' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Repeat</Text>
            <View style={styles.repeatRow}>
              {REPEATS.map(r => (
                <TouchableOpacity key={r} style={[styles.repeatBtn, repeat === r && styles.repeatActive]} onPress={() => setRepeat(r)}>
                  <Text style={[styles.repeatText, repeat === r && { color: COLORS.primary, fontWeight: '700' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>🔊 Voice Alert</Text>
                <Text style={styles.switchSub}>Speak reminder aloud</Text>
              </View>
              <Switch value={voiceAlert} onValueChange={setVoiceAlert} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModal(false); reset(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Ionicons name="checkmark" size={22} color={COLORS.white} />
                <Text style={styles.saveText}>Save</Text>
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
  filterRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.xs },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, marginRight: SPACING.xs },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.small, color: COLORS.subtext, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text, marginTop: SPACING.sm },
  emptySub: { fontSize: FONTS.medium, color: COLORS.subtext, marginTop: SPACING.xs },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2, borderLeftWidth: 4 },
  cardIcon: { width: 56, height: 56, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  cardTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  pill: { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: SPACING.xs },
  pillText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text },
  label: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border },
  typeBtn: { alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.sm, minWidth: 76 },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  typeLabel: { fontSize: 13, color: COLORS.subtext, marginTop: 4 },
  repeatRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  repeatBtn: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  repeatActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  repeatText: { fontSize: FONTS.medium, color: COLORS.subtext },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  switchSub: { fontSize: 13, color: COLORS.subtext },
  modalActions: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  saveBtn: { flex: 1.5, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
