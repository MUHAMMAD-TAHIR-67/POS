import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const messaging = getMessaging();

export const requestPermission = async () => {
  const token = await getToken(messaging, {
    vapidKey: 'YOUR-VAPID-KEY-HERE'
  });
  if (token) {
    console.log('Token received: ', token);
  }
};

onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
});
