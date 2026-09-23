import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useState } from "react";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// --------------------------------------------------
// Decode JWT payload
// --------------------------------------------------
const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    // JWT payload is Base64URL encoded
    const base64Url = parts[1];

    // Convert Base64URL to Base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Add required padding
    const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const jsonPayload = atob(paddedBase64);

    return JSON.parse(jsonPayload);
  } catch (_error) {
    return null;
  }
};

// --------------------------------------------------
// Check whether token is expired
// --------------------------------------------------
const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return true;
  }

  if (!payload.exp) {
    return true;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  if (currentTime >= expirationTime) {
    return true;
  }

  return false;
};

// --------------------------------------------------
// Handle expired authentication
// --------------------------------------------------
const handleExpiredToken = async () => {
  try {
    await AsyncStorage.removeItem("auth_token");

    // Optional: remove other authentication data
    // if your app stores any of these.
    // await AsyncStorage.removeItem("user");

    router.replace("/login");
  } catch (_error) {
    // Try redirect anyway
    router.replace("/login");
  }
};

// --------------------------------------------------
// Get authentication token
// --------------------------------------------------
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("auth_token");

  if (!token) {
    return null;
  }

  // --------------------------------------------------
  // Check token expiration
  // --------------------------------------------------
  const expired = isTokenExpired(token);

  if (expired) {
    await handleExpiredToken();

    return null;
  }

  return token;
};

// --------------------------------------------------
// useTeacher hook
// --------------------------------------------------
export const useTeacher = (user_id) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --------------------------------------------------
  // Common API request
  // --------------------------------------------------
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = await getAuthToken();

    // If token is missing or expired,
    // getAuthToken() already redirected to login.
    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Invalid server response (${response.status})`);
      }

      // --------------------------------------------------
      // Worker rejected the token
      // --------------------------------------------------
      if (response.status === 401) {
        await handleExpiredToken();

        return {
          success: false,
          error: "Authentication session expired",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || `Request failed with status ${response.status}`,
        };
      }

      return data;
    } catch (_error) {
      throw error;
    }
  }, []);

  // --------------------------------------------------
  // Fetch teacher classes
  // --------------------------------------------------
  const fetchTeacherClasses = useCallback(async () => {
    if (!user_id) {
      return {
        success: false,
        error: "No user_id provided",
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(`/api/teacher/classes/${user_id}`, {
        method: "GET",
      });

      if (result.success) {
        setClasses(result.classes || []);

        return {
          success: true,
          data: result.classes || [],
        };
      }

      throw new Error(result.error || "Failed to fetch classes");
    } catch (_error) {
      setError(error.message);

      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  }, [user_id, apiRequest]);

  // --------------------------------------------------
  // Fetch students by class
  // --------------------------------------------------
  const fetchStudentsByClass = useCallback(
    async (classId) => {
      if (!classId) {
        return {
          success: false,
          error: "No classId provided",
        };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/api/teacher/students/${classId}`, {
          method: "GET",
        });

        if (result.success) {
          const studentsData = result.students || [];

          setStudents(studentsData);

          return {
            success: true,
            data: studentsData,
          };
        }

        throw new Error(result.error || "Failed to fetch students");
      } catch (_error) {
        setError(error.message);

        return {
          success: false,
          error: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [apiRequest],
  );

  // --------------------------------------------------
  // Fetch teacher schedule
  // --------------------------------------------------
  const fetchTeacherSchedule = useCallback(async () => {
    if (!user_id) {
      return {
        success: false,
        error: "No user_id provided",
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(`/api/teacher/schedule/${user_id}`, {
        method: "GET",
      });

      if (result.success) {
        const scheduleData = result.schedule || [];

        setSchedule(scheduleData);

        return {
          success: true,
          data: scheduleData,
        };
      }

      throw new Error(result.error || "Failed to fetch schedule");
    } catch (_error) {
      setError(error.message);

      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  }, [user_id, apiRequest]);

  // --------------------------------------------------
  // Mark student absent
  // --------------------------------------------------
  const markAbsence = useCallback(
    async (student, date, time, isFullDay = false) => {
      try {
        const result = await apiRequest("/api/teacher/mark-absence", {
          method: "POST",
          body: JSON.stringify({
            studentId: student.id_eleve,
            classId: student.id_class,
            date,
            time,
            isFullDay,
            teacherId: user_id,
          }),
        });

        if (result.success) {
          setStudents((prevStudents) =>
            prevStudents.map((s) =>
              s.id_eleve === student.id_eleve
                ? {
                    ...s,
                    present: false,
                    currentAbsence: result.absence,
                  }
                : s,
            ),
          );

          return {
            success: true,
            data: result.absence,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to mark student absent",
        };
      } catch (_error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest, user_id],
  );

  // --------------------------------------------------
  // Mark student present
  // --------------------------------------------------
  const markPresent = useCallback(
    async (student, returnDate, returnTime) => {
      try {
        const result = await apiRequest("/api/teacher/mark-present", {
          method: "POST",
          body: JSON.stringify({
            studentId: student.id_eleve,
            returnDate,
            returnTime,
          }),
        });

        if (result.success) {
          setStudents((prevStudents) =>
            prevStudents.map((s) =>
              s.id_eleve === student.id_eleve
                ? {
                    ...s,
                    present: true,
                    currentAbsence: null,
                  }
                : s,
            ),
          );

          return {
            success: true,
            data: result.absence,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to mark student present",
        };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Request failed",
        };
      }
    },
    [apiRequest],
  );

  // --------------------------------------------------
  // Create schedule
  // --------------------------------------------------
  const createSchedule = useCallback(
    async (scheduleData) => {
      try {
        const result = await apiRequest("/api/teacher/schedule", {
          method: "POST",
          body: JSON.stringify({
            ...scheduleData,
            user_id,
          }),
        });

        if (result.success) {
          return {
            success: true,
            data: result,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to create schedule",
        };
      } catch (_error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest, user_id],
  );

  // --------------------------------------------------
  // Delete schedule
  // --------------------------------------------------
  const deleteSchedule = useCallback(
    async (seanceId) => {
      if (!seanceId) {
        return {
          success: false,
          error: "No seance ID provided",
        };
      }

      try {
        const result = await apiRequest(`/api/teacher/schedule/${seanceId}`, {
          method: "DELETE",
        });

        if (result?.success) {
          return {
            success: true,
            data: result,
          };
        }

        return {
          success: false,
          error: result?.error || "Failed to delete schedule",
        };
      } catch (_error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest, user_id],
  );

  // --------------------------------------------------
  // Fetch absences by date
  // --------------------------------------------------
  const fetchAbsencesByDate = useCallback(
    async (date, classId = null) => {
      try {
        setLoading(true);
        setError(null);

        let endpoint = `/api/teacher/absences?date=` + encodeURIComponent(date);

        if (classId) {
          endpoint += `&classId=` + encodeURIComponent(classId);
        }

        const result = await apiRequest(endpoint, {
          method: "GET",
        });

        if (result.success) {
          return {
            success: true,
            data: result.absences || [],
          };
        }

        throw new Error(result.error || "Failed to fetch absences");
      } catch (_error) {
        setError(error.message);

        return {
          success: false,
          error: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [apiRequest],
  );

  // --------------------------------------------------
  // Justify absence
  // --------------------------------------------------
  const justifyAbsence = useCallback(
    async (absenceId, justified = true) => {
      try {
        const result = await apiRequest("/api/teacher/justify-absence", {
          method: "PUT",
          body: JSON.stringify({
            absenceId,
            justified,
          }),
        });

        if (result.success) {
          return {
            success: true,
            data: result.absence,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to justify absence",
        };
      } catch (_error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest],
  );

  //-------------------------------------------------
  // get student whose have Billet for a specific classe
  //---------------------------------------------------
  const getStudentsBillet = useCallback(
    async (class_id) => {
      try {
        const billets = await apiRequest(`/api/billets/${class_id}`, {
          method: "GET",
        });

        if (billets.success) {
          return {
            success: true,
            data: billets.data || [],
          };
        }

        return {
          success: false,
          error: billets.error || "Failed to fetch billets",
        };
      } catch (_error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest],
  );

  // --------------------------------------------------
  // Get student absence history
  // --------------------------------------------------
  const getStudentAbsenceHistory = useCallback(
    async (studentId) => {
      try {
        const result = await apiRequest(
          `/api/teacher/student-absences/${studentId}`,
          {
            method: "GET",
          },
        );
        console.log("api called successfully");

        if (result.success) {
          return {
            success: true,
            data: result.history || [],
            total: result.total || 0,
            justified: result.justified || 0,
            unjustified: result.unjustified || 0,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to fetch absence history",
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest],
  );

  //--------------------------------------------
  // reject a billet
  //--------------------------------------------
  const annulerBillet = useCallback(
    async (studentId) => {
      try {
        const result = await apiRequest(
          `/api/teacher/absence-notifications/${encodeURIComponent(
            String(studentId),
          )}`,
          {
            method: "DELETE",
          },
        );

        return result;
      } catch (error) {
        console.error("❌ annulerBillet error:", error);
        throw error;
      }
    },
    [apiRequest],
  );
  // --------------------------------------------------
  // Get student's current absence
  // --------------------------------------------------
  const getStudentCurrentAbsence = useCallback(
    async (studentId) => {
      try {
        const result = await apiRequest(
          `/api/teacher/student-current-absence/${studentId}`,
          {
            method: "GET",
          },
        );

        if (result.success) {
          return {
            success: true,
            data: result.absence,
          };
        }

        return {
          success: false,
          error: result.error || "Failed to fetch current absence",
        };
      } catch (_error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [apiRequest],
  );

  // --------------------------------------------------
  // Return hook API
  // --------------------------------------------------
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

    getStudentsBillet,
    annulerBillet,

    getStudentAbsenceHistory,
    getStudentCurrentAbsence,
  };
};
