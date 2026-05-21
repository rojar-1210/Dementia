import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { logOut } from '../../services/authService';
import { FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function PatientSettings() {
  const { profile } = useAuth();
  const { darkMode, toggleDarkMode, colors } = useTheme();
  const router = useRouter();
  const [voiceOn, setVoiceOn] = useState(true);
  const [fontSize, setFontSize] = useState('Large');
  const [contactModal, setContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contacts, setContacts] = useState([]);

  const C = colors;

  const addContact = () => {
    if (!contactName || !contactPhone) return Alert.alert('Error', 'Fill all fields');
    setContacts([...contacts, { name: contactName, phone: contactPhone }]);
    setContactName(''); setContactPhone(''); setContactModal(false);
  };

  const SettingRow = ({ icon, label, right }) => (
    <View style={[styles.row, { borderBottomColor: C.border }]}>
      <Ionicons name={icon} size={26} color={C.primary} style={{ marginRight: SPACING.md }} />
      <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
      {right}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
      </View>

      {/* Profile */}
      <View style={[styles.profileCard, { backgroundColor: C.card }]}>
        <View style={[styles.avatar, { backgroundColor: C.primary }]}><Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text></View>
        <View>
          <Text style={[styles.profileName, { color: C.text }]}>{profile?.name || 'Patient'}</Text>
          <Text style={[styles.profileRole, { color: C.subtext }]}>🧓 Patient</Text>
          <Text style={[styles.profileEmail, { color: C.subtext }]}>{profile?.email || ''}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: C.subtext }]}>Accessibility</Text>
      <View style={[styles.card, { backgroundColor: C.card }]}>
        <SettingRow icon="text" label="Font Size" right={
          <View style={styles.fontRow}>
            {['Small', 'Large', 'XLarge'].map(s => (
              <TouchableOpacity key={s} style={[styles.fontBtn, { borderColor: C.border }, fontSize === s && { borderColor: C.primary, backgroundColor: '#EAF2FF' }]} onPress={() => setFontSize(s)}>
                <Text style={[styles.fontBtnText, { color: fontSize === s ? C.primary : C.subtext }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        } />
        <SettingRow icon="mic" label="Voice Assistant" right={<Switch value={voiceOn} onValueChange={setVoiceOn} trackColor={{ true: C.primary }} />} />
        <SettingRow icon="moon" label="Dark Mode" right={<Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ true: C.primary }} />} />
      </View>

      <Text style={[styles.sectionLabel, { color: C.subtext }]}>Emergency Contacts</Text>
      <View style={[styles.card, { backgroundColor: C.card }]}>
        {contacts.map((c, i) => (
          <View key={i} style={[styles.contactRow, { borderBottomColor: C.border }]}>
            <Ionicons name="person-circle" size={28} color={C.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={[styles.contactName, { color: C.text }]}>{c.name}</Text>
              <Text style={[styles.contactPhone, { color: C.subtext }]}>{c.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => setContacts(contacts.filter((_, j) => j !== i))}>
              <Ionicons name="trash-outline" size={22} color={C.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addContactBtn} onPress={() => setContactModal(true)}>
          <Ionicons name="add-circle" size={24} color={C.primary} />
          <Text style={[styles.addContactText, { color: C.primary }]}>Add Emergency Contact</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logOut(); router.replace('/(auth)/login'); }}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={contactModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Add Emergency Contact</Text>
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Contact Name" placeholderTextColor={C.subtext} value={contactName} onChangeText={setContactName} />
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Phone Number" placeholderTextColor={C.subtext} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setContactModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addContact}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, elevation: 2, gap: SPACING.md },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  profileName: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text },
  profileRole: { fontSize: FONTS.small, color: COLORS.subtext },
  profileEmail: { fontSize: FONTS.small, color: COLORS.subtext },
  sectionLabel: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  card: { backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { flex: 1, fontSize: FONTS.medium, color: COLORS.text },
  fontRow: { flexDirection: 'row', gap: 6 },
  fontBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  fontBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  fontBtnText: { fontSize: 13, color: COLORS.subtext },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  contactName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  contactPhone: { fontSize: FONTS.small, color: COLORS.subtext },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.sm, gap: SPACING.xs },
  addContactText: { fontSize: FONTS.medium, color: COLORS.primary, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  logoutText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  modalRow: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext },
  saveBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
