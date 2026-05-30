// app/auth/forgot-password.jsx
import { router } from "expo-router";
import { useState } from "react";
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword, emailExists } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer un email valide");
      return;
    }

    setLoading(true);

    try {
      const exists = await emailExists(email);
      if (!exists) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        Alert.alert(
          "Email non trouvé",
          "Cet email n'est pas associé à un compte. Veuillez vérifier votre email.",
        );
        return;
      }

      const result = await resetPassword(email);

      if (result.success) {
        setEmailSent(true);
      } else {
        Alert.alert(
          "Erreur",
          "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer.",
        );
        console.log("Reset password error:", result.error);
      }
    } catch (error) {
      console.error("Error in handleResetPassword:", error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue. Veuillez réessayer plus tard.",
      );
    } finally {
      setLoading(false);
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
        <Icon name="lock-reset" size={70} color="#6c63ff" />
        <Text style={styles.title}>Mot de passe oublié?</Text>
        <Text style={styles.subtitle}>
          Entrez votre email pour réinitialiser votre mot de passe
        </Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        delay={200}
        style={styles.form}
      >
        {!emailSent ? (
          <>
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
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Envoyer l&apos;email</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Animatable.View
              animation="pulse"
              iterationCount={2}
              style={styles.successIcon}
            >
              <Icon name="check-circle" size={80} color="#4CAF50" />
            </Animatable.View>
            <Text style={styles.successText}>Email envoyé!</Text>
            <Text style={styles.successSubtext}>
              Un lien de réinitialisation a été envoyé à {email}.{"\n\n"}📧
              Vérifiez votre boîte de réception (et vos spams).
              {"\n"}🔗 Le lien est valable 24 heures.
            </Text>
          </>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  form: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 20,
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
  resetButton: {
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
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#6c63ff",
    fontSize: 16,
    fontWeight: "500",
  },
  successIcon: {
    alignItems: "center",
    marginBottom: 20,
  },
  successText: {
    textAlign: "center",
    fontSize: 18,
    color: "#4CAF50",
    marginBottom: 10,
    fontWeight: "bold",
  },
  successSubtext: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
});
