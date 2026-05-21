import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Vibration, Animated } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { updateLocation } from '../../services/firestoreService';
import { sendImmediateAlert } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const CAREGIVER_PHONE = '+1234567890'; // ← update this
const EMERGENCY_NUMBER = '911';

export default function EmergencyScreen() {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  useEffect(() => {
    if (sosActive) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [sosActive]);

  const triggerSOS = async () => {
    setSosActive(true);
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    if (location && user) await updateLocation(user.uid, location);
    await sendImmediateAlert('🆘 SOS ALERT', `${profile?.name || 'Patient'} needs help! Check location immediately.`);
    Alert.alert('🆘 SOS Activated!', 'Your caregiver has been notified. Call them now?', [
      { text: 'Cancel', onPress: () => setSosActive(false) },
      { text: '📞 Call Caregiver', onPress: () => { Linking.openURL(`tel:${CAREGIVER_PHONE}`); setSosActive(false); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Emergency SOS</Text>
      <Text style={styles.subtitle}>Press the button below for immediate help</Text>

      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity style={styles.sosBtn} onPress={triggerSOS} activeOpacity={0.85}>
          <Text style={styles.sosEmoji}>🆘</Text>
          <Text style={styles.sosLabel}>SOS</Text>
          <Text style={styles.sosSub}>HELP ME</Text>
        </TouchableOpacity>
      </Animated.View>

      {location && (
        <View style={styles.locCard}>
          <Ionicons name="location" size={22} color={COLORS.success} />
          <Text style={styles.locText}>📍 Location ready to share</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => Linking.openURL(`tel:${CAREGIVER_PHONE}`)}>
          <Ionicons name="call" size={32} color={COLORS.success} />
          <Text style={styles.actionLabel}>Call Caregiver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`)}>
          <Ionicons name="medkit" size={32} color={COLORS.danger} />
          <Text style={styles.actionLabel}>Call 911</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertTypes}>
        <Text style={styles.alertTitle}>Alert Types</Text>
        {['🤕 Fall Detected', '😰 Panic Alert', '💊 Missed Medicine'].map(a => (
          <TouchableOpacity key={a} style={styles.alertBtn} onPress={() => sendImmediateAlert('⚠️ Alert', `${a} - ${profile?.name || 'Patient'}`)}>
            <Text style={styles.alertText}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', paddingTop: 56, padding: SPACING.lg },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginBottom: SPACING.xl },
  pulseRing: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(231,76,60,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  sosBtn: { width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.danger, shadowOpacity: 0.5, shadowRadius: 16 },
  sosEmoji: { fontSize: 48 },
  sosLabel: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sosSub: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  locCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, gap: SPACING.xs, elevation: 1 },
  locText: { fontSize: FONTS.small, color: COLORS.subtext },
  actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg, width: '100%' },
  actionBtn: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', elevation: 2 },
  actionLabel: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs },
  alertTypes: { width: '100%' },
  alertTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  alertBtn: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 1 },
  alertText: { fontSize: FONTS.medium, color: COLORS.text },
});
