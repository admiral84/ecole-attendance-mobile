// app/auth/VerifyOtpScreen.jsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";

import { supabase } from "../../services/supabase";

const OTP_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const { email: rawEmail } = useLocalSearchParams();
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail || "";
  const inputRef = useRef(null);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value) => {
    setOtp(value.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH));
  };

  const handleVerifyOtp = async () => {
    if (!email) {
      Alert.alert("Erreur", "Adresse email manquante. Veuillez recommencer.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      Alert.alert(
        "Code invalide",
        `Veuillez entrer le code OTP à ${OTP_LENGTH} chiffres.`,
      );
      return;
    }

    setLoading(true);
    try {
      // This is OTP verification for password recovery, not a magic link.
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "recovery",
      });

      if (error) {
        Alert.alert(
          "Code incorrect",
          "Le code est incorrect ou a expiré. Veuillez réessayer.",
        );
        return;
      }

      // verifyOtp creates the recovery session. The next screen should call:
      // supabase.auth.updateUser({ password: newPassword })
      router.replace("/reset-password");
    } catch (_error) {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || countdown > 0 || resending || loading) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        Alert.alert("Erreur", "Impossible de renvoyer le code OTP.");
        return;
      }

      setOtp("");
      setCountdown(RESEND_COOLDOWN_SECONDS);
      Alert.alert(
        "Code renvoyé",
        "Un nouveau code OTP a été envoyé à votre email.",
      );
    } catch (_error) {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.header}
      >
        <Icon name="mark-email-read" size={70} color="#6c63ff" />
        <Text style={styles.title}>Vérifier le code</Text>
        <Text style={styles.subtitle}>
          Entrez le code OTP envoyé à votre adresse email
        </Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        delay={200}
        style={styles.form}
      >
        <Text style={styles.emailText}>{email}</Text>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.inputContainer}
          onPress={() => inputRef.current?.focus()}
        >
          <Icon
            name="password"
            size={20}
            color="#6c63ff"
            style={styles.inputIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Code OTP"
            placeholderTextColor="#999"
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            editable={!loading}
            autoCorrect={false}
            textContentType="oneTimeCode"
          />
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Le code est valable pendant 10 minutes.
        </Text>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Vérifier le code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOtp}
          disabled={countdown > 0 || resending || loading}
        >
          {resending ? (
            <ActivityIndicator color="#6c63ff" size="small" />
          ) : (
            <Text
              style={[
                styles.resendButtonText,
                (countdown > 0 || loading) && styles.disabledText,
              ]}
            >
              {countdown > 0
                ? `Renvoyer le code dans ${countdown}s`
                : "Renvoyer le code"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading || resending}
        >
          <Text style={styles.backButtonText}>Retour à l&apos;email</Text>
        </TouchableOpacity>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginTop: 20 },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  form: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },
  emailText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 20,
    letterSpacing: 5,
    color: "#333",
    textAlign: "center",
  },
  helperText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 12,
  },
  verifyButton: {
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
  verifyButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { opacity: 0.7 },
  resendButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  resendButtonText: { color: "#6c63ff", fontSize: 15, fontWeight: "500" },
  disabledText: { color: "#aaa" },
  backButton: { marginTop: 8, alignItems: "center" },
  backButtonText: { color: "#6c63ff", fontSize: 16, fontWeight: "500" },
});
