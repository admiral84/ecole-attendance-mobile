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

import { supabase } from "../../services/supabase";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  // Check that the OTP verification created a session
  useEffect(() => {
    checkRecoverySession();
  }, []);

  const checkRecoverySession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        return;
      }

      setHasRecoverySession(!!session);
    } catch (_error) {
      // silently ignore
    } finally {
      setCheckingSession(false);
    }
  };

  const handleResetPassword = async () => {
    // Make sure recovery session exists
    if (!hasRecoverySession) {
      Alert.alert(
        "Session expirée",
        "Votre session de récupération est invalide ou a expiré. Veuillez recommencer.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/forgot-password"),
          },
        ],
      );
      return;
    }

    // Check fields
    if (!password || !confirmPassword) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
      return;
    }

    // Check password length
    if (password.length < 6) {
      Alert.alert(
        "Mot de passe invalide",
        "Le mot de passe doit contenir au moins 6 caractères.",
      );
      return;
    }

    // Check matching passwords
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        Alert.alert(
          "Erreur",
          error.message || "Impossible de modifier le mot de passe.",
        );

        return;
      }

      Alert.alert(
        "Mot de passe modifié",
        "Votre mot de passe a été réinitialisé avec succès.",
        [
          {
            text: "Se connecter",
            onPress: async () => {
              // Optional: sign out the recovery session
              await supabase.auth.signOut();

              router.replace("/login");
            },
          },
        ],
      );
    } catch (_error) {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />

        <Text style={styles.loadingText}>Vérification de la session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animatable.View
        animation="fadeInDown"
        duration={800}
        style={styles.header}
      >
        <View style={styles.iconCircle}>
          <Icon name="lock-reset" size={60} color="#6c63ff" />
        </View>

        <Text style={styles.title}>Nouveau mot de passe</Text>

        <Text style={styles.subtitle}>
          Créez un nouveau mot de passe sécurisé
        </Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={800}
        delay={200}
        style={styles.form}
      >
        {!hasRecoverySession && (
          <View style={styles.warningBox}>
            <Icon name="warning" size={20} color="#d97706" />

            <Text style={styles.warningText}>
              Votre session de récupération est introuvable. Veuillez
              recommencer la procédure.
            </Text>
          </View>
        )}

        {/* New password */}
        <View style={styles.inputContainer}>
          <Icon
            name="lock-outline"
            size={22}
            color="#6c63ff"
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading && hasRecoverySession}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Icon
              name={showPassword ? "visibility" : "visibility-off"}
              size={22}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        <View style={styles.inputContainer}>
          <Icon
            name="lock-outline"
            size={22}
            color="#6c63ff"
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading && hasRecoverySession}
          />

          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            <Icon
              name={showConfirmPassword ? "visibility" : "visibility-off"}
              size={22}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        {/* Password requirements */}
        <View style={styles.requirements}>
          <Text style={styles.requirementText}>• Minimum 6 caractères</Text>

          <Text style={styles.requirementText}>
            • Les deux mots de passe doivent être identiques
          </Text>
        </View>

        {/* Reset button */}
        <TouchableOpacity
          style={[
            styles.resetButton,
            (loading || !hasRecoverySession) && styles.disabledButton,
          ]}
          onPress={handleResetPassword}
          disabled={loading || !hasRecoverySession}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon
                name="check"
                size={22}
                color="#fff"
                style={styles.buttonIcon}
              />

              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Back */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/login")}
          disabled={loading}
        >
          <Icon name="arrow-back" size={20} color="#6c63ff" />

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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  loadingText: {
    marginTop: 15,
    color: "#777",
    fontSize: 15,
  },

  header: {
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 25,
  },

  iconCircle: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: "#f0efff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 22,
  },

  form: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  warningText: {
    flex: 1,
    color: "#92400e",
    fontSize: 13,
    marginLeft: 8,
    lineHeight: 18,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 56,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },

  requirements: {
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 5,
  },

  requirementText: {
    color: "#999",
    fontSize: 13,
    marginBottom: 4,
  },

  resetButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 15,
    elevation: 3,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonIcon: {
    marginRight: 8,
  },

  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  backButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
  },

  backButtonText: {
    color: "#6c63ff",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 6,
  },
});
