import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { signIn, signInWithGoogle, getUserProfile } from '../../services/authService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirect = (profile) => {
    if (profile?.role === 'caregiver') router.replace('/(caregiver)/dashboard');
    else router.replace('/(patient)/dashboard');
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const user = await signIn(email, password);
      const profile = await getUserProfile(user.uid);
      redirect(profile);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { profile } = await signInWithGoogle();
      redirect(profile);
    } catch (e) {
      Alert.alert('Google Login Failed', e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>🧠</Text>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Memory Care Assistant</Text>

      <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={COLORS.subtext}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.subtext}
        value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Button */}
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={googleLoading}>
        {googleLoading
          ? <ActivityIndicator color={COLORS.text} />
          : <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={{ marginTop: SPACING.md }}>
        <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  emoji: { fontSize: 72, marginBottom: SPACING.sm },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: FONTS.medium, color: COLORS.subtext, marginBottom: SPACING.xl },
  input: { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.medium, color: COLORS.text, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  btn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.lg },
  btnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: SPACING.sm, fontSize: FONTS.small, color: COLORS.subtext, fontWeight: '600' },
  googleBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border, gap: SPACING.sm, elevation: 2 },
  googleIcon: { fontSize: FONTS.large, fontWeight: 'bold', color: '#4285F4' },
  googleText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text },
  link: { fontSize: FONTS.small, color: COLORS.subtext },
  linkBold: { color: COLORS.primary, fontWeight: 'bold' },
});
