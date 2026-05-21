import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Linking, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { updateLocation } from '../../services/firestoreService';
import { sendImmediateAlert } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const CAREGIVER_PHONE = '+1234567890';

export default function EmergencyScreen() {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Get location safely
    const getLocation = async () => {
      try {
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
              () => {}
            );
          }
        } else {
          const Location = require('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
          }
        }
      } catch (e) {}
    };
    getLocation();
  }, []);

  useEffect(() => {
    if (sosActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [sosActive]);

  const triggerSOS = async () => {
    setSosActive(true);

    // Vibrate on native
    if (Platform.OS !== 'web') {
      const { Vibration } = require('react-native');
      Vibration.vibrate([0, 500, 200, 500]);
    }

    // Update location in Firestore
    if (location && user) {
      try { await updateLocation(user.uid, location); } catch (e) {}
    }

    // Send alert
    await sendImmediateAlert(
      '🆘 SOS ALERT',
      `${profile?.name || 'Patient'} needs help! Check their location immediately.`
    );

    Alert.alert(
      '🆘 SOS Activated!',
      'Your caregiver has been notified. Call them now?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSosActive(false) },
        {
          text: '📞 Call Caregiver',
          onPress: () => {
            Linking.openURL(`tel:${CAREGIVER_PHONE}`);
            setSosActive(false);
          },
        },
      ]
    );
  };

  const ALERT_TYPES = [
    { label: '🤕 Fall Detected', msg: 'Patient may have fallen' },
    { label: '😰 Panic Alert', msg: 'Patient is in panic' },
    { label: '💊 Missed Medicine', msg: 'Patient missed their medicine' },
  ];

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
          <Ionicons name="location" size={20} color={COLORS.success} />
          <Text style={styles.locText}>📍 Location ready to share</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
          onPress={() => Linking.openURL(`tel:${CAREGIVER_PHONE}`)}
        >
          <Ionicons name="call" size={30} color={COLORS.success} />
          <Text style={styles.actionLabel}>Call Caregiver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
          onPress={() => Linking.openURL('tel:911')}
        >
          <Ionicons name="medkit" size={30} color={COLORS.danger} />
          <Text style={styles.actionLabel}>Call 911</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Quick Alerts</Text>
      {ALERT_TYPES.map(a => (
        <TouchableOpacity
          key={a.label}
          style={styles.alertBtn}
          onPress={() => sendImmediateAlert('⚠️ Alert', `${a.msg} — ${profile?.name || 'Patient'}`)}
        >
          <Text style={styles.alertText}>{a.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.subtext} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', paddingTop: 56, padding: SPACING.lg,
  },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.small, color: COLORS.subtext, textAlign: 'center', marginBottom: SPACING.xl },
  pulseRing: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(231,76,60,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl,
  },
  sosBtn: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: COLORS.danger, shadowOpacity: 0.4, shadowRadius: 16,
  },
  sosEmoji: { fontSize: 46 },
  sosLabel: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sosSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  locCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.lg,
    gap: SPACING.xs, elevation: 1,
  },
  locText: { fontSize: FONTS.small, color: COLORS.subtext },
  actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg, width: '100%' },
  actionBtn: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', elevation: 2 },
  actionLabel: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.text, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  alertBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, width: '100%', elevation: 1,
  },
  alertText: { fontSize: FONTS.medium, color: COLORS.text },
});
