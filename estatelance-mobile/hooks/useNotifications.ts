import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { getToken } from '../apollo/client';

const PROJECT_ID = 'ee690488-e7f7-4d8c-ad9f-aeb8b068512d';

// ── Native modullarni xavfsiz yuklash ───────────────────────────────────────
// Expo Go (SDK 53+) push native modullarni o'z ichiga olmaydi. Statik import
// qilsak butun ilova qulaydi. Shuning uchun require'ni try/catch ichida qilamiz.
// Modul yo'q bo'lsa — push shunchaki ishlamaydi, ilova esa normal ishlayveradi.
let Notifications: any = null;
let Device: any = null;
try { Notifications = require('expo-notifications'); } catch { /* Expo Go — push yo'q */ }
try { Device = require('expo-device'); } catch { /* Expo Go — device yo'q */ }

const pushAvailable = () => !!Notifications;

// Foreground'da kelgan bildirishnomani ham ko'rsatish + ovoz (Telegram kabi)
if (pushAvailable()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList:   true,
        shouldShowAlert:  true,
        shouldPlaySound:  true,
        shouldSetBadge:   true,
        priority:         Notifications.AndroidNotificationPriority?.MAX,
      }),
    });
  } catch { /* e'tiborsiz */ }
}

export async function registerForPushNotifications(): Promise<string | null> {
  // Native modul yo'q (Expo Go) yoki simulator — push ishlamaydi
  if (!pushAvailable() || !Device?.isDevice) {
    console.log('[Push] Mavjud emas (Expo Go yoki simulator) — skip');
    return null;
  }

  try {
    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('bufu-default', {
        name:             'BuFu Bildirishnomalar',
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#6366f1',
        sound:            'notification.wav',
        enableVibrate:    true,
        showBadge:        true,
      });
    }

    // Ruxsat so'rash
    const existing: any = await Notifications.getPermissionsAsync();
    let granted: boolean = existing.granted ?? existing.status === 'granted';

    if (!granted) {
      const req: any = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowProvisional: false },
      });
      granted = req.granted ?? req.status === 'granted';
    }

    if (!granted) {
      console.log('[Push] Ruxsat berilmadi');
      return null;
    }

    // Expo Push Token olish
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId ??
      PROJECT_ID;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Push] Token:', token);

    // Backend'ga saqlash
    const accessToken = await getToken();
    if (accessToken && token) {
      fetch('https://api.bufu.uz/graphql', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: `mutation { updateProfile(input: { expoPushToken: "${token}" }) { _id } }`,
        }),
      }).catch(() => {});
    }
    return token;
  } catch (err) {
    console.log('[Push] Xato:', err);
    return null;
  }
}

export function useNotifications(
  onNotification?: (n: any) => void,
) {
  const notifListener    = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Native modul yo'q bo'lsa — hech narsa qilmaymiz (ilova qulamaydi)
    if (!pushAvailable()) return;

    registerForPushNotifications();

    try {
      // Foreground'da bildirishnoma kelganda
      notifListener.current = Notifications.addNotificationReceivedListener((n: any) => {
        console.log('[Push] Received:', n.request.content.title);
        onNotification?.(n);
      });

      // Foydalanuvchi bildirishnomaga bosganda — tegishli sahifaga o'tkazish
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data as any;
        console.log('[Push] Tapped:', data);
        try {
          const path = data?.linkPath;
          if (typeof path === 'string' && path.startsWith('/')) {
            router.push(path as any);
          } else {
            router.push('/(tabs)/notifications' as any);
          }
        } catch { /* routing xatosi — e'tiborsiz */ }
      });
    } catch { /* listener qo'shib bo'lmadi — e'tiborsiz */ }

    return () => {
      try {
        notifListener.current?.remove();
        responseListener.current?.remove();
      } catch { /* e'tiborsiz */ }
    };
  }, []);
}
