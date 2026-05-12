import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../../hooks/useAuth";
import { useTeacher } from "../../../hooks/useTeacher";

export default function StudentsScreen() {
  const { classId } = useLocalSearchParams();
  const { user } = useAuth();
  const { students, fetchStudentsByClass, markAbsence, markPresent, loading } =
    useTeacher(user?.user_id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [absenceDate, setAbsenceDate] = useState(new Date());
  const [absenceTime, setAbsenceTime] = useState(new Date());
  const [isFullDay, setIsFullDay] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (classId) {
      loadStudents();
    }
  }, [classId]);

  const loadStudents = async () => {
    await fetchStudentsByClass(classId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id_eleve?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleMarkAbsence = async () => {
    if (!selectedStudent) return;

    const dateStr = absenceDate.toISOString().split("T")[0];
    const timeStr = isFullDay
      ? ""
      : absenceTime.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

    const result = await markAbsence(
      selectedStudent,
      dateStr,
      timeStr,
      isFullDay,
    );

    if (result.success) {
      Alert.alert("Succès", "Absence enregistrée");
      setModalVisible(false);
      loadStudents();
    } else {
      Alert.alert("Erreur", result.error);
    }
  };

  const handleMarkPresent = async (student) => {
    Alert.alert("Confirmation", `Marquer ${student.nom} comme présent?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        onPress: async () => {
          const dateStr = new Date().toISOString().split("T")[0];
          const result = await markPresent(student, dateStr);
          if (result.success) {
            Alert.alert("Succès", "Présence enregistrée");
            loadStudents();
          } else {
            Alert.alert("Erreur", result.error);
          }
        },
      },
    ]);
  };

  const StudentCard = ({ student }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      style={styles.studentCard}
    >
      <View style={styles.studentInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{student.nom?.[0]}</Text>
        </View>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>{student.nom}</Text>
          <Text style={styles.studentId}>ID: {student.id_eleve}</Text>
          <Text style={styles.parentInfo}>Parent: {student.pere}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        {student.present ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.absentButton]}
            onPress={() => {
              setSelectedStudent(student);
              setModalVisible(true);
            }}
          >
            <Icon name="close" size={20} color="#fff" />
            <Text style={styles.buttonText}>Absent</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.presentButton]}
            onPress={() => handleMarkPresent(student)}
          >
            <Icon name="check" size={20} color="#fff" />
            <Text style={styles.buttonText}>Présent</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Liste des élèves</Text>
          <Text style={styles.subtitle}>{students.length} élèves</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un élève..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredStudents.map((student) => (
          <StudentCard key={student.id_eleve} student={student} />
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Marquer l&apos;absence</Text>
            <Text style={styles.studentNameModal}>
              Élève: {selectedStudent?.nom}
            </Text>

            <TouchableOpacity
              style={styles.fullDayOption}
              onPress={() => setIsFullDay(!isFullDay)}
            >
              <Icon
                name={isFullDay ? "check-box" : "check-box-outline-blank"}
                size={24}
                color="#6c63ff"
              />
              <Text style={styles.fullDayText}>Absence toute la journée</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-today" size={20} color="#6c63ff" />
              <Text style={styles.dateButtonText}>
                Date: {absenceDate.toLocaleDateString("fr-FR")}
              </Text>
            </TouchableOpacity>

            {!isFullDay && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="access-time" size={20} color="#6c63ff" />
                <Text style={styles.dateButtonText}>
                  Heure:{" "}
                  {absenceTime.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={absenceDate}
                mode="date"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setAbsenceDate(selectedDate);
                }}
              />
            )}

            {showTimePicker && !isFullDay && (
              <DateTimePicker
                value={absenceTime}
                mode="time"
                is24Hour={true}
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) setAbsenceTime(selectedDate);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleMarkAbsence}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  studentCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6c63ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  studentDetails: {
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  studentId: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  parentInfo: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  actionButtons: {
    marginLeft: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presentButton: {
    backgroundColor: "#4CAF50",
  },
  absentButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  studentNameModal: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  fullDayOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  fullDayText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  dateButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#6c63ff",
    marginLeft: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
