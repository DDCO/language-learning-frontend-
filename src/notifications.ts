import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { registerDeviceToken } from './api/notifications';

const BACKGROUND_TASK = 'll-background-refresh';

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) {
    const asked = await Notifications.requestPermissionsAsync();
    if (!asked.granted) {
      return;
    }
  }

  const pushToken = await Notifications.getExpoPushTokenAsync();
  await registerDeviceToken(pushToken.data, Platform.OS === 'ios' ? 'ios' : 'android');

  await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
    minimumInterval: 60 * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
