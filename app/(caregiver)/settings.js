import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { logOut } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function CaregiverSettings() {
  const { profile } = useAuth();
  const router = useRouter();

  const MENU = [
    { icon: 'people', label: 'Manage Patients', route: '/(caregiver)/patients' },
    { icon: 'notifications', label: 'Alert Preferences', route: null },
    { icon: 'shield-checkmark', label: 'Privacy & Security', route: null },
    { icon: 'help-circle', label: 'Help & Support', route: null },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text></View>
        <View>
          <Text style={styles.profileName}>{profile?.name || 'Caregiver'}</Text>
          <Text style={styles.profileRole}>👨⚕️ Caregiver</Text>
          <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        </View>
      </View>

      <View style={styles.card}>
        {MENU.map((m, i) => (
          <TouchableOpacity key={i} style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]} onPress={() => m.route && router.push(m.route)}>
            <Ionicons name={m.icon} size={26} color={COLORS.primary} style={{ marginRight: SPACING.md }} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logOut(); router.replace('/(auth)/login'); }}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  card: { backgroundColor: COLORS.card, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.lg, elevation: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLabel: { flex: 1, fontSize: FONTS.medium, color: COLORS.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  logoutText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});
