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
      console.error("❌ Invalid JWT format");
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
  } catch (error) {
    console.error("❌ Failed to decode JWT:", error);
    return null;
  }
};

// --------------------------------------------------
// Check whether token is expired
// --------------------------------------------------
const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    console.error("❌ Could not read token expiration");
    return true;
  }

  if (!payload.exp) {
    console.error("❌ Token does not contain exp");
    return true;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  const expirationDate = new Date(expirationTime);

  console.log("⏰ Token expiration:", expirationDate.toLocaleString());

  console.log("🕐 Current time:", new Date(currentTime).toLocaleString());

  const remainingSeconds = Math.floor((expirationTime - currentTime) / 1000);

  console.log("⏳ Token time remaining:", remainingSeconds, "seconds");

  if (currentTime >= expirationTime) {
    console.log("❌ TOKEN EXPIRED");
    return true;
  }

  console.log("✅ TOKEN IS VALID");

  return false;
};

// --------------------------------------------------
// Handle expired authentication
// --------------------------------------------------
const handleExpiredToken = async () => {
  try {
    console.log("🚪 Removing expired authentication token...");

    await AsyncStorage.removeItem("auth_token");

    // Optional: remove other authentication data
    // if your app stores any of these.
    // await AsyncStorage.removeItem("user");

    console.log("✅ Expired token removed");

    console.log("🔄 Redirecting to login...");

    router.replace("/login");
  } catch (error) {
    console.error("❌ Error handling expired token:", error);

    // Try redirect anyway
    router.replace("/login");
  }
};

// --------------------------------------------------
// Get authentication token
// --------------------------------------------------
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("auth_token");

  console.log(
    "🔑 Token retrieved:",
    token ? "✅ Token exists" : "❌ No token found",
  );

  if (!token) {
    return null;
  }

  console.log("Token preview:", token.substring(0, 20) + "...");

  // --------------------------------------------------
  // Check token expiration
  // --------------------------------------------------
  const expired = isTokenExpired(token);

  if (expired) {
    console.log("🚨 Authentication token has expired");

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
      console.log("🚫 API request cancelled: no valid token");

      return {
        success: false,
        error: "Authentication required",
      };
    }

    console.log("📡 Making request to:", `${API_BASE_URL}${endpoint}`);

    console.log("🔐 Has token:", !!token);
    console.log("📝 Method:", options.method || "GET");

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

      console.log("📊 Response status:", response.status);

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("❌ Failed to parse response:", jsonError);

        throw new Error(`Invalid server response (${response.status})`);
      }

      console.log("📦 Response data:", data);

      // --------------------------------------------------
      // Worker rejected the token
      // --------------------------------------------------
      if (response.status === 401) {
        console.log("🚨 Server rejected authentication token");

        await handleExpiredToken();

        return {
          success: false,
          error: "Authentication session expired",
        };
      }

      if (!response.ok) {
        console.error("❌ Request failed with status:", response.status);

        return {
          success: false,
          error: data?.error || `Request failed with status ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error("❌ Network error:", error.message);

      throw error;
    }
  }, []);

  // --------------------------------------------------
  // Fetch teacher classes
  // --------------------------------------------------
  const fetchTeacherClasses = useCallback(async () => {
    if (!user_id) {
      console.log("⚠️ No user_id provided");

      return {
        success: false,
        error: "No user_id provided",
      };
    }

    console.log("📚 Fetching classes for teacher:", user_id);

    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(`/api/teacher/classes/${user_id}`, {
        method: "GET",
      });

      if (result.success) {
        console.log("✅ Classes fetched:", result.classes?.length || 0);

        setClasses(result.classes || []);

        return {
          success: true,
          data: result.classes || [],
        };
      }

      throw new Error(result.error || "Failed to fetch classes");
    } catch (error) {
      setError(error.message);

      console.error("❌ Error fetching classes:", error);

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
        console.log("⚠️ No classId provided");

        return {
          success: false,
          error: "No classId provided",
        };
      }

      console.log("👨‍🎓 Fetching students for class:", classId);

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
      } catch (error) {
        setError(error.message);

        console.error("❌ Error fetching students:", error);

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
      console.log("⚠️ No user_id provided for schedule");

      return {
        success: false,
        error: "No user_id provided",
      };
    }

    console.log("📅 Fetching schedule for teacher:", user_id);

    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(`/api/teacher/schedule/${user_id}`, {
        method: "GET",
      });

      if (result.success) {
        const scheduleData = result.schedule || [];

        console.log("✅ Schedule fetched:", scheduleData.length);

        setSchedule(scheduleData);

        return {
          success: true,
          data: scheduleData,
        };
      }

      throw new Error(result.error || "Failed to fetch schedule");
    } catch (error) {
      setError(error.message);

      console.error("❌ Error fetching schedule:", error);

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
      } catch (error) {
        console.error("❌ Error marking absence:", error);

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
        console.error("❌ Error marking present:", error);

        return {
          success: false,
          error: error.message,
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
      } catch (error) {
        console.error("❌ Error creating schedule:", error);

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
        console.log("🗑️ Deleting seance:", seanceId);

        console.log("👨‍🏫 Teacher ID:", user_id);

        const result = await apiRequest(`/api/teacher/schedule/${seanceId}`, {
          method: "DELETE",
        });

        console.log("📦 Delete API response:", result);

        if (result?.success) {
          console.log("✅ Seance deleted successfully");

          return {
            success: true,
            data: result,
          };
        }

        return {
          success: false,
          error: result?.error || "Failed to delete schedule",
        };
      } catch (error) {
        console.error("❌ Error deleting schedule:", error);

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
      } catch (error) {
        console.error("❌ Error fetching absences:", error);

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
      } catch (error) {
        console.error("❌ Error justifying absence:", error);

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
    async (studentId, startDate, endDate) => {
      try {
        const result = await apiRequest(
          `/api/teacher/student-absences/${studentId}?startDate=${encodeURIComponent(
            startDate,
          )}&endDate=${encodeURIComponent(endDate)}`,
          {
            method: "GET",
          },
        );

        if (result.success) {
          return {
            success: true,
            data: result.history || [],
          };
        }

        return {
          success: false,
          error: result.error || "Failed to fetch absence history",
        };
      } catch (error) {
        console.error("❌ Error fetching student absence history:", error);

        return {
          success: false,
          error: error.message,
        };
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
      } catch (error) {
        console.error("❌ Error fetching current absence:", error);

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

    getStudentAbsenceHistory,
    getStudentCurrentAbsence,
  };
};
