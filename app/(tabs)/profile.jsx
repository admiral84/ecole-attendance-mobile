import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={24} color="#6c63ff" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Non renseigné"}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.prenom?.[0]}
            {user?.nom?.[0]}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.prenom} {user?.nom}
        </Text>
        <Text style={styles.userRole}>{user?.role}</Text>
        <View style={styles.statusBadge}>
          <View
            style={[styles.statusDot, user?.approved && styles.statusApproved]}
          />
          <Text style={styles.statusText}>
            {user?.approved ? "Approuvé" : "En attente d'approbation"}
          </Text>
        </View>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        delay={200}
        style={styles.content}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <InfoRow icon="badge" label="Matricule" value={user?.matricule} />
          <InfoRow icon="email" label="Email" value={user?.email} />
          <InfoRow icon="phone" label="Téléphone" value={user?.phone} />
          <InfoRow
            icon="subject"
            label="Code matière"
            value={user?.code_matiere}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Icon name="class" size={30} color="#6c63ff" />
              <Text style={styles.statBoxValue}>--</Text>
              <Text style={styles.statBoxLabel}>Classes</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="people" size={30} color="#6c63ff" />
              <Text style={styles.statBoxValue}>--</Text>
              <Text style={styles.statBoxLabel}>Élèves</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="schedule" size={30} color="#6c63ff" />
              <Text style={styles.statBoxValue}>--</Text>
              <Text style={styles.statBoxLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#f44336" />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </Animatable.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: "#6c63ff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#6c63ff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff9800",
    marginRight: 8,
  },
  statusApproved: {
    backgroundColor: "#4CAF50",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    marginHorizontal: 5,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  statBoxLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 30,
    elevation: 2,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#f44336",
    fontWeight: "600",
  },
});
