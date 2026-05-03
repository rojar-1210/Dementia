import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const ROLES = ['patient', 'caregiver'];

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.subtext}
        value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={COLORS.subtext}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.subtext}
        value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={styles.label}>I am a:</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {r === 'patient' ? '🧓 Patient' : '👨‍⚕️ Caregiver'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  emoji: { fontSize: 64, marginBottom: SPACING.sm },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xl },
  input: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: FONTS.medium, color: COLORS.text, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  roleRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg, width: '100%' },
  roleBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF2FF' },
  roleText: { fontSize: FONTS.medium, color: COLORS.subtext },
  roleTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  btn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  btnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  link: { fontSize: FONTS.small, color: COLORS.subtext },
  linkBold: { color: COLORS.primary, fontWeight: 'bold' },
});
