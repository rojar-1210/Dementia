import * as Notifications from 'expo-notifications';

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
    content: { title, body, sound: true },
    trigger: null,
  });

export const initializeNotifications = () => requestPermissions();
