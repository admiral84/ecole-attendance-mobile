import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();

  // Check if running in Expo Go (development mode)
  const isExpoGo = Constants.appOwnership === "expo";

  // Register device token function
  const registerDeviceToken = async (userId) => {
    // BYPASS: Skip token registration in Expo Go

    try {
      console.log("========== DEVICE TOKEN REGISTRATION START ==========");
      console.log("User ID:", userId);
      console.log("User ID type:", typeof userId);

      // Check if device is physical (not simulator)
      if (!Device.isDevice) {
        console.log("Not a physical device");
        Alert.alert(
          "Warning",
          "Push notifications only work on physical devices",
        );
        return false;
      }
      console.log("Device is physical");

      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      console.log("Existing permission status:", existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("New permission status:", status);
      }

      if (finalStatus !== "granted") {
        console.log("Permission denied");
        Alert.alert(
          "Permission denied",
          "Please enable notifications to receive alerts",
        );
        return false;
      }
      console.log("Permission granted");

      // Get Expo push token - only in production build
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error("No projectId found for push notifications");
        Alert.alert("Error", "Push notification configuration missing");
        return false;
      }

      const expoToken = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })
      ).data;
      console.log("Expo Push Token:", expoToken);

      // Get device name
      const deviceName = `${Device.deviceName || "Unknown"} - ${Device.osName || "Unknown"}`;
      console.log("Device name:", deviceName);

      // Save to Supabase device_tokens table
      console.log("Attempting to save to Supabase...");

      const { data, error } = await supabase
        .from("device_tokens")
        .upsert(
          {
            user_id: userId,
            expo_token: expoToken,
            device_name: deviceName,
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "expo_token",
          },
        )
        .select();

      if (error) {
        console.error("ERROR saving device token:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        Alert.alert("Database Error", `Error: ${error.message}`);
        return false;
      } else {
        console.log("SUCCESS! Device token saved:", data);
        console.log("========== DEVICE TOKEN REGISTRATION END ==========");
        return true;
      }
    } catch (error) {
      console.error("CATCH ERROR:", error);
      // Don't show alert in development mode
      if (!isExpoGo) {
        Alert.alert("Error", `Unexpected error: ${error.message}`);
      }
      return false;
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)/dashboard");
    }
  }, [user, authLoading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    console.log("Attempting login with email:", email);

    const result = await login(email, password);
    console.log("Login result:", result);

    if (result.success) {
      console.log("Login successful!");

      // Get the current authenticated user directly from Supabase
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting current user:", userError);
        Alert.alert("Erreur", "Impossible de récupérer l'utilisateur");
        setLoading(false);
        return;
      }

      if (currentUser) {
        console.log("Current user ID:", currentUser.id);
        console.log("Current user email:", currentUser.email);

        // WAIT for device token registration to complete
        const tokenRegistered = await registerDeviceToken(currentUser.id);
        console.log("Token registration result:", tokenRegistered);

        if (tokenRegistered) {
          console.log(
            "Token registered successfully, navigating to dashboard...",
          );
        } else {
          console.log("Token registration failed, but continuing...");
        }
      } else {
        console.log("No current user found");
      }

      // Navigate after token registration is complete
      router.replace("/(tabs)/dashboard");
    } else {
      console.error("Login failed:", result.error);
      Alert.alert("Erreur de connexion", result.error);
    }

    setLoading(false);
  };

  const handleForgotPassword = () => {
    router.push("forgot-password");
  };

  const handleRegister = () => {
    router.push("register");
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Animatable.View animation="bounceIn" duration={1500}>
          <Icon name="school" size={80} color="#fff" />
        </Animatable.View>
        <Animatable.Text
          animation="fadeInUp"
          duration={1000}
          style={styles.title}
        >
          Bienvenue Enseignant
        </Animatable.Text>
        <Animatable.Text
          animation="fadeInUp"
          duration={1000}
          delay={200}
          style={styles.subtitle}
        >
          Connectez-vous pour continuer
        </Animatable.Text>
      </View>

      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        delay={400}
        style={styles.footer}
      >
        <View style={styles.inputContainer}>
          <Icon
            name="email"
            size={20}
            color="#6c63ff"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon
            name="lock"
            size={20}
            color="#6c63ff"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLink}>S&apos;inscrire</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6c63ff",
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
    opacity: 0.9,
  },
  footer: {
    flex: 1.5,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
