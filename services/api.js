const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://ecole-attendance-mobile-api.my-school-app.workers.dev";

export const api = {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(email, password, userData) {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, userData }),
    });
    return response.json();
  },

  async checkEmail(email) {
    const response = await fetch(`${API_BASE_URL}/api/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async resetPassword(email) {
    const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
    });
    return response.json();
  },

  async getMatieres() {
    const response = await fetch(`${API_BASE_URL}/api/matieres`);
    return response.json();
  },
};
