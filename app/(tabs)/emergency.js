import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Vibration, Animated, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { updateLocation } from '../../services/firestoreService';
import { sendImmediateAlert } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const CAREGIVER_PHONE = '+1234567890';
const EMERGENCY_CONTACTS = [
  { label: 'Call Caregiver', icon: 'call', color: '#E8F5E9', iconColor: COLORS.success, phone: CAREGIVER_PHONE },
  { label: 'Call 911', icon: 'medkit', color: '#FFF3E0', iconColor: COLORS.secondary, phone: '911' },
  { label: 'Call Family', icon: 'people', color: '#EAF2FF', iconColor: COLORS.primary, phone: CAREGIVER_PHONE },
];

export default function EmergencyScreen() {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location access is needed to share your position during emergencies. Please enable it in Settings.');
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (sosActive) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      pulse.setValue(1);
    }
    return () => pulseAnim.current?.stop();
  }, [sosActive]);

  const triggerSOS = () => {
    Alert.alert('🆘 Confirm SOS', 'This will alert your caregiver and share your location. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send SOS', style: 'destructive', onPress: activateSOS },
    ]);
  };

  const activateSOS = async () => {
    setSosActive(true);
    Vibration.vibrate([0, 400, 200, 400, 200, 400]);
    if (location && user) {
      try { await updateLocation(user.uid, location); } catch (_) {}
    }
    try {
      await sendImmediateAlert('🆘 SOS ALERT', `${profile?.name || 'Patient'} needs help! Check their location immediately.`);
    } catch (_) {}
    Alert.alert('🆘 SOS Activated', 'Your caregiver has been notified with your location. Call them now?', [
      { text: 'Not Now', onPress: () => setSosActive(false) },
      { text: '📞 Call Now', onPress: () => { Linking.openURL(`tel:${CAREGIVER_PHONE}`); setSosActive(false); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🆘 Emergency SOS</Text>
        <Text style={styles.headerSub}>Press the button below in case of emergency</Text>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulse }] }, sosActive && styles.pulseOuterActive]}>
          <View style={styles.pulseInner}>
            <TouchableOpacity style={[styles.sosBtn, sosActive && styles.sosBtnActive]} onPress={triggerSOS} activeOpacity={0.85}>
              <Text style={styles.sosEmoji}>🆘</Text>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSub}>{sosActive ? 'ACTIVE' : 'HELP ME'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {sosActive && (
          <View style={styles.activeAlert}>
            <Ionicons name="radio-button-on" size={16} color={COLORS.danger} />
            <Text style={styles.activeText}> SOS Alert Sent — Caregiver Notified</Text>
          </View>
        )}
      </View>

      {/* Location Status */}
      <View style={[styles.locationCard, { borderColor: location ? COLORS.success : COLORS.border }]}>
        <Ionicons name={location ? 'location' : 'location-outline'} size={24} color={location ? COLORS.success : COLORS.subtext} />
        <Text style={[styles.locationText, { color: location ? COLORS.success : COLORS.subtext }]}>
          {location ? `📍 Location ready: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Location not available'}
        </Text>
      </View>

      {/* Emergency Contacts */}
      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      <View style={styles.contactsRow}>
        {EMERGENCY_CONTACTS.map((c) => (
          <TouchableOpacity key={c.label} style={[styles.contactBtn, { backgroundColor: c.color }]} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
            <Ionicons name={c.icon} size={32} color={c.iconColor} />
            <Text style={styles.contactLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Safety Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>🛡️ Safety Tips</Text>
        {['Stay calm and stay where you are', 'Keep your phone charged at all times', 'Share your location with your caregiver'].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>SOS will notify your caregiver and share your current location automatically.</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, alignItems: 'center', paddingBottom: SPACING.xl },
  header: { width: '100%', padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.danger, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, alignItems: 'center', marginBottom: SPACING.xl },
  headerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: FONTS.medium, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  sosSection: { alignItems: 'center', marginBottom: SPACING.lg },
  pulseOuter: { width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(231,76,60,0.12)', justifyContent: 'center', alignItems: 'center' },
  pulseOuterActive: { backgroundColor: 'rgba(231,76,60,0.25)' },
  pulseInner: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(231,76,60,0.18)', justifyContent: 'center', alignItems: 'center' },
  sosBtn: { width: 168, height: 168, borderRadius: 84, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.danger, shadowOpacity: 0.6, shadowRadius: 16 },
  sosBtnActive: { backgroundColor: '#C0392B' },
  sosEmoji: { fontSize: 50 },
  sosText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sosSub: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, marginTop: 2 },
  activeAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginTop: SPACING.sm },
  activeText: { fontSize: FONTS.small, color: COLORS.danger, fontWeight: '700' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, gap: SPACING.xs, elevation: 1, borderWidth: 1.5, width: '90%' },
  locationText: { fontSize: FONTS.small, flex: 1 },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, alignSelf: 'flex-start', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  contactsRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  contactBtn: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', elevation: 2 },
  contactLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs, textAlign: 'center' },
  tipsCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, elevation: 1, width: '90%' },
  tipsTitle: { fontSize: FONTS.medium, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  tipText: { fontSize: FONTS.small, color: COLORS.subtext, flex: 1 },
  note: { fontSize: FONTS.small, color: COLORS.subtext, textAlign: 'center', paddingHorizontal: SPACING.lg },
});
