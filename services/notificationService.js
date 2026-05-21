import { Platform } from 'react-native';

let Notifications = null;

if (Platform.OS !== 'web') {
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
  if (Platform.OS === 'web') {
    if ('Notification' in window) {
      const p = await window.Notification.requestPermission();
      return p === 'granted';
    }
    return false;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminder = async (title, body, triggerDate) => {
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') await requestPermissions();
    const delay = triggerDate.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => new window.Notification(title, { body, icon: '/favicon.ico' }), delay);
    } else {
      new window.Notification(title, { body, icon: '/favicon.ico' });
    }
    return;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { date: triggerDate },
  });
};

export const sendImmediateAlert = (title, body) => {
  if (Platform.OS === 'web') {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, { body });
    } else {
      alert(`${title}\n\n${body}`);
    }
    return;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
};

export const initializeNotifications = () => requestPermissions();
