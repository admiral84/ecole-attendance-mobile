// ScheduleScreen.js
// Fixed version:
// - Prevents infinite refresh loop
// - Waits for authenticated teacher
// - Works with memoized useTeacher.js
// - Keeps working delete functionality

import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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

  // ---------------------------------------------------------
  // Teacher hook
  // ---------------------------------------------------------
  const { fetchTeacherSchedule, loading, createSchedule, deleteSchedule } =
    useTeacher(user?.user_id || "");

  // ---------------------------------------------------------
  // Modal state
  // ---------------------------------------------------------
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [selectedSeance, setSelectedSeance] = useState(null);

  // ---------------------------------------------------------
  // Form state
  // ---------------------------------------------------------
  const [selectedDay, setSelectedDay] = useState("");

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [classId, setClassId] = useState("");
  const [classLibelle, setClassLibelle] = useState("");

  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // ---------------------------------------------------------
  // Data
  // ---------------------------------------------------------
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);

  // ---------------------------------------------------------
  // Pickers / dropdowns
  // ---------------------------------------------------------
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // ---------------------------------------------------------
  // UI state
  // ---------------------------------------------------------
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------
  // Days
  // ---------------------------------------------------------
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  // =========================================================
  // LOAD SCHEDULE
  // =========================================================

  const loadSchedule = useCallback(async () => {
    // IMPORTANT:
    // Do not make the request until authentication has
    // finished loading and we have a teacher ID.
    if (!user?.user_id) {
      return;
    }

    try {
      const result = await fetchTeacherSchedule();

      if (result?.success && result.data) {
        const enhancedSchedule = await Promise.all(
          result.data.map(async (seance) => {
            let classLibelleValue = seance.id_classe;
            let matiereLibelleValue = seance.code_matiere;

            // -----------------------------------------------
            // Get class name
            // -----------------------------------------------
            try {
              const { data: classData } = await supabase
                .from("classes")
                .select("libelle")
                .eq("id_class", seance.id_classe)
                .single();

              if (classData?.libelle) {
                classLibelleValue = classData.libelle;
              }
            } catch (_error) {
              // keep fallback value
            }

            // -----------------------------------------------
            // Get subject name
            // -----------------------------------------------
            try {
              const { data: subjectData } = await supabase
                .from("matiere")
                .select("libelle")
                .eq("code_matiere", seance.code_matiere)
                .single();

              if (subjectData?.libelle) {
                matiereLibelleValue = subjectData.libelle;
              }
            } catch (_error) {
              // keep fallback value
            }

            return {
              ...seance,
              class_libelle: classLibelleValue,
              matiere_libelle: matiereLibelleValue,
            };
          }),
        );

        setScheduleData(enhancedSchedule);
      } else {
        setScheduleData([]);
      }
    } catch (_error) {
      setScheduleData([]);
    }
  }, [user?.user_id, fetchTeacherSchedule]);

  // =========================================================
  // FETCH CLASSES
  // =========================================================

  const fetchClasses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("libelle");

      if (error) {
        return;
      }

      setClasses(data || []);
    } catch (_error) {
      // silently ignore
    }
  }, []);

  // =========================================================
  // FETCH SUBJECTS
  // =========================================================

  const fetchSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("matiere")
        .select("*")
        .order("code_matiere");

      if (error) {
        return;
      }

      setSubjects(data || []);
    } catch (_error) {
      // silently ignore
    }
  }, []);

  // =========================================================
  // INITIAL LOADING
  // =========================================================

  useEffect(() => {
    // IMPORTANT:
    // Wait for useAuth() to provide the teacher.
    if (!user?.user_id) {
      return;
    }

    fetchClasses();
    fetchSubjects();
    loadSchedule();
  }, [user?.user_id, fetchClasses, fetchSubjects, loadSchedule]);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (time) => {
    return time.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // ADD SCHEDULE
  // =========================================================

  const handleAddSeance = async () => {
    if (!selectedDay || !classId || !subjectCode) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");

      return;
    }

    if (startTime >= endTime) {
      Alert.alert("Erreur", "L'heure de début doit être avant l'heure de fin");

      return;
    }

    if (!user?.user_id) {
      Alert.alert("Erreur", "Utilisateur non authentifié");

      return;
    }

    const seanceData = {
      id_classe: classId,
      jour: selectedDay,
      debut_heure: formatTime(startTime),
      fin_heure: formatTime(endTime),
      code_matiere: subjectCode,
      user_id: user.user_id,
    };

    try {
      const result = await createSchedule(seanceData);

      if (result?.success) {
        Alert.alert("Succès", "Session ajoutée avec succès");

        setModalVisible(false);

        resetForm();

        // Reload schedule after creation
        await loadSchedule();
      } else {
        Alert.alert(
          "Erreur",
          result?.error || "Impossible d'ajouter la session",
        );
      }
    } catch (_error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'ajout");
    }
  };

  // =========================================================
  // DELETE SCHEDULE
  // =========================================================

  const handleDeleteSeance = async () => {
    if (!selectedSeance) {
      Alert.alert("Erreur", "Aucune session sélectionnée");

      return;
    }

    if (!selectedSeance.id) {
      Alert.alert("Erreur", "Identifiant de la session introuvable");

      return;
    }

    if (!deleteSchedule) {
      Alert.alert("Erreur", "Fonction de suppression non disponible");

      return;
    }

    setDeleting(true);

    try {
      const result = await deleteSchedule(selectedSeance.id);

      if (result?.success) {
        Alert.alert("Succès", "Session supprimée avec succès");

        setDeleteModalVisible(false);
        setSelectedSeance(null);

        // Reload schedule after deletion
        await loadSchedule();
      } else {
        Alert.alert(
          "Erreur",
          result?.error || "Impossible de supprimer la session",
        );
      }
    } catch (_error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setSelectedDay("");

    setClassId("");
    setClassLibelle("");

    setSubjectCode("");
    setSubjectName("");

    setStartTime(new Date());
    setEndTime(new Date());

    setShowClassDropdown(false);
    setShowSubjectDropdown(false);

    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const onRefresh = async () => {
    if (!user?.user_id) {
      return;
    }

    setRefreshing(true);

    try {
      await loadSchedule();
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // GET SCHEDULE FOR DAY
  // =========================================================

  const getScheduleForDay = (day) => {
    return scheduleData
      .filter((s) => s.jour === day)
      .sort((a, b) => a.debut_heure.localeCompare(b.debut_heure));
  };

  // =========================================================
  // SELECT CLASS
  // =========================================================

  const selectClass = (id, libelle) => {
    setClassId(id);
    setClassLibelle(libelle);

    setShowClassDropdown(false);
  };

  // =========================================================
  // SELECT SUBJECT
  // =========================================================

  const selectSubject = (code, name) => {
    setSubjectCode(code);
    setSubjectName(name);

    setShowSubjectDropdown(false);
  };

  // =========================================================
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal = (seance) => {
    setSelectedSeance(seance);
    setDeleteModalVisible(true);
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (!user?.user_id || (loading && !scheduleData.length)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />

        <Text style={styles.loadingText}>
          {!user?.user_id
            ? "Chargement de l'utilisateur..."
            : "Chargement de l'emploi du temps..."}
        </Text>
      </View>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <View style={styles.container}>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.header}
      >
        <Text style={styles.title}>Mon Emploi du Temps</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animatable.View>

      {/* =====================================================
          SCHEDULE
      ====================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
                  <View
                    key={
                      seance.id || `${seance.id_classe}-${seance.jour}-${idx}`
                    }
                    style={styles.seanceItem}
                  >
                    {/* Time */}
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{seance.debut_heure}</Text>

                      <Icon name="arrow-forward" size={16} color="#999" />

                      <Text style={styles.timeText}>{seance.fin_heure}</Text>
                    </View>

                    {/* Details */}
                    <View style={styles.seanceDetails}>
                      <Text style={styles.className}>
                        {seance.class_libelle}
                      </Text>

                      <Text style={styles.subjectName}>
                        {seance.matiere_libelle}
                      </Text>
                    </View>

                    {/* Delete */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => openDeleteModal(seance)}
                    >
                      <Icon name="delete-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
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

      {/* =====================================================
          ADD SESSION MODAL
      ====================================================== */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Ajouter une session</Text>

              {/* Day */}
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

              {/* Class */}
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

              {/* Subject */}
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

              {/* Time */}
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

              {/* Start time picker */}
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);

                    if (selectedDate) {
                      setStartTime(selectedDate);
                    }
                  }}
                />
              )}

              {/* End time picker */}
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  is24Hour={true}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);

                    if (selectedDate) {
                      setEndTime(selectedDate);
                    }
                  }}
                />
              )}

              {/* Modal buttons */}
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

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          if (!deleting) {
            setDeleteModalVisible(false);
            setSelectedSeance(null);
          }
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <Animatable.View
            animation="bounceIn"
            style={styles.deleteModalContent}
          >
            <Icon name="warning" size={60} color="#f44336" />

            <Text style={styles.deleteModalTitle}>
              Confirmer la suppression
            </Text>

            <Text style={styles.deleteModalText}>
              Voulez-vous vraiment supprimer cette session ?
            </Text>

            {selectedSeance && (
              <View style={styles.seanceInfo}>
                <Text style={styles.seanceInfoText}>
                  {selectedSeance.class_libelle}
                </Text>

                <Text style={styles.seanceInfoText}>
                  {selectedSeance.matiere_libelle}
                </Text>

                <Text style={styles.seanceInfoTime}>
                  {selectedSeance.debut_heure} - {selectedSeance.fin_heure}
                </Text>
              </View>
            )}

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteCancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);

                  setSelectedSeance(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.deleteCancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteConfirmButton]}
                onPress={handleDeleteSeance}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c63ff",
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

  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffebee",
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

  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },

  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },

  deleteModalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },

  seanceInfo: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },

  seanceInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },

  seanceInfoTime: {
    fontSize: 14,
    color: "#6c63ff",
    marginTop: 5,
  },

  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  deleteModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },

  deleteCancelButton: {
    backgroundColor: "#f5f5f5",
  },

  deleteCancelButtonText: {
    color: "#666",
    fontSize: 16,
  },

  deleteConfirmButton: {
    backgroundColor: "#f44336",
  },

  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
