import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
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

export default function ClassesScreen() {
  const { user } = useAuth();
  const { classes, fetchTeacherClasses, loading } = useTeacher(
    user?.user_id || "",
  );

  useEffect(() => {
    if (user?.user_id) {
      loadClasses();
    }
  }, [user?.user_id]);

  const loadClasses = async () => {
    await fetchTeacherClasses();
  };

  if (loading && classes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.loadingText}>Chargement des classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadClasses} />
        }
      >
        {classes.map((classItem, index) => (
          <Animatable.View
            key={classItem.id_class}
            animation="fadeInUp"
            delay={index * 100}
            duration={800}
          >
            <TouchableOpacity
              style={styles.classCard}
              onPress={() =>
                router.push(`/(tabs)/students/${classItem.id_class}`)
              }
              activeOpacity={0.7}
            >
              <View style={styles.classIcon}>
                <Icon name="class" size={40} color="#6c63ff" />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>
                  {classItem.libelle || `Classe ${classItem.id_class}`}
                </Text>
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Icon name="people" size={14} color="#999" />
                    <Text style={styles.classDetail}>
                      {" "}
                      {classItem.nbstudent || 0} élèves
                    </Text>
                  </View>
                  {classItem.subjects && classItem.subjects.length > 0 && (
                    <View style={styles.detailItem}>
                      <Icon name="book" size={14} color="#999" />
                      <Text style={styles.subjectsText} numberOfLines={1}>
                        {" "}
                        {classItem.subjects.join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </Animatable.View>
        ))}

        {classes.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="class" size={80} color="#ddd" />
            <Text style={styles.emptyText}>Aucune classe assignée</Text>
            <Text style={styles.emptySubText}>
              Vous n&apos;enseignez dans aucune classe pour le moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
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
  classCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
  },
  classInfo: {
    flex: 1,
    marginLeft: 15,
  },
  className: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  detailsContainer: {
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  classDetail: {
    fontSize: 14,
    color: "#999",
  },
  subjectsText: {
    fontSize: 13,
    color: "#6c63ff",
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
  },
  emptySubText: {
    marginTop: 10,
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
  },
});
