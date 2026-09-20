import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../../../hooks/useAuth";
import { useTeacher } from "../../../../hooks/useTeacher";
import { supabase } from "../../../../services/supabase";

export default function StudentDetailsScreen() {
  const { studentId } = useLocalSearchParams();
  const { user } = useAuth();
  const { getStudentAbsenceHistory, getStudentCurrentAbsence } = useTeacher(
    user?.user_id || "",
  );
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [absenceHistory, setAbsenceHistory] = useState(null);
  const [currentAbsence, setCurrentAbsence] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info, history

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from("eleve")
        .select("*")
        .eq("id_eleve", studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch absence history
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
      const endDate = new Date();

      const historyResult = await getStudentAbsenceHistory(
        studentId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      );

      if (historyResult.success) {
        setAbsenceHistory(historyResult.data);
      }

      // Fetch current absence
      const currentResult = await getStudentCurrentAbsence(studentId);
      if (currentResult.success) {
        setCurrentAbsence(currentResult.data);
      }
    } catch (_error) {
      Alert.alert("Erreur", "Impossible de charger les données de l'élève");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Élève non trouvé</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{student.nom?.[0]}</Text>
          </View>
          <Text style={styles.studentName}>{student.nom}</Text>
          <Text style={styles.studentId}>ID: {student.id_eleve}</Text>
        </View>
        <View style={styles.placeholder} />
      </Animatable.View>

      {/* Status Card */}
      <Animatable.View
        animation="fadeInUp"
        delay={200}
        style={styles.statusCard}
      >
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Icon name="person" size={24} color="#6c63ff" />
            <Text style={styles.statusLabel}>Statut</Text>
            {currentAbsence ? (
              <Text style={styles.statusValueAbsent}>Absent</Text>
            ) : (
              <Text style={styles.statusValuePresent}>Présent</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.statusItem}>
            <Icon name="event" size={24} color="#6c63ff" />
            <Text style={styles.statusLabel}>Dernière absence</Text>
            <Text style={styles.statusValue}>
              {absenceHistory?.absences?.[0]
                ? formatDate(absenceHistory.absences[0].date_deb)
                : "Aucune"}
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "info" && styles.activeTab]}
          onPress={() => setActiveTab("info")}
        >
          <Icon
            name="info"
            size={20}
            color={activeTab === "info" ? "#6c63ff" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "info" && styles.activeTabText,
            ]}
          >
            Informations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Icon
            name="history"
            size={20}
            color={activeTab === "history" ? "#6c63ff" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === "info" ? (
          <Animatable.View animation="fadeIn" style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
              <View style={styles.infoRow}>
                <Icon name="badge" size={20} color="#6c63ff" />
                <Text style={styles.infoLabel}>Matricule:</Text>
                <Text style={styles.infoValue}>{student.id_eleve}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="person" size={20} color="#6c63ff" />
                <Text style={styles.infoLabel}>Nom complet:</Text>
                <Text style={styles.infoValue}>{student.nom}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="calendar-today" size={20} color="#6c63ff" />
                <Text style={styles.infoLabel}>Date de naissance:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(student.date_naissance)}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Informations parentales</Text>
              <View style={styles.infoRow}>
                <Icon name="male" size={20} color="#6c63ff" />
                <Text style={styles.infoLabel}>Père:</Text>
                <Text style={styles.infoValue}>{student.pere || "N/A"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Icon name="phone" size={20} color="#6c63ff" />
                <Text style={styles.infoLabel}>Tél parent:</Text>
                <Text style={styles.infoValue}>
                  {student.parentphone || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>
                Statistiques d&aposabsences
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {absenceHistory?.total || 0}
                  </Text>
                  <Text style={styles.statLabel}>Total absences</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, styles.justifiedText]}>
                    {absenceHistory?.justified || 0}
                  </Text>
                  <Text style={styles.statLabel}>Justifiées</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, styles.unjustifiedText]}>
                    {absenceHistory?.unjustified || 0}
                  </Text>
                  <Text style={styles.statLabel}>Non justifiées</Text>
                </View>
              </View>
              {currentAbsence && (
                <View style={styles.currentAbsenceAlert}>
                  <Icon name="warning" size={20} color="#f44336" />
                  <Text style={styles.currentAbsenceText}>
                    Actuellement absent depuis le{" "}
                    {formatDate(currentAbsence.date_deb)}
                  </Text>
                </View>
              )}
            </View>
          </Animatable.View>
        ) : (
          <Animatable.View animation="fadeIn" style={styles.historySection}>
            {absenceHistory?.absences?.length > 0 ? (
              absenceHistory.absences.map((absence, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Icon
                      name={absence.justified ? "check-circle" : "error"}
                      size={24}
                      color={absence.justified ? "#4CAF50" : "#f44336"}
                    />
                    <Text style={styles.historyDate}>
                      {formatDate(absence.date_deb)}
                    </Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyLabel}>Début:</Text>
                      <Text style={styles.historyValue}>
                        {formatDate(absence.date_deb)}
                        {absence.heure_deb &&
                          ` à ${formatTime(absence.heure_deb)}`}
                      </Text>
                    </View>
                    {absence.date_fin && (
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Retour:</Text>
                        <Text style={styles.historyValue}>
                          {formatDate(absence.date_fin)}
                          {absence.heure_fin &&
                            ` à ${formatTime(absence.heure_fin)}`}
                        </Text>
                      </View>
                    )}
                    <View style={styles.historyRow}>
                      <Text style={styles.historyLabel}>Statut:</Text>
                      <Text
                        style={[
                          styles.historyStatus,
                          absence.justified
                            ? styles.statusJustified
                            : styles.statusUnjustified,
                        ]}
                      >
                        {absence.justified ? "Justifiée" : "Non justifiée"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyHistory}>
                <Icon name="event-available" size={60} color="#ccc" />
                <Text style={styles.emptyHistoryText}>
                  Aucune absence enregistrée
                </Text>
              </View>
            )}
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
    paddingBottom: 70,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#6c63ff",
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  studentId: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  statusLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
  },
  statusValuePresent: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 5,
  },
  statusValueAbsent: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f44336",
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#f0f0ff",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
  },
  activeTabText: {
    color: "#6c63ff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    gap: 15,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6c63ff",
  },
  justifiedText: {
    color: "#4CAF50",
  },
  unjustifiedText: {
    color: "#f44336",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  currentAbsenceAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    gap: 10,
  },
  currentAbsenceText: {
    flex: 1,
    fontSize: 12,
    color: "#f44336",
  },
  historySection: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  historyDetails: {
    marginLeft: 34,
  },
  historyRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  historyLabel: {
    width: 60,
    fontSize: 14,
    color: "#666",
  },
  historyValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusJustified: {
    color: "#4CAF50",
  },
  statusUnjustified: {
    color: "#f44336",
  },
  emptyHistory: {
    alignItems: "center",
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    color: "#f44336",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#6c63ff",
  },
});
