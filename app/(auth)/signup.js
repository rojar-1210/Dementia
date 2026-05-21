import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { signUp, signInWithGoogle } from '../../services/authService';

const C = {
  bg: '#f8faff',
  card: '#ffffff',
  primary: '#4A90D9',
  text: '#1a1a2e',
  sub: '#6b7280',
  border: '#e5e7eb',
  google: '#4285F4',
};

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [googleRoleModal, setGoogleRoleModal] = useState(false);
  const [googleRole, setGoogleRole] = useState('patient');
  const [focused, setFocused] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      // _layout.js handles routing via onAuthStateChanged
    } catch (e) {
      Alert.alert('Signup Failed', e.message);
    } finally { setLoading(false); }
  };

  const confirmGoogleSignup = async () => {
    setGoogleRoleModal(false);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('googleRole', googleRole);
      const result = await signInWithGoogle(googleRole);
      // If popup succeeded result is returned, _layout.js handles routing
      // If redirect was used, page reloads and _layout.js handles routing
    } catch (e) { Alert.alert('Google Signup Failed', e.message); }
  };

  if (loading) return (
    <View style={s.page}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  const ROLES = [
    { key: 'patient', emoji: '🧓', label: 'Patient', desc: 'I need care support' },
    { key: 'caregiver', emoji: '👨⚕️', label: 'Caregiver', desc: 'I support a patient' },
  ];

  return (
    <View style={s.page}>
      <View style={s.card}>
        <Text style={s.logo}>🧠</Text>
        <Text style={s.title}>Create an account</Text>
        <Text style={s.subtitle}>Start your Memory Care journey</Text>

        <View style={s.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity key={r.key} style={[s.roleCard, role === r.key && s.roleCardActive]} onPress={() => setRole(r.key)}>
              <Text style={s.roleEmoji}>{r.emoji}</Text>
              <Text style={[s.roleLabel, role === r.key && s.roleLabelActive]}>{r.label}</Text>
              <Text style={s.roleDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Full Name</Text>
        <TextInput style={[s.input, focused === 'name' && s.inputFocused]} placeholder="John Smith"
          placeholderTextColor={C.sub} value={name} onChangeText={setName}
          onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />

        <Text style={s.label}>Email</Text>
        <TextInput style={[s.input, focused === 'email' && s.inputFocused]} placeholder="you@example.com"
          placeholderTextColor={C.sub} value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none"
          onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />

        <Text style={s.label}>Password</Text>
        <TextInput style={[s.input, focused === 'password' && s.inputFocused]} placeholder="Min 6 characters"
          placeholderTextColor={C.sub} value={password} onChangeText={setPassword} secureTextEntry
          onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />

        <TouchableOpacity style={s.btn} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={s.divText}>or sign up with</Text>
          <View style={s.divLine} />
        </View>

        <TouchableOpacity style={s.googleBtn} onPress={() => setGoogleRoleModal(true)}>
          <Text style={s.googleG}>G</Text>
          <Text style={s.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={s.switchText}>
          Already have an account?{' '}
          <Text style={s.switchLink} onPress={() => router.back()}>Sign in</Text>
        </Text>
      </View>

      {/* Google Role Modal */}
      <Modal visible={googleRoleModal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Choose your role</Text>
            <Text style={s.modalSub}>How will you use Memory Care?</Text>
            <View style={s.roleRow}>
              {ROLES.map(r => (
                <TouchableOpacity key={r.key} style={[s.roleCard, googleRole === r.key && s.roleCardActive]} onPress={() => setGoogleRole(r.key)}>
                  <Text style={s.roleEmoji}>{r.emoji}</Text>
                  <Text style={[s.roleLabel, googleRole === r.key && s.roleLabelActive]}>{r.label}</Text>
                  <Text style={s.roleDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setGoogleRoleModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={confirmGoogleSignup}>
                <Text style={s.googleG}>G</Text>
                <Text style={s.confirmText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.sub },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.sub, marginBottom: 20, textAlign: 'center' },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleCard: { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, padding: 12, alignItems: 'center', backgroundColor: C.bg },
  roleCardActive: { borderColor: C.primary, backgroundColor: '#EAF2FF' },
  roleEmoji: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 13, fontWeight: '700', color: C.sub },
  roleLabelActive: { color: C.primary },
  roleDesc: { fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, padding: 12, fontSize: 15, color: C.text, marginBottom: 14 },
  inputFocused: { borderColor: C.primary },
  btn: { backgroundColor: C.primary, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4, marginBottom: 18 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { marginHorizontal: 10, fontSize: 12, color: C.sub },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: C.border, padding: 12, marginBottom: 20, gap: 8, backgroundColor: C.card },
  googleG: { fontSize: 16, fontWeight: '800', color: C.google },
  googleText: { fontSize: 15, fontWeight: '600', color: C.text },
  switchText: { fontSize: 13, color: C.sub, textAlign: 'center' },
  switchLink: { color: C.primary, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: C.card, borderRadius: 16, padding: 28, width: '90%', maxWidth: 380 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.sub, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 11, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelText: { fontSize: 14, color: C.sub, fontWeight: '600' },
  confirmBtn: { flex: 2, flexDirection: 'row', padding: 11, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
