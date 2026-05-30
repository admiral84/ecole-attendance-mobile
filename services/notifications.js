import * as Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
      // Get the project ID from expo constants - FIXED
      const projectId =
        Constants.default?.expoConfig?.extra?.eas?.projectId ||
        Constants.default?.expoConfig?.projectId ||
        Constants.default?.projectId ||
        "your-project-id";

      token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log("Expo Push Token:", token.data);

      // Save token to database
      if (token.data && userId) {
        await savePushToken(userId, token.data);
      }
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

// Save push token to database
async function savePushToken(userId, expoToken) {
  try {
    // Check if token already exists
    const { data: existingToken } = await supabase
      .from("device_tokens")
      .select("id")
      .eq("expo_token", expoToken)
      .single();

    if (existingToken) {
      // Update existing token
      await supabase
        .from("device_tokens")
        .update({
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingToken.id);
      console.log("Updated existing token");
    } else {
      // Insert new token
      await supabase.from("device_tokens").insert({
        user_id: userId,
        expo_token: expoToken,
        device_name: Device.deviceName || "Unknown Device",
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log("Saved new token");
    }
  } catch (error) {
    console.error("Error saving push token:", error);
  }
}

// Send notification to specific user
export async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    // Get user's device token
    const { data: tokens, error } = await supabase
      .from("device_tokens")
      .select("expo_token")
      .eq("user_id", userId)
      .gte(
        "last_active",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      console.log("No active tokens found for user:", userId);
      return;
    }

    // Remove duplicate tokens
    const uniqueTokens = [
      ...new Map(tokens.map((t) => [t.expo_token, t])).values(),
    ];

    // Send notifications to all user's devices
    const messages = uniqueTokens.map((token) => ({
      to: token.expo_token,
      sound: "default",
      title: title,
      body: body,
      data: data,
      priority: "high",
    }));

    // Send to Expo push notification service
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    // Handle invalid tokens
    if (result.data) {
      for (const [index, ticket] of result.data.entries()) {
        if (ticket?.error && ticket.error === "DeviceNotRegistered") {
          // Remove invalid token
          await supabase
            .from("device_tokens")
            .delete()
            .eq("expo_token", messages[index].to);
          console.log("Removed invalid token:", messages[index].to);
        }
      }
    }

    console.log("Notification sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

// Send absence notification to teacher
export async function sendAbsenceNotificationToTeacher(
  teacherId,
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

  return await sendNotificationToUser(teacherId, title, body, data);
}

// Send return notification to teacher
export async function sendReturnNotificationToTeacher(
  teacherId,
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

  return await sendNotificationToUser(teacherId, title, body, data);
}

// Send justified absence notification
export async function sendJustifiedAbsenceNotification(
  teacherId,
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

  return await sendNotificationToUser(teacherId, title, body, data);
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
