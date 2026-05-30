import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { useAuth } from './useAuth';
import { Platform, Alert } from 'react-native';

export function useNotifications() {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (user?.user_id) {
      registerForPushNotificationsAsync(user.user_id);
    }

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      const { title, body, data } = notification.request.content;
      
      // Show alert for important notifications
      if (data?.type === 'absence') {
        Alert.alert(
          title,
          body,
          [
            { text: 'OK', onPress: () => console.log('OK Pressed') }
          ]
        );
      }
    });

    // Listen for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      
      console.log('Notification tapped:', data);
      
      // Navigate based on notification type
      if (data?.screen === 'students') {
        router.push('/(tabs)/classes');
      } else if (data?.screen === 'dashboard') {
        router.push('/(tabs)/dashboard');
      } else if (data?.type === 'absence') {
        router.push('/(tabs)/students');
      } else if (data?.type === 'return') {
        router.push('/(tabs)/dashboard');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.user_id]);

  return {};
}