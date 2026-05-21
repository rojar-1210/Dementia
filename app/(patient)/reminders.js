import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
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
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await getReminders(user.uid);
      setReminders(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load reminders. Check your connection.');
    }
  }, [user]);

  useEffect(() => {
    load();
    requestPermissions();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const resetForm = () => {
    setTitle('');
    setTime('08:00');
    setType('medication');
    setDosage('');
  };

  const handleAdd = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title');
    if (!time.match(/^\d{2}:\d{2}$/)) return Alert.alert('Error', 'Enter time as HH:MM (e.g. 08:30)');

    setSaving(true);
    try {
      const [h, m] = time.split(':').map(Number);
      if (h > 23 || m > 59) return Alert.alert('Error', 'Invalid time');

      await addReminder(user.uid, { title: title.trim(), time, type, dosage: dosage.trim() });

      const trigger = new Date();
      trigger.setHours(h, m, 0, 0);
      if (trigger <= new Date()) trigger.setDate(trigger.getDate() + 1);
      await scheduleReminder(`⏰ ${title}`, `Time for your ${type}!${dosage ? ` Dosage: ${dosage}` : ''}`, trigger);

      setModal(false);
      resetForm();
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Reminder', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete. Try again.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⏰ My Reminders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {reminders.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first reminder</Text>
          </View>
        )}
        {reminders.map(r => {
          const t = TYPES.find(x => x.key === r.type) || TYPES[0];
          return (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardEmoji}>{t.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardSub}>
                  {t.label}{r.dosage ? ` • ${r.dosage}` : ''} • {r.time}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(r.id, r.title)}
                disabled={deletingId === r.id}
              >
                {deletingId === r.id
                  ? <ActivityIndicator size="small" color={COLORS.danger} />
                  : <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
                }
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => { setModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Morning Medicine"
              placeholderTextColor={COLORS.subtext} value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Time * (HH:MM)</Text>
            <TextInput style={styles.input} placeholder="08:30"
              placeholderTextColor={COLORS.subtext} value={time} onChangeText={setTime}
              keyboardType="numbers-and-punctuation" maxLength={5} />

            <Text style={styles.label}>Dosage (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. 1 tablet"
              placeholderTextColor={COLORS.subtext} value={dosage} onChangeText={setDosage} />

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key}
                  style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                  onPress={() => setType(t.key)}>
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, type === t.key && { color: COLORS.primary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModal(false); resetForm(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveText}>Save Reminder</Text>
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
  cardLeft: { marginRight: SPACING.sm },
  cardEmoji: { fontSize: 34 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 3 },
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
  typeBtn: {
    alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.sm, minWidth: 72,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  typeEmoji: { fontSize: 26 },
  typeLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  saveBtn: { flex: 2, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
