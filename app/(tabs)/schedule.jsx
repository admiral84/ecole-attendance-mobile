import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../hooks/useAuth";
import { useTeacher } from "../../hooks/useTeacher";
import { supabase } from "../../services/supabase";

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { schedule, fetchTeacherSchedule, loading, createSchedule } =
    useTeacher(user?.user_id || "");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [classId, setClassId] = useState("");
  const [classLibelle, setClassLibelle] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeacherSchedule();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .order("libelle");
    if (data) setClasses(data);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("matiere")
      .select("*")
      .order("code_matiere");
    if (data) setSubjects(data);
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddSeance = async () => {
    if (!selectedDay || !classId || !subjectCode) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    const seanceData = {
      id_classe: classId,
      jour: selectedDay,
      debut_heure: formatTime(startTime),
      fin_heure: formatTime(endTime),
      code_matiere: subjectCode,
    };

    const result = await createSchedule(seanceData);

    if (result.success) {
      Alert.alert("Succès", "Session ajoutée avec succès");
      setModalVisible(false);
      fetchTeacherSchedule();
      resetForm();
    } else {
      Alert.alert("Erreur", result.error);
    }
  };

  const resetForm = () => {
    setSelectedDay("");
    setClassId("");
    setClassLibelle("");
    setSubjectCode("");
    setSubjectName("");
    setStartTime(new Date());
    setEndTime(new Date());
  };

  const getScheduleForDay = (day) => {
    return schedule
      .filter((s) => s.jour === day)
      .sort((a, b) => a.debut_heure.localeCompare(b.debut_heure));
  };

  const selectClass = (id, libelle) => {
    setClassId(id);
    setClassLibelle(libelle);
    setShowClassDropdown(false);
  };

  const selectSubject = (code, name) => {
    setSubjectCode(code);
    setSubjectName(name);
    setShowSubjectDropdown(false);
  };

  return (
    <View style={styles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.header}
      >
        <Text style={styles.title}>Mon Emploi du Temps</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animatable.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {days.map((day, index) => {
          const daySchedule = getScheduleForDay(day);
          return (
            <Animatable.View
              key={day}
              animation="fadeInUp"
              delay={index * 100}
              style={styles.dayContainer}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <Text style={styles.sessionCount}>
                  {daySchedule.length} session(s)
                </Text>
              </View>

              {daySchedule.length > 0 ? (
                daySchedule.map((seance, idx) => (
                  <View key={idx} style={styles.seanceItem}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{seance.debut_heure}</Text>
                      <Icon name="arrow-forward" size={16} color="#999" />
                      <Text style={styles.timeText}>{seance.fin_heure}</Text>
                    </View>
                    <View style={styles.seanceDetails}>
                      <Text style={styles.className}>
                        {seance.class_libelle || seance.id_classe}
                      </Text>
                      <Text style={styles.subjectName}>
                        {seance.matiere_libelle || seance.code_matiere}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Aucune session planifiée</Text>
                </View>
              )}
            </Animatable.View>
          );
        })}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Ajouter une session</Text>

              <Text style={styles.label}>Jour</Text>
              <View style={styles.daySelector}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOption,
                      selectedDay === day && styles.dayOptionSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        selectedDay === day && styles.dayOptionTextSelected,
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Classe</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowClassDropdown(!showClassDropdown);
                    setShowSubjectDropdown(false);
                  }}
                >
                  <Icon name="class" size={20} color="#6c63ff" />
                  <Text style={styles.dropdownButtonText}>
                    {classLibelle || "Sélectionner une classe"}
                  </Text>
                  <Icon
                    name={
                      showClassDropdown ? "arrow-drop-up" : "arrow-drop-down"
                    }
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>

                {showClassDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={styles.dropdownScroll}
                    >
                      {classes.map((item) => (
                        <TouchableOpacity
                          key={item.id_class}
                          style={styles.dropdownItem}
                          onPress={() =>
                            selectClass(item.id_class, item.libelle)
                          }
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.libelle}
                          </Text>
                          <Text style={styles.dropdownItemSubtext}>
                            ({item.id_class})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.label}>Matière</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowSubjectDropdown(!showSubjectDropdown);
                    setShowClassDropdown(false);
                  }}
                >
                  <Icon name="menu-book" size={20} color="#6c63ff" />
                  <Text style={styles.dropdownButtonText}>
                    {subjectName || "Sélectionner une matière"}
                  </Text>
                  <Icon
                    name={
                      showSubjectDropdown ? "arrow-drop-up" : "arrow-drop-down"
                    }
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>

                {showSubjectDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={styles.dropdownScroll}
                    >
                      {subjects.map((item) => (
                        <TouchableOpacity
                          key={item.code_matiere}
                          style={styles.dropdownItem}
                          onPress={() =>
                            selectSubject(
                              item.code_matiere,
                              item.libelle || item.code_matiere,
                            )
                          }
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.libelle || item.code_matiere}
                          </Text>
                          <Text style={styles.dropdownItemSubtext}>
                            ({item.code_matiere})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.label}>Horaire</Text>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Icon name="access-time" size={20} color="#6c63ff" />
                  <Text style={styles.timeButtonText}>
                    Début: {formatTime(startTime)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Icon name="access-time" size={20} color="#6c63ff" />
                  <Text style={styles.timeButtonText}>
                    Fin: {formatTime(endTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) setStartTime(selectedDate);
                  }}
                />
              )}

              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) setEndTime(selectedDate);
                  }}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddSeance}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 10,
  },
  dayContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f0f0ff",
  },
  dayName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6c63ff",
  },
  sessionCount: {
    fontSize: 14,
    color: "#999",
  },
  seanceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#6c63ff",
    marginHorizontal: 4,
  },
  seanceDetails: {
    flex: 1,
    marginLeft: 15,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectName: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
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
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 15,
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dayOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  dayOptionSelected: {
    backgroundColor: "#6c63ff",
  },
  dayOptionText: {
    color: "#666",
    fontSize: 14,
  },
  dayOptionTextSelected: {
    color: "#fff",
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  dropdownButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: "#999",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  timeButton: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
  },
  timeButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 30,
    marginBottom: 20,
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
