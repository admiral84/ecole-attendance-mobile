import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    code_matiere: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    const { password, confirmPassword, ...userData } = formData;

    if (
      !userData.matricule ||
      !userData.nom ||
      !userData.prenom ||
      !userData.email ||
      !userData.phone ||
      !userData.code_matiere ||
      !password
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères",
      );
      return;
    }

    setLoading(true);
    const result = await register({ ...userData, password });
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Inscription réussie!",
        "Votre compte a été créé. En attente d&apos;approbation par l&apos;administrateur.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
      );
    } else {
      Alert.alert("Erreur", result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animatable.View
          animation="fadeInDown"
          duration={1000}
          style={styles.header}
        >
          <Icon name="person-add" size={60} color="#6c63ff" />
          <Text style={styles.title}>Inscription Enseignant</Text>
          <Text style={styles.subtitle}>Créez votre compte professionnel</Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          delay={200}
          style={styles.form}
        >
          <View style={styles.inputContainer}>
            <Icon name="badge" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Matricule"
              value={formData.matricule}
              onChangeText={(text) => handleChange("matricule", text)}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Icon name="person" size={20} color="#6c63ff" />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={formData.nom}
                onChangeText={(text) => handleChange("nom", text)}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Icon name="person-outline" size={20} color="#6c63ff" />
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                value={formData.prenom}
                onChangeText={(text) => handleChange("prenom", text)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="subject" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Code Matière"
              value={formData.code_matiere}
              onChangeText={(text) => handleChange("code_matiere", text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry={!showPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Confirmer mot de passe"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>S&apos;inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà inscrit? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </ScrollView>
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
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  registerButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#999",
    fontSize: 14,
  },
  loginLink: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
