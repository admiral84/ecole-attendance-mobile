const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const teacherApi = {
  async getTeacherClasses(teacherId, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/classes/${teacherId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.json();
  },

  async getStudentsByClass(classId, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/students/${classId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.json();
  },

  async getTeacherSchedule(teacherId, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/schedule/${teacherId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.json();
  },

  async markAbsence(absenceData, token) {
    const response = await fetch(`${API_BASE_URL}/api/teacher/mark-absence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(absenceData),
    });
    return response.json();
  },

  async markPresent(returnData, token) {
    const response = await fetch(`${API_BASE_URL}/api/teacher/mark-present`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(returnData),
    });
    return response.json();
  },

  async createSchedule(scheduleData, token) {
    const response = await fetch(`${API_BASE_URL}/api/teacher/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(scheduleData),
    });
    return response.json();
  },

  async deleteSchedule(seanceId, teacherId, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/schedule/${seanceId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teacherId }),
      },
    );
    return response.json();
  },

  async getAbsencesByDate(date, classId, token) {
    const url = classId
      ? `${API_BASE_URL}/api/teacher/absences?date=${date}&classId=${classId}`
      : `${API_BASE_URL}/api/teacher/absences?date=${date}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async justifyAbsence(absenceId, justified, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/justify-absence`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ absenceId, justified }),
      },
    );
    return response.json();
  },

  async getStudentAbsenceHistory(studentId, startDate, endDate, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/student-absences/${studentId}?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.json();
  },

  async getStudentCurrentAbsence(studentId, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/teacher/student-current-absence/${studentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.json();
  },
};
