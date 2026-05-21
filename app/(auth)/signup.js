import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { signUp, signInWithGoogle } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRoleModal, setGoogleRoleModal] = useState(false);
  const [googleRole, setGoogleRole] = useState('patient');

  const redirect = (role) => {
    if (role === 'caregiver') router.replace('/(caregiver)/dashboard');
    else router.replace('/(patient)/dashboard');
  };

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      redirect(role);
    } catch (e) {
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // Show role selection modal first
    setGoogleRoleModal(true);
  };

  const confirmGoogleSignup = async () => {
    setGoogleRoleModal(false);
    setGoogleLoading(true);
    try {
      const { profile } = await signInWithGoogle(googleRole);
      redirect(profile?.role || googleRole);
    } catch (e) {
      Alert.alert('Google Signup Failed', e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.subtext} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={COLORS.subtext} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor={COLORS.subtext} value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={styles.label}>I am a:</Text>
      <View style={styles.roleRow}>
        {[{ key: 'patient', label: '🧓 Patient' }, { key: 'caregiver', label: '👨‍⚕️ Caregiver' }].map(r => (
          <TouchableOpacity key={r.key} style={[styles.roleBtn, role === r.key && styles.roleBtnActive]} onPress={() => setRole(r.key)}>
            <Text style={[styles.roleText, role === r.key && styles.roleTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Sign Up</Text>}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Button */}
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignup} disabled={googleLoading}>
        {googleLoading
          ? <ActivityIndicator color={COLORS.text} />
          : <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Sign up with Google</Text>
            </>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: SPACING.md }}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
      </TouchableOpacity>

      {/* Google Role Selection Modal */}
      <Modal visible={googleRoleModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Your Role</Text>
            <Text style={styles.modalSubtitle}>How will you use Memory Care?</Text>
            <View style={styles.roleRow}>
              {[{ key: 'patient', label: '🧓 Patient' }, { key: 'caregiver', label: '👨‍⚕️ Caregiver' }].map(r => (
                <TouchableOpacity key={r.key} style={[styles.roleBtn, googleRole === r.key && styles.roleBtnActive]} onPress={() => setGoogleRole(r.key)}>
                  <Text style={[styles.roleText, googleRole === r.key && styles.roleTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGoogleRoleModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmGoogleSignup}>
                <Text style={styles.confirmText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  emoji: { fontSize: 64, marginBottom: SPACING.sm },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xl },
  input: { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: FONTS.medium, color: COLORS.text, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  roleRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg, width: '100%' },
  roleBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.card },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  roleText: { fontSize: FONTS.medium, color: COLORS.subtext },
  roleTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  btn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.lg },
  btnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: SPACING.sm, fontSize: FONTS.small, color: COLORS.subtext, fontWeight: '600' },
  googleBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border, gap: SPACING.sm, elevation: 2 },
  googleIcon: { fontSize: FONTS.large, fontWeight: 'bold', color: '#4285F4' },
  googleText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  link: { fontSize: FONTS.small, color: COLORS.subtext },
  linkBold: { color: COLORS.primary, fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: FONTS.medium, color: COLORS.subtext, marginBottom: SPACING.lg },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, color: COLORS.subtext },
  confirmBtn: { flex: 2, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});
