import api from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post("/auth/login", credentials);
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem("refreshToken", data.refresh_token);
    }
    return data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post("/auth/register", userData);
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem("refreshToken", data.refresh_token);
    }
    return data;
  },

  async signOut() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch (error) {
      // Logout should always succeed even if API call fails
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentTenant");
      window.location.href = "/login";
    }
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get("/auth/profile");
    return data;
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const { data: response } = await api.patch("/auth/profile", data);
    return response;
  },
};

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
  createdAt: string;
}
