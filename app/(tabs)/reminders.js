import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addReminder, getReminders, deleteReminder } from '../../services/firestoreService';
import { scheduleReminder, initializeNotifications, rescheduleAllReminders } from '../../services/notificationService';
import { SPACING, RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TYPES = [
  { key: 'medication', label: 'Medication', emoji: '💊', color: '#FFEBEE' },
  { key: 'water', label: 'Water', emoji: '💧', color: '#E3F2FD' },
  { key: 'food', label: 'Meal', emoji: '🍽️', color: '#FFF3E0' },
  { key: 'sleep', label: 'Sleep', emoji: '😴', color: '#EDE7F6' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃', color: '#E8F5E9' },
];
const REPEATS = ['Once', 'Daily', 'Weekly'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const DEVICE_UID_KEY = 'device_uid';
const getDeviceUid = async () => {
  let uid = await AsyncStorage.getItem(DEVICE_UID_KEY);
  if (!uid) { uid = 'device_' + Math.random().toString(36).slice(2) + Date.now(); await AsyncStorage.setItem(DEVICE_UID_KEY, uid); }
  return uid;
};

export default function RemindersScreen() {
  const { colors, fonts, fontFamily, fontFamilyBold } = useTheme();
  const C = colors;
  const F = fonts;
  const [uid, setUid] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [type, setType] = useState('medication');
  const [repeat, setRepeat] = useState('Daily');
  const [voiceAlert, setVoiceAlert] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getDeviceUid().then(id => { setUid(id); loadReminders(id); });
    initializeNotifications();
  }, []);

  const loadReminders = async (id) => {
    try {
      const data = await getReminders(id);
      setReminders(data);
      await rescheduleAllReminders(data);
    } catch (_) {}
  };

  const reset = () => { setTitle(''); setHour('08'); setMinute('00'); setAmpm('AM'); setType('medication'); setRepeat('Daily'); setVoiceAlert(true); };

  const handleAdd = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a reminder title');
    let h = parseInt(hour);
    const m = parseInt(minute);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const displayTime = `${hour}:${minute} ${ampm}`;
    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);
    if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);
    try {
      const reminderData = { title: title.trim(), time: timeStr, displayTime, type, repeat, voiceAlert };
      await addReminder(uid, reminderData);
      await scheduleReminder(`${TYPES.find(t => t.key === type)?.emoji} ${title.trim()}`, `Time for your ${type}!`, trigger, repeat);
      setModal(false); reset(); loadReminders(uid);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id) =>
    Alert.alert('Delete Reminder', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setReminders(prev => prev.filter(r => r.id !== id));
        await deleteReminder(id);
      }},
    ]);

  const filtered = filter === 'All' ? reminders : reminders.filter(r => r.type === TYPES.find(t => t.label === filter)?.key);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.white, fontFamily: fontFamilyBold, fontSize: F.xlarge }]}>⏰ Reminders</Text>
          <Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)', fontFamily }]}>{reminders.length} active reminder{reminders.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={30} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {['All', ...TYPES.map(t => t.label)].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, { backgroundColor: C.card, borderColor: C.border }, filter === f && { backgroundColor: C.primary, borderColor: C.primary }]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, { color: filter === f ? C.white : C.subtext, fontFamily }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 60 }}>⏰</Text>
            <Text style={[styles.emptyTitle, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.large }]}>No reminders yet</Text>
            <Text style={[styles.emptySub, { color: C.subtext, fontFamily, fontSize: F.medium }]}>Tap + to add your first reminder</Text>
          </View>
        )}
        {filtered.map(r => {
          const t = TYPES.find(x => x.key === r.type);
          return (
            <View key={r.id} style={[styles.card, { backgroundColor: C.card, borderLeftColor: C.primary }]}>
              <View style={[styles.cardIcon, { backgroundColor: t?.color || '#EAF2FF' }]}>
                <Text style={{ fontSize: 28 }}>{t?.emoji || '🔔'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.large }]}>{r.title}</Text>
                <Text style={[styles.cardSub, { color: C.subtext, fontFamily, fontSize: F.small }]}>🕐 {r.displayTime || r.time}  •  🔁 {r.repeat || 'Daily'}{r.voiceAlert ? '  •  🔊' : ''}</Text>
                <View style={[styles.pill, { backgroundColor: t?.color || '#EAF2FF' }]}>
                  <Text style={[styles.pillText, { fontFamily }]}>{t?.label || r.type}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(r.id)} style={{ padding: SPACING.xs }}>
                <Ionicons name="trash-outline" size={22} color={C.danger} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); reset(); }}>
        <View style={styles.overlay}>
          <ScrollView style={[styles.modalBox, { backgroundColor: C.card }]} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.xlarge }]}>New Reminder</Text>
              <TouchableOpacity onPress={() => { setModal(false); reset(); }}>
                <Ionicons name="close-circle" size={30} color={C.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.medium }]}>Title *</Text>
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border, fontFamily, fontSize: F.medium }]} placeholder="e.g. Take Blood Pressure Pill" placeholderTextColor={C.subtext} value={title} onChangeText={setTitle} />

            <Text style={[styles.label, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.medium }]}>Time *</Text>
            <View style={[styles.timeRow, { backgroundColor: C.background, borderColor: C.border }]}>
              <ScrollView style={styles.timePicker} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={[styles.timeItem, hour === h && { backgroundColor: C.primary }]} onPress={() => setHour(h)}>
                    <Text style={[styles.timeItemText, { color: hour === h ? C.white : C.subtext, fontFamily: fontFamilyBold, fontSize: F.large }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[styles.timeSep, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.xlarge }]}>:</Text>
              <ScrollView style={styles.timePicker} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={[styles.timeItem, minute === m && { backgroundColor: C.primary }]} onPress={() => setMinute(m)}>
                    <Text style={[styles.timeItemText, { color: minute === m ? C.white : C.subtext, fontFamily: fontFamilyBold, fontSize: F.large }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.ampmCol}>
                {['AM', 'PM'].map(p => (
                  <TouchableOpacity key={p} style={[styles.ampmBtn, { borderColor: C.border }, ampm === p && { backgroundColor: C.primary, borderColor: C.primary }]} onPress={() => setAmpm(p)}>
                    <Text style={[styles.ampmText, { color: ampm === p ? C.white : C.subtext, fontFamily: fontFamilyBold, fontSize: F.medium }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={[styles.label, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.medium }]}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, { borderColor: C.border }, type === t.key && { borderColor: C.primary, backgroundColor: '#EAF2FF' }]} onPress={() => setType(t.key)}>
                  <Text style={{ fontSize: 26 }}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, { color: type === t.key ? C.primary : C.subtext, fontFamily, fontWeight: type === t.key ? '700' : '400' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.medium }]}>Repeat</Text>
            <View style={styles.repeatRow}>
              {REPEATS.map(r => (
                <TouchableOpacity key={r} style={[styles.repeatBtn, { borderColor: C.border }, repeat === r && { borderColor: C.primary, backgroundColor: '#EAF2FF' }]} onPress={() => setRepeat(r)}>
                  <Text style={[styles.repeatText, { color: repeat === r ? C.primary : C.subtext, fontFamily, fontWeight: repeat === r ? '700' : '400', fontSize: F.medium }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.label, { color: C.text, fontFamily: fontFamilyBold, fontSize: F.medium }]}>🔊 Voice Alert</Text>
                <Text style={[styles.switchSub, { color: C.subtext, fontFamily }]}>Speak reminder aloud</Text>
              </View>
              <Switch value={voiceAlert} onValueChange={setVoiceAlert} trackColor={{ false: C.border, true: C.primary }} thumbColor={C.white} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => { setModal(false); reset(); }}>
                <Text style={[styles.cancelText, { color: C.subtext, fontFamily, fontSize: F.medium }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleAdd}>
                <Ionicons name="checkmark" size={22} color={C.white} />
                <Text style={[styles.saveText, { color: C.white, fontFamily: fontFamilyBold, fontSize: F.medium }]}>Save</Text>
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
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, padding: SPACING.sm },
  timePicker: { flex: 1, maxHeight: 120 },
  timeItem: { padding: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  timeItemActive: { backgroundColor: COLORS.primary },
  timeItemText: { fontSize: FONTS.large, color: COLORS.subtext, fontWeight: '600' },
  timeItemTextActive: { color: COLORS.white },
  timeSep: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginHorizontal: SPACING.xs },
  ampmCol: { flexDirection: 'column', gap: SPACING.xs, marginLeft: SPACING.sm },
  ampmBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.border },
  ampmActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ampmText: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.subtext },
  ampmTextActive: { color: COLORS.white },
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
