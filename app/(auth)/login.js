import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signInWithGoogle, handleGoogleRedirectResult, getUserProfile } from '../../services/authService';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const redirect = (profile) => {
    if (profile?.role === 'caregiver') router.replace('/(caregiver)/dashboard');
    else router.replace('/(patient)/dashboard');
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithGoogle('patient');
      // If popup succeeded, result is returned — layout will auto-route via onAuthStateChanged
      // If redirect was used, page will reload and layout will handle routing
    } catch (e) {
      Alert.alert('Google Login Failed', e.message);
    }
  };

  // No need to check redirect result here — useAuth + _layout handles routing automatically
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        setGoogleLoading(true);
        const savedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('googleRole') || 'patient' : 'patient';
        await handleGoogleRedirectResult(savedRole);
        // Routing handled by _layout.js via onAuthStateChanged
      } catch (e) {}
      finally { setGoogleLoading(false); }
    };
    checkRedirect();
  }, []);

  if (googleLoading) return (
    <View style={s.page}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={s.loadingText}>Signing in...</Text>
    </View>
  );

  return (
    <View style={s.page}>
      {/* Left panel — only on wide screens */}
      {Platform.OS === 'web' && (
        <View style={s.leftPanel}>
          <Text style={s.brandEmoji}>🧠</Text>
          <Text style={s.brandName}>Memory Care</Text>
          <Text style={s.brandTagline}>Supporting patients and caregivers every step of the way</Text>
          <View style={s.featureList}>
            {['⏰ Smart Reminders', '🆘 Emergency SOS', '🧩 Memory Games', '👨⚕️ Caregiver Panel'].map(f => (
              <View key={f} style={s.featureItem}>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Right panel — card */}
      <View style={s.cardWrap}>
        <View style={s.card}>
          {Platform.OS !== 'web' && <Text style={s.mobileEmoji}>🧠</Text>}
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

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
            <Text style={s.googleText}>Google</Text>
          </TouchableOpacity>

          <Text style={s.switchText}>
            Don't have an account?{' '}
            <Text style={s.switchLink} onPress={() => router.push('/(auth)/signup')}>Sign up</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: C.sub },

  // Left panel
  leftPanel: {
    flex: 1,
    backgroundColor: C.primary,
    height: '100%',
    padding: 48,
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 52, marginBottom: 12 },
  brandName: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8 },
  brandTagline: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 36, maxWidth: 280 },
  featureList: { gap: 12 },
  featureItem: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  featureText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  // Card
  cardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  mobileEmoji: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: C.sub, marginBottom: 24 },

  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 11,
    fontSize: 14,
    color: C.text,
    marginBottom: 16,
  },
  inputFocused: { borderColor: C.primary },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divText: { marginHorizontal: 10, fontSize: 12, color: C.sub },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 11,
    marginBottom: 24,
    gap: 8,
    backgroundColor: C.card,
  },
  googleG: { fontSize: 15, fontWeight: '800', color: C.google },
  googleText: { fontSize: 14, fontWeight: '600', color: C.text },

  switchText: { fontSize: 13, color: C.sub, textAlign: 'center' },
  switchLink: { color: C.primary, fontWeight: '600' },
});
