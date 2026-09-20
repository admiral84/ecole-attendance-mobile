import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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
    selectedSubjectName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subjects`);
      const data = await response.json();

      if (data.success) {
        setSubjects(data.subjects);
      } else {
        Alert.alert("Erreur", "Impossible de charger les matières");
      }
    } catch (_error) {
      Alert.alert("Erreur", "Impossible de charger les matières");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubjectSelect = (subject) => {
    setFormData((prev) => ({
      ...prev,
      code_matiere: subject.code_matiere,
      selectedSubjectName: subject.libelle,
    }));
    setShowSubjectModal(false);
  };

  const handleRegister = async () => {
    const {
      password,
      confirmPassword,
      matricule,
      nom,
      prenom,
      email,
      phone,
      code_matiere,
    } = formData;

    if (
      !matricule ||
      !nom ||
      !prenom ||
      !email ||
      !phone ||
      !code_matiere ||
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

    const requestData = {
      email: email,
      password: password,
      userData: {
        matricule: matricule,
        nom: nom,
        prenom: prenom,
        phone: phone,
        code_matiere: code_matiere,
      },
    };

    const result = await register(requestData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Inscription réussie!",
        "Votre compte a été créé. En attente d'approbation par l'administrateur.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
      );
    } else {
      Alert.alert("Erreur", result.error || "Une erreur est survenue");
    }
  };

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectItem}
      onPress={() => handleSubjectSelect(item)}
    >
      <Icon
        name="menu-book"
        size={20}
        color="#6c63ff"
        style={styles.subjectIcon}
      />
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.libelle}</Text>
        <Text style={styles.subjectCode}>Code: {item.code_matiere}</Text>
      </View>
    </TouchableOpacity>
  );

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

          {/* Subject Selector */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowSubjectModal(true)}
            disabled={subjectsLoading}
          >
            <Icon name="menu-book" size={20} color="#6c63ff" />
            <View style={styles.subjectSelector}>
              {subjectsLoading ? (
                <ActivityIndicator size="small" color="#6c63ff" />
              ) : formData.selectedSubjectName ? (
                <Text style={styles.selectedSubjectName}>
                  {formData.selectedSubjectName}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>
                  Sélectionner une matière
                </Text>
              )}
            </View>
            <Icon name="arrow-drop-down" size={24} color="#6c63ff" />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
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

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une matière</Text>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {subjects.length > 0 ? (
              <FlatList
                data={subjects}
                renderItem={renderSubjectItem}
                keyExtractor={(item) => item.code_matiere}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="info-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Aucune matière disponible</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  subjectSelector: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  selectedSubjectName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalList: {
    paddingBottom: 20,
  },
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subjectIcon: {
    marginRight: 15,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  subjectCode: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
});
