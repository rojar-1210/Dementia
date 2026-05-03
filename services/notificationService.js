import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminder = async (title, body, triggerDate) => {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { date: triggerDate },
  });
};

export const cancelNotification = (id) => Notifications.cancelScheduledNotificationAsync(id);

export const sendImmediateAlert = (title, body) =>
  Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, priority: Notifications.AndroidNotificationPriority.MAX },
    trigger: null,
  });
