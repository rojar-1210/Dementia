import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signInWithGoogle } from '../../services/authService';

const C = {
  bg: '#f8faff',
  card: '#ffffff',
  primary: '#4A90D9',
  text: '#1a1a2e',
  sub: '#6b7280',
  border: '#e5e7eb',
  danger: '#ef4444',
  google: '#4285F4',
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle('patient');
    } catch (e) {
      Alert.alert('Google Login Failed', e.message);
    }
  };

  if (googleLoading) return (
    <View style={s.page}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={s.loadingText}>Signing in...</Text>
    </View>
  );

  return (
    <View style={s.page}>
      <View style={s.card}>
        <Text style={s.logo}>🧠</Text>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>Sign in to Memory Care</Text>

        <Text style={s.label}>Email</Text>
        <TextInput
          style={[s.input, focused === 'email' && s.inputFocused]}
          placeholder="you@example.com"
          placeholderTextColor={C.sub}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused('')}
        />

        <Text style={s.label}>Password</Text>
        <TextInput
          style={[s.input, focused === 'password' && s.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor={C.sub}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused('')}
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={s.divText}>or continue with</Text>
          <View style={s.divLine} />
        </View>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogle}>
          <Text style={s.googleG}>G</Text>
          <Text style={s.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={s.switchText}>
          Don't have an account?{' '}
          <Text style={s.switchLink} onPress={() => router.push('/(auth)/signup')}>Sign up</Text>
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.sub },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.sub, marginBottom: 28, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, padding: 12, fontSize: 15, color: C.text, marginBottom: 16 },
  inputFocused: { borderColor: C.primary },
  btn: { backgroundColor: C.primary, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4, marginBottom: 20 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { marginHorizontal: 10, fontSize: 12, color: C.sub },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: C.border, padding: 12, marginBottom: 24, gap: 8, backgroundColor: C.card },
  googleG: { fontSize: 16, fontWeight: '800', color: C.google },
  googleText: { fontSize: 15, fontWeight: '600', color: C.text },
  switchText: { fontSize: 13, color: C.sub, textAlign: 'center' },
  switchLink: { color: C.primary, fontWeight: '600' },
});
