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
        .eq("user_id", teacherId);

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
      // Fetch students from the class
      const { data: studentsData, error: studentsError } = await supabase
        .from("eleve")
        .select("*")
        .eq("id_class", classId)
        .order("nom", { ascending: true });

      if (studentsError) throw studentsError;

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Fetch all active absences (without end date/time) for these students
      const studentIds = studentsData.map((s) => s.id_eleve);
      const { data: absencesData, error: absencesError } = await supabase
        .from("absence")
        .select("*")
        .in("id_eleve", studentIds.length > 0 ? studentIds : [""])
        .is("date_fin", null) // Only get absences that haven't ended
        .is("heure_fin", null);

      if (absencesError) throw absencesError;

      // Mark students as present or absent based on active absence records
      const studentsWithStatus = studentsData.map((student) => {
        const isCurrentlyAbsent = absencesData?.some(
          (absence) => absence.id_eleve === student.id_eleve,
        );
        return {
          ...student,
          present: !isCurrentlyAbsent, // Present if no active absence
          currentAbsence: absencesData?.find(
            (absence) => absence.id_eleve === student.id_eleve,
          ),
        };
      });

      setStudents(studentsWithStatus);
      return { success: true, data: studentsWithStatus };
    } catch (error) {
      setError(error.message);
      console.error("Error fetching students:", error);
      return { success: false, error: error.message };
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
          matiere:code_matiere(*),
          classe:id_classe(*)
        `,
        )
        .eq("user_id", teacherId)
        .order("jour", { ascending: true })
        .order("debut_heure", { ascending: true });

      if (error) throw error;
      setSchedule(data || []);
      return { success: true, data };
    } catch (error) {
      setError(error.message);
      console.error("Error fetching schedule:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const markAbsence = async (student, date, time, isFullDay = false) => {
    try {
      // Check if there's already an active absence for this student (without end date)
      const { data: existingAbsence, error: checkError } = await supabase
        .from("absence")
        .select("*")
        .eq("id_eleve", student.id_eleve)
        .is("date_fin", null)
        .is("heure_fin", null)
        .maybeSingle();

      if (checkError) throw checkError;

      // If student is already absent, don't create a new absence
      if (existingAbsence) {
        return {
          success: false,
          error:
            "Cet élève est déjà marqué absent. Veuillez d'abord enregistrer son retour.",
        };
      }

      // Prepare absence data
      const absenceData = {
        id_eleve: student.id_eleve,
        id_classe: student.id_class,
        date_deb: date,
        heure_deb: isFullDay ? null : time,
        date_fin: null, // Null means still absent
        heure_fin: null, // Null means still absent
        justified: false,
        marked_by: teacherId,
        present: false,
      };

      // Create new absence record
      const { data, error } = await supabase
        .from("absence")
        .insert([absenceData])
        .select();

      if (error) throw error;

      // Create notification for parents (optional)
      try {
        const notificationData = {
          student_id: student.id_eleve,
          class_id: student.id_class,
          absence_date: date,
          absence_time: time,
          is_justified: false,
          status: "pending",
          teacher_id: teacherId,
        };

        await supabase.from("absence_notifications").insert([notificationData]);
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't fail the main operation if notification fails
      }

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id_eleve === student.id_eleve
            ? { ...s, present: false, currentAbsence: data?.[0] }
            : s,
        ),
      );

      return { success: true, data: data?.[0] };
    } catch (error) {
      console.error("Error marking absence:", error);
      return { success: false, error: error.message };
    }
  };

  const markPresent = async (student, returnDate, returnTime) => {
    try {
      // Find the active absence record (without end date/time)
      const { data: activeAbsence, error: findError } = await supabase
        .from("absence")
        .select("*")
        .eq("id_eleve", student.id_eleve)
        .is("date_fin", null)
        .is("heure_fin", null)
        .maybeSingle();

      if (findError) throw findError;

      if (!activeAbsence) {
        return {
          success: false,
          error: "Aucune absence active trouvée pour cet élève",
        };
      }

      // Update the absence record with return date and time
      const { data, error } = await supabase
        .from("absence")
        .update({
          date_fin: returnDate,
          heure_fin: returnTime,
          present: true,
        })
        .eq("id", activeAbsence.id)
        .select();

      if (error) throw error;

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id_eleve === student.id_eleve
            ? { ...s, present: true, currentAbsence: null }
            : s,
        ),
      );

      return { success: true, data: data?.[0] };
    } catch (error) {
      console.error("Error marking present:", error);
      return { success: false, error: error.message };
    }
  };

  const createSchedule = async (scheduleData) => {
    try {
      const { error } = await supabase.from("seance").insert([
        {
          ...scheduleData,
          user_id: teacherId,
        },
      ]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error creating schedule:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteSchedule = async (seanceId) => {
    try {
      const { error } = await supabase
        .from("seance")
        .delete()
        .eq("id", seanceId)
        .eq("user_id", teacherId); // Add teacherId for security

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting schedule:", error);
      return { success: false, error: error.message };
    }
  };

  const fetchAbsencesByDate = async (date, classId = null) => {
    try {
      setLoading(true);
      let query = supabase
        .from("absence")
        .select(
          `
          *,
          eleve:id_eleve (*)
        `,
        )
        .lte("date_deb", date)
        .or(`date_fin.is.null,date_fin.gte.${date}`);

      if (classId) {
        query = query.eq("id_classe", classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching absences:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const justifyAbsence = async (absenceId, justified = true) => {
    try {
      const { data, error } = await supabase
        .from("absence")
        .update({ justified })
        .eq("id", absenceId)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error justifying absence:", error);
      return { success: false, error: error.message };
    }
  };

  const getStudentAbsenceHistory = async (studentId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from("absence")
        .select("*")
        .eq("id_eleve", studentId)
        .gte("date_deb", startDate)
        .lte("date_deb", endDate)
        .order("date_deb", { ascending: false });

      if (error) throw error;

      const totalAbsences = data.length;
      const justifiedAbsences = data.filter((a) => a.justified).length;
      const unjustifiedAbsences = totalAbsences - justifiedAbsences;
      const currentAbsences = data.filter((a) => !a.date_fin).length;

      return {
        success: true,
        data: {
          total: totalAbsences,
          justified: justifiedAbsences,
          unjustified: unjustifiedAbsences,
          current: currentAbsences,
          absences: data,
        },
      };
    } catch (error) {
      console.error("Error fetching student absence history:", error);
      return { success: false, error: error.message };
    }
  };

  const getStudentCurrentAbsence = async (studentId) => {
    try {
      const { data, error } = await supabase
        .from("absence")
        .select("*")
        .eq("id_eleve", studentId)
        .is("date_fin", null)
        .is("heure_fin", null)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching current absence:", error);
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
    deleteSchedule,
    fetchAbsencesByDate,
    justifyAbsence,
    getStudentAbsenceHistory,
    getStudentCurrentAbsence,
  };
};
