const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const notificationsApi = {
  async registerPushToken(userId, expoToken, deviceName, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/register-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, expoToken, deviceName }),
      },
    );
    return response.json();
  },

  async updateTokenLastActive(expoToken, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/update-token`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expoToken }),
      },
    );
    return response.json();
  },

  async deleteToken(expoToken, token) {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/delete-token`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expoToken }),
      },
    );
    return response.json();
  },
};
