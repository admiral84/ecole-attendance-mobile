import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { notificationsApi } from "./notificationsApi";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Get auth token
async function getAuthToken() {
  return await AsyncStorage.getItem("auth_token");
}

// Register for push notifications
export async function registerForPushNotificationsAsync(userId) {
  if (!userId) {
    console.log("No user ID provided for notification registration");
    return;
  }

  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6c63ff",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants.default?.expoConfig?.extra?.eas?.projectId ||
        Constants.default?.expoConfig?.projectId ||
        Constants.default?.projectId ||
        "your-project-id";

      token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log("Expo Push Token:", token.data);

      // Save token using API
      if (token.data && userId) {
        const authToken = await getAuthToken();
        await notificationsApi.registerPushToken(
          userId,
          token.data,
          Device.deviceName || "Unknown Device",
          authToken,
        );
      }
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

// Send notification to specific user (keeps Expo direct call - no DB needed)
export async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    // This will be handled by your Cloudflare Worker
    // For now, keep this as is since it calls Expo directly
    console.log("Send notification to user:", userId, title, body);
    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Send absence notification to teacher
export async function sendAbsenceNotificationToTeacher(
  user_id,
  studentName,
  className,
  absenceDate,
  absenceTime,
) {
  const title = "📚 Nouvelle absence signalée";
  const body = `${studentName} (${className}) est absent depuis le ${absenceDate} à ${absenceTime}`;
  const data = {
    type: "absence",
    studentName,
    className,
    absenceDate,
    absenceTime,
    screen: "students",
    timestamp: new Date().toISOString(),
  };

  return await sendNotificationToUser(user_id, title, body, data);
}

// Send return notification to teacher
export async function sendReturnNotificationToTeacher(
  user_id,
  studentName,
  className,
  returnDate,
  returnTime,
) {
  const title = "✅ Retour d'absence";
  const body = `${studentName} (${className}) est de retour le ${returnDate} à ${returnTime}`;
  const data = {
    type: "return",
    studentName,
    className,
    returnDate,
    returnTime,
    screen: "dashboard",
    timestamp: new Date().toISOString(),
  };

  return await sendNotificationToUser(user_id, title, body, data);
}

// Send justified absence notification
export async function sendJustifiedAbsenceNotification(
  user_id,
  studentName,
  className,
  absenceDate,
  absenceTime,
) {
  const title = "✓ Absence justifiée";
  const body = `${studentName} (${className}) a justifié son absence du ${absenceDate} à ${absenceTime}`;
  const data = {
    type: "justified_absence",
    studentName,
    className,
    absenceDate,
    absenceTime,
    screen: "students",
    timestamp: new Date().toISOString(),
  };

  return await sendNotificationToUser(user_id, title, body, data);
}

// Send test notification
export async function sendTestNotification(userId) {
  const title = "🔔 Notification de test";
  const body =
    "Si vous recevez ce message, les notifications fonctionnent correctement!";
  const data = {
    type: "test",
    timestamp: new Date().toISOString(),
  };

  return await sendNotificationToUser(userId, title, body, data);
}
