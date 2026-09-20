import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { registerForPushNotificationsAsync } from "../services/notifications";
import { useAuth } from "./useAuth";

export function useNotifications() {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (user?.user_id) {
      registerForPushNotificationsAsync(user.user_id);
    }

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;

        // Show alert for important notifications
        if (data?.type === "absence") {
          Alert.alert(title, body, [{ text: "OK" }]);
        }
      });

    // Listen for when user taps on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;

        // Navigate based on notification type
        if (data?.screen === "students") {
          router.push("/(tabs)/classes");
        } else if (data?.screen === "dashboard") {
          router.push("/(tabs)/dashboard");
        } else if (data?.type === "absence") {
          router.push("/(tabs)/students");
        } else if (data?.type === "return") {
          router.push("/(tabs)/dashboard");
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.user_id]);

  return {};
}
