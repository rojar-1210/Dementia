import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllScheduledNotifications, cancelAllNotifications, cancelNotification } from '../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export default function NotificationDebugScreen() {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    const scheduled = await getAllScheduledNotifications();
    setNotifications(scheduled);
  };

  useEffect(() => { load(); }, []);

  const handleCancelAll = () => {
    Alert.alert('Cancel All', 'Remove all scheduled notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove All', style: 'destructive', onPress: async () => { await cancelAllNotifications(); load(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Scheduled Notifications</Text>
        <Text style={styles.subtitle}>{notifications.length} active</Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={load}>
        <Ionicons name="refresh" size={20} color={COLORS.white} />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      {notifications.length > 0 && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelAll}>
          <Text style={styles.cancelText}>Cancel All Notifications</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔕</Text>
            <Text style={styles.emptyText}>No scheduled notifications</Text>
          </View>
        )}
        {notifications.map((notif, i) => (
          <View key={notif.identifier} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{notif.content.title}</Text>
              <Text style={styles.cardId}>#{notif.identifier.slice(0, 8)}</Text>
              <TouchableOpacity onPress={async () => { await cancelNotification(notif.identifier); setNotifications(prev => prev.filter(n => n.identifier !== notif.identifier)); }}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardBody}>{notif.content.body}</Text>
            {notif.trigger && (
              <View style={styles.triggerBox}>
                <Text style={styles.triggerLabel}>Trigger:</Text>
                {notif.trigger.type === 'calendar' && (
                  <Text style={styles.triggerText}>
                    {notif.trigger.repeats ? '🔁 Repeats' : '⏰ Once'} at{' '}
                    {notif.trigger.hour?.toString().padStart(2, '0')}:
                    {notif.trigger.minute?.toString().padStart(2, '0')}
                    {notif.trigger.weekday && ` (Day ${notif.trigger.weekday})`}
                  </Text>
                )}
                {notif.trigger.type === 'date' && (
                  <Text style={styles.triggerText}>
                    📅 {new Date(notif.trigger.value * 1000).toLocaleString()}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg, paddingTop: 56, backgroundColor: COLORS.primary, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, marginBottom: SPACING.md },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.sm, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, gap: SPACING.xs, justifyContent: 'center' },
  refreshText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.white },
  cancelBtn: { backgroundColor: COLORS.danger, borderRadius: RADIUS.md, padding: SPACING.sm, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, alignItems: 'center' },
  cancelText: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: 0 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: FONTS.large, color: COLORS.subtext, marginTop: SPACING.sm },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  cardTitle: { fontSize: FONTS.large, fontWeight: '600', color: COLORS.text, flex: 1 },
  cardId: { fontSize: 12, color: COLORS.subtext, fontFamily: 'monospace' },
  cardBody: { fontSize: FONTS.small, color: COLORS.subtext, marginBottom: SPACING.xs },
  triggerBox: { backgroundColor: COLORS.background, borderRadius: RADIUS.sm, padding: SPACING.xs, marginTop: SPACING.xs },
  triggerLabel: { fontSize: 12, fontWeight: '600', color: COLORS.subtext, marginBottom: 2 },
  triggerText: { fontSize: FONTS.small, color: COLORS.text },
});
