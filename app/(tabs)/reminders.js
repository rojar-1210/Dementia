import { useEffect, useState, useRef } from 'react';
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
  const uidRef = useRef(null);
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
    getDeviceUid().then(id => { setUid(id); uidRef.current = id; loadReminders(id); });
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
    const displayTime = `${hour.replace(/^0/, '') || '12'}:${minute} ${ampm}`;
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
        const prev = reminders;
        setReminders(p => p.filter(r => r.id !== id));
        try {
          await deleteReminder(id);
          await rescheduleAllReminders(reminders.filter(r => r.id !== id));
        } catch (e) {
          setReminders(prev);
          Alert.alert('Error', 'Could not delete reminder. Please try again.');
        }
      }},
    ]);

  const filtered = filter === 'All' ? reminders : reminders.filter(r => r.type === TYPES.find(t => t.label === filter)?.key);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 56, backgroundColor: C.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.sm }}>
        <View>
          <Text style={{ fontSize: F.xlarge, fontWeight: 'bold', color: C.white, fontFamily: fontFamilyBold }}>⏰ Reminders</Text>
          <Text style={{ fontSize: F.small, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontFamily }}>{reminders.length} active reminder{reminders.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.full, padding: SPACING.sm }} onPress={() => setModal(true)}>
          <Ionicons name="add" size={30} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.xs }}>
        {['All', ...TYPES.map(t => t.label)].map(f => (
          <TouchableOpacity key={f} style={{ paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: filter === f ? C.primary : C.card, borderWidth: 1.5, borderColor: filter === f ? C.primary : C.border, marginRight: SPACING.xs }} onPress={() => setFilter(f)}>
            <Text style={{ fontSize: F.small, color: filter === f ? C.white : C.subtext, fontWeight: '600', fontFamily }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.sm }}>
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Text style={{ fontSize: 60 }}>⏰</Text>
            <Text style={{ fontSize: F.large, fontWeight: '600', color: C.text, marginTop: SPACING.sm, fontFamily: fontFamilyBold }}>No reminders yet</Text>
            <Text style={{ fontSize: F.medium, color: C.subtext, marginTop: SPACING.xs, fontFamily }}>Tap + to add your first reminder</Text>
          </View>
        )}
        {filtered.map(r => {
          const t = TYPES.find(x => x.key === r.type);
          const displayTime = r.displayTime || (() => {
            const [hh, mm] = (r.time || '00:00').split(':').map(Number);
            const ap = hh >= 12 ? 'PM' : 'AM';
            const h12 = hh % 12 || 12;
            return `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
          })();
          return (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2, borderLeftWidth: 4, borderLeftColor: C.primary }}>
              <View style={{ width: 56, height: 56, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm, backgroundColor: t?.color || '#EAF2FF' }}>
                <Text style={{ fontSize: 28 }}>{t?.emoji || '🔔'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: F.large, fontWeight: '600', color: C.text, fontFamily: fontFamilyBold }}>{r.title}</Text>
                <Text style={{ fontSize: F.small, color: C.subtext, marginTop: 2, fontFamily }}>🕐 {displayTime}  •  🔁 {r.repeat || 'Daily'}{r.voiceAlert ? '  •  🔊' : ''}</Text>
                <View style={{ alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: SPACING.xs, backgroundColor: t?.color || '#EAF2FF' }}>
                  <Text style={{ fontSize: 12, color: C.text, fontWeight: '600', fontFamily }}>{t?.label || r.type}</Text>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ backgroundColor: C.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '92%' }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <Text style={{ fontSize: F.xlarge, fontWeight: 'bold', color: C.text, fontFamily: fontFamilyBold }}>New Reminder</Text>
              <TouchableOpacity onPress={() => { setModal(false); reset(); }}>
                <Ionicons name="close-circle" size={30} color={C.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: F.medium, fontWeight: '600', color: C.text, marginBottom: SPACING.xs, fontFamily: fontFamilyBold }}>Title *</Text>
            <TextInput style={{ backgroundColor: C.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: F.medium, color: C.text, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: C.border, fontFamily }} placeholder="e.g. Take Blood Pressure Pill" placeholderTextColor={C.subtext} value={title} onChangeText={setTitle} />

            <Text style={{ fontSize: F.medium, fontWeight: '600', color: C.text, marginBottom: SPACING.xs, fontFamily: fontFamilyBold }}>Time *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, backgroundColor: C.background, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: C.border, padding: SPACING.sm }}>
              <ScrollView style={{ flex: 1, maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={{ padding: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm, backgroundColor: hour === h ? C.primary : 'transparent' }} onPress={() => setHour(h)}>
                    <Text style={{ fontSize: F.large, fontWeight: '600', color: hour === h ? C.white : C.subtext, fontFamily: fontFamilyBold }}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={{ fontSize: F.xlarge, fontWeight: 'bold', color: C.text, marginHorizontal: SPACING.xs, fontFamily: fontFamilyBold }}>:</Text>
              <ScrollView style={{ flex: 1, maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={{ padding: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm, backgroundColor: minute === m ? C.primary : 'transparent' }} onPress={() => setMinute(m)}>
                    <Text style={{ fontSize: F.large, fontWeight: '600', color: minute === m ? C.white : C.subtext, fontFamily: fontFamilyBold }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'column', gap: SPACING.xs, marginLeft: SPACING.sm }}>
                {['AM', 'PM'].map(p => (
                  <TouchableOpacity key={p} style={{ paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: ampm === p ? C.primary : C.border, backgroundColor: ampm === p ? C.primary : 'transparent' }} onPress={() => setAmpm(p)}>
                    <Text style={{ fontWeight: '700', color: ampm === p ? C.white : C.subtext, fontFamily: fontFamilyBold, fontSize: F.medium }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={{ fontSize: F.medium, fontWeight: '600', color: C.text, marginBottom: SPACING.xs, fontFamily: fontFamilyBold }}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.key} style={{ alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: type === t.key ? C.primary : C.border, marginRight: SPACING.sm, minWidth: 76, backgroundColor: type === t.key ? '#EAF2FF' : 'transparent' }} onPress={() => setType(t.key)}>
                  <Text style={{ fontSize: 26 }}>{t.emoji}</Text>
                  <Text style={{ fontSize: 13, color: type === t.key ? C.primary : C.subtext, marginTop: 4, fontFamily, fontWeight: type === t.key ? '700' : '400' }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ fontSize: F.medium, fontWeight: '600', color: C.text, marginBottom: SPACING.xs, fontFamily: fontFamilyBold }}>Repeat</Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
              {REPEATS.map(r => (
                <TouchableOpacity key={r} style={{ flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 2, borderColor: repeat === r ? C.primary : C.border, alignItems: 'center', backgroundColor: repeat === r ? '#EAF2FF' : 'transparent' }} onPress={() => setRepeat(r)}>
                  <Text style={{ fontSize: F.medium, color: repeat === r ? C.primary : C.subtext, fontFamily, fontWeight: repeat === r ? '700' : '400' }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
              <View>
                <Text style={{ fontSize: F.medium, fontWeight: '600', color: C.text, fontFamily: fontFamilyBold }}>🔊 Voice Alert</Text>
                <Text style={{ fontSize: 13, color: C.subtext, fontFamily }}>Speak reminder aloud</Text>
              </View>
              <Switch value={voiceAlert} onValueChange={setVoiceAlert} trackColor={{ false: C.border, true: C.primary }} thumbColor={C.white} />
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <TouchableOpacity style={{ flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: C.border, alignItems: 'center' }} onPress={() => { setModal(false); reset(); }}>
                <Text style={{ fontSize: F.medium, color: C.subtext, fontWeight: '600', fontFamily }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1.5, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs }} onPress={handleAdd}>
                <Ionicons name="checkmark" size={22} color={C.white} />
                <Text style={{ fontSize: F.medium, fontWeight: 'bold', color: C.white, fontFamily: fontFamilyBold }}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({});
