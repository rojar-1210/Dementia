import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

let Notifications = null;
if (!isWeb) {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const requestPermissions = async () => {
  if (isWeb) return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminder = async (title, body, triggerDate) => {
  if (isWeb) {
    // Web fallback: use browser Notification API
    if ('Notification' in window) {
      const permission = await window.Notification.requestPermission();
      if (permission === 'granted') {
        const delay = triggerDate.getTime() - Date.now();
        if (delay > 0) setTimeout(() => new window.Notification(title, { body }), delay);
        else new window.Notification(title, { body });
      }
    }
    return;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { date: triggerDate },
  });
};

export const cancelNotification = (id) => {
  if (isWeb) return;
  return Notifications.cancelScheduledNotificationAsync(id);
};

export const sendImmediateAlert = (title, body) => {
  if (isWeb) {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, { body });
    } else {
      alert(`${title}\n${body}`);
    }
    return;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
};

export const initializeNotifications = () => requestPermissions();
