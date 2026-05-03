import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Linking, Vibration, Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { updateLocation } from '../../services/firestoreService';
import { sendImmediateAlert } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

// Replace with caregiver's phone number
const CAREGIVER_PHONE = '+1234567890';

export default function EmergencyScreen() {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const pulse = useState(new Animated.Value(1))[0];

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [sosActive]);

  const triggerSOS = async () => {
    setSosActive(true);
    Vibration.vibrate([0, 500, 200, 500]);

    // Update location in Firestore
    if (location && user) {
      await updateLocation(user.uid, location);
    }

    // Send push notification
    await sendImmediateAlert(
      '🆘 SOS ALERT',
      `${profile?.name || 'Patient'} needs help! Check their location immediately.`
    );

    Alert.alert(
      '🆘 SOS Activated',
      'Your caregiver has been notified. Do you want to call them now?',
      [
        { text: 'Cancel', onPress: () => setSosActive(false) },
        {
          text: '📞 Call Now',
          onPress: () => {
            Linking.openURL(`tel:${CAREGIVER_PHONE}`);
            setSosActive(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>Press the button below in case of emergency</Text>

      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity style={styles.sosButton} onPress={triggerSOS} activeOpacity={0.8}>
          <Text style={styles.sosEmoji}>🆘</Text>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubText}>HELP ME</Text>
        </TouchableOpacity>
      </Animated.View>

      {location && (
        <View style={styles.locationCard}>
          <Ionicons name="location" size={24} color={COLORS.success} />
          <Text style={styles.locationText}>
            Location ready: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
          onPress={() => Linking.openURL(`tel:${CAREGIVER_PHONE}`)}
        >
          <Ionicons name="call" size={32} color={COLORS.success} />
          <Text style={styles.actionLabel}>Call Caregiver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
          onPress={() => Linking.openURL('tel:911')}
        >
          <Ionicons name="medkit" size={32} color={COLORS.secondary} />
          <Text style={styles.actionLabel}>Call 911</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        SOS will notify your caregiver and share your current location automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.lg,
  },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.medium, color: COLORS.subtext, textAlign: 'center', marginBottom: SPACING.xl },
  pulseRing: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(231,76,60,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl,
  },
  sosButton: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: COLORS.danger,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: COLORS.danger, shadowOpacity: 0.5, shadowRadius: 12,
  },
  sosEmoji: { fontSize: 48 },
  sosText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  sosSubText: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg,
    gap: SPACING.xs, elevation: 1,
  },
  locationText: { fontSize: FONTS.small, color: COLORS.subtext },
  actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  actionBtn: {
    flex: 1, borderRadius: RADIUS.md, padding: SPACING.lg,
    alignItems: 'center', elevation: 2,
  },
  actionLabel: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs },
  note: { fontSize: FONTS.small, color: COLORS.subtext, textAlign: 'center', paddingHorizontal: SPACING.lg },
});
