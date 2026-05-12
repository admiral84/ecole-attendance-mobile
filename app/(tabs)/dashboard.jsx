import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    classes,
    schedule,
    fetchTeacherClasses,
    fetchTeacherSchedule,
    loading,
  } = useTeacher(user?.user_id || "");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchTeacherClasses(), fetchTeacherSchedule()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTodaySchedule = () => {
    const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const today = days[new Date().getDay() - 1];
    return schedule.filter((s) => s.jour === today);
  };

  const stats = {
    classes: classes.length,
    todayClasses: getTodaySchedule().length,
    totalStudents: classes.reduce((acc, c) => acc + (c.nbstudent || 0), 0),
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={styles.header}
      >
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>
            {user?.prenom} {user?.nom}
          </Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="school" size={40} color="#fff" />
        </View>
      </Animatable.View>

      <View style={styles.statsContainer}>
        <Animatable.View
          animation="fadeInUp"
          delay={200}
          style={styles.statCard}
        >
          <Icon name="class" size={32} color="#6c63ff" />
          <Text style={styles.statNumber}>{stats.classes}</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={300}
          style={styles.statCard}
        >
          <Icon name="schedule" size={32} color="#6c63ff" />
          <Text style={styles.statNumber}>{stats.todayClasses}</Text>
          <Text style={styles.statLabel}>Cours aujourd&apos;hui</Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          delay={400}
          style={styles.statCard}
        >
          <Icon name="people" size={32} color="#6c63ff" />
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Élèves total</Text>
        </Animatable.View>
      </View>

      <Animatable.View
        animation="fadeInLeft"
        delay={500}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              router.push("/(tabs)/classes");
            }}
          >
            <Icon name="class" size={40} color="#6c63ff" />
            <Text style={styles.actionText}>Mes classes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/schedule")}
          >
            <Icon name="calendar-today" size={40} color="#6c63ff" />
            <Text style={styles.actionText}>Emploi du temps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Icon name="person" size={40} color="#6c63ff" />
            <Text style={styles.actionText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>

      {getTodaySchedule().length > 0 && (
        <Animatable.View
          animation="fadeInRight"
          delay={600}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Cours du jour</Text>
          {getTodaySchedule().map((seance, index) => (
            <TouchableOpacity
              key={index}
              style={styles.seanceCard}
              onPress={() =>
                router.push(`/(tabs)/students/${seance.id_classe}`)
              }
            >
              <View style={styles.seanceTime}>
                <Text style={styles.timeText}>{seance.debut_heure}</Text>
                <Text style={styles.timeSeparator}>-</Text>
                <Text style={styles.timeText}>{seance.fin_heure}</Text>
              </View>
              <View style={styles.seanceInfo}>
                <Text style={styles.seanceClass}>{seance.id_classe}</Text>
                <Text style={styles.seanceMatiere}>{seance.code_matiere}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          ))}
        </Animatable.View>
      )}
    </ScrollView>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
  userRole: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    flex: 0.32,
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
  },
  seanceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  seanceTime: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c63ff",
  },
  timeSeparator: {
    marginHorizontal: 5,
    color: "#999",
  },
  seanceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  seanceClass: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  seanceMatiere: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
});
