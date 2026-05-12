import { useState } from "react";
import { supabase } from "../services/supabase";

export const useTeacher = (teacherId) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeacherClasses = async () => {
    if (!teacherId) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("seance")
        .select(
          `
          id_classe,
          classes:classes(id_class, libelle, nbstudent)
        `,
        )
        .eq("matricule", teacherId);

      if (error) throw error;

      if (data) {
        const uniqueClasses = Array.from(
          new Map(data.map((item) => [item.id_classe, item.classes])).values(),
        ).filter((c) => c !== null);
        setClasses(uniqueClasses);
      }
    } catch (error) {
      setError(error.message);
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    if (!classId) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("eleve")
        .select("*")
        .eq("id_class", classId)
        .order("nom", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedule = async () => {
    if (!teacherId) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("seance")
        .select(
          `
          *,
          matiere:matiere(code_matiere, libelle)
        `,
        )
        .eq("matricule", teacherId)
        .order("jour", { ascending: true })
        .order("debut_heure", { ascending: true });

      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAbsence = async (student, date, time, isFullDay = false) => {
    try {
      // Update student present status
      const { error: updateError } = await supabase
        .from("eleve")
        .update({ present: false })
        .eq("id_eleve", student.id_eleve);

      if (updateError) throw updateError;

      // Create absence record
      const absenceData = {
        id_eleve: student.id_eleve,
        id_classe: student.id_class,
        date_deb: date,
        heure_deb: isFullDay ? null : time,
        date_fin: isFullDay ? date : null,
        heure_fin: isFullDay ? null : time,
        justified: false,
      };

      const { error: absenceError } = await supabase
        .from("absence")
        .insert([absenceData]);

      if (absenceError) throw absenceError;

      // Create notification
      const notificationData = {
        student_id: student.id_eleve,
        class_id: student.id_class,
        absence_date: date,
        absence_time: time,
        is_justified: false,
        status: "pending",
        teacher_matricule: teacherId,
      };

      const { error: notificationError } = await supabase
        .from("absence_notifications")
        .insert([notificationData]);

      if (notificationError) throw notificationError;

      return { success: true };
    } catch (error) {
      console.error("Error marking absence:", error);
      return { success: false, error: error.message };
    }
  };

  const markPresent = async (student, date) => {
    try {
      // Update student present status
      const { error: updateError } = await supabase
        .from("eleve")
        .update({ present: true })
        .eq("id_eleve", student.id_eleve);

      if (updateError) throw updateError;

      // Delete absence record for the day
      const { error: absenceError } = await supabase
        .from("absence")
        .delete()
        .eq("id_eleve", student.id_eleve)
        .eq("date_deb", date);

      if (absenceError && absenceError.code !== "PGRST116") throw absenceError;

      return { success: true };
    } catch (error) {
      console.error("Error marking present:", error);
      return { success: false, error: error.message };
    }
  };

  const createSchedule = async (scheduleData) => {
    try {
      const { error } = await supabase
        .from("seance")
        .insert([{ ...scheduleData, matricule: teacherId }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error creating schedule:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    classes,
    students,
    schedule,
    loading,
    error,
    fetchTeacherClasses,
    fetchStudentsByClass,
    fetchTeacherSchedule,
    markAbsence,
    markPresent,
    createSchedule,
  };
};
