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
  if (isWeb) {
    if ('Notification' in window) await window.Notification.requestPermission();
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminder = async (title, body, triggerDate, repeat = 'Daily') => {
  if (isWeb) {
    if ('Notification' in window) {
      const permission = await window.Notification.requestPermission();
      if (permission === 'granted') {
        const delay = triggerDate.getTime() - Date.now();
        const fire = () => new window.Notification(title, { body, icon: '/favicon.ico' });
        if (delay > 0) setTimeout(fire, delay);
        else fire();
        // Re-schedule daily/weekly using setInterval approximation
        if (repeat === 'Daily') setInterval(fire, 24 * 60 * 60 * 1000);
        if (repeat === 'Weekly') setInterval(fire, 7 * 24 * 60 * 60 * 1000);
      }
    }
    return 'web-' + Date.now();
  }

  let trigger;
  if (repeat === 'Daily') {
    trigger = { hour: triggerDate.getHours(), minute: triggerDate.getMinutes(), repeats: true };
  } else if (repeat === 'Weekly') {
    trigger = { weekday: triggerDate.getDay() + 1, hour: triggerDate.getHours(), minute: triggerDate.getMinutes(), repeats: true };
  } else {
    trigger = { date: triggerDate };
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger,
  });
};

export const cancelNotification = (id) => {
  if (isWeb || !id || id.startsWith('web-')) return;
  return Notifications.cancelScheduledNotificationAsync(id);
};

export const rescheduleAllReminders = async (reminders) => {
  if (!isWeb) await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of reminders) {
    const [h, m] = (r.time || '08:00').split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);
    if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);
    await scheduleReminder(r.title, `Time for your ${r.type}!`, trigger, r.repeat || 'Daily');
  }
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
