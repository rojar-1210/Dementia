import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { logOut } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const FONT_SIZES = ['Small', 'Medium', 'Large'];

export default function PatientSettings() {
  const { profile } = useAuth();
  const router = useRouter();
  const [voiceOn, setVoiceOn] = useState(true);
  const [fontSize, setFontSize] = useState('Medium');
  const [contactModal, setContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contacts, setContacts] = useState([]);

  const addContact = () => {
    if (!contactName || !contactPhone) return Alert.alert('Error', 'Fill all fields');
    setContacts([...contacts, { name: contactName, phone: contactPhone }]);
    setContactName('');
    setContactPhone('');
    setContactModal(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{profile?.name || 'Patient'}</Text>
          <Text style={styles.profileRole}>🧓 Patient</Text>
          <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        </View>
      </View>

      {/* Accessibility */}
      <Text style={styles.sectionLabel}>Accessibility</Text>
      <View style={styles.card}>
        {/* Font Size */}
        <View style={styles.row}>
          <Ionicons name="text" size={24} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
          <Text style={styles.rowLabel}>Font Size</Text>
          <View style={styles.fontRow}>
            {FONT_SIZES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.fontBtn, fontSize === s && styles.fontBtnActive]}
                onPress={() => setFontSize(s)}
              >
                <Text style={[styles.fontBtnText, fontSize === s && styles.fontBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Assistant */}
        <View style={styles.row}>
          <Ionicons name="mic" size={24} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
          <Text style={styles.rowLabel}>Voice Assistant</Text>
          <Switch
            value={voiceOn}
            onValueChange={setVoiceOn}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* Emergency Contacts */}
      <Text style={styles.sectionLabel}>Emergency Contacts</Text>
      <View style={styles.card}>
        {contacts.length === 0 && (
          <Text style={styles.emptyContacts}>No emergency contacts added yet.</Text>
        )}
        {contacts.map((c, i) => (
          <View key={i} style={styles.contactRow}>
            <Ionicons name="person-circle" size={28} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => setContacts(contacts.filter((_, j) => j !== i))}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addContactBtn} onPress={() => setContactModal(true)}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.addContactText}>Add Emergency Contact</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.aboutLabel}>Built for</Text>
          <Text style={styles.aboutValue}>Dementia Care</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Add Contact Modal */}
      <Modal visible={contactModal} transparent animationType="slide" onRequestClose={() => setContactModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={() => setContactModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="Contact name" placeholderTextColor={COLORS.subtext}
              value={contactName} onChangeText={setContactName} />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="+1234567890" placeholderTextColor={COLORS.subtext}
              value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setContactModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addContact}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
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
  header: {
    padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.lg, elevation: 2, gap: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  profileName: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text },
  profileRole: { fontSize: FONTS.small, color: COLORS.subtext, marginTop: 2 },
  profileEmail: { fontSize: FONTS.small, color: COLORS.subtext },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.subtext, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: COLORS.card, marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.lg,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLabel: { flex: 1, fontSize: FONTS.medium, color: COLORS.text },
  fontRow: { flexDirection: 'row', gap: 6 },
  fontBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.border },
  fontBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  fontBtnText: { fontSize: 12, color: COLORS.subtext, fontWeight: '600' },
  fontBtnTextActive: { color: COLORS.primary },
  emptyContacts: { fontSize: FONTS.small, color: COLORS.subtext, padding: SPACING.sm },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  contactName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  contactPhone: { fontSize: FONTS.small, color: COLORS.subtext },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, gap: SPACING.xs },
  addContactText: { fontSize: FONTS.medium, color: COLORS.primary, fontWeight: '600' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  aboutLabel: { fontSize: FONTS.medium, color: COLORS.text },
  aboutValue: { fontSize: FONTS.medium, color: COLORS.subtext },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.danger, marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm,
  },
  logoutText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
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
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext, fontWeight: '600' },
  saveBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
