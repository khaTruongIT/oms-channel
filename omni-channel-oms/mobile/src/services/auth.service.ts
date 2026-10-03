/**
 * Authentication Service
 * Handles login, register, logout, and profile management
 */

import apiClient, { STORAGE_KEYS } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponse, User } from "@types";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

// Storage keys for tenant data
const TENANT_STORAGE_KEYS = {
  TENANT_ROLES: "@oms_tenant_roles",
  SELECTED_TENANT: "@oms_selected_tenant",
};

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    // Store token and user data
    await this.storeAuthData(response.data);

    return response.data;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      userData,
    );

    // Store token and user data
    await this.storeAuthData(response.data);

    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>("/auth/profile");

    // Update stored user data
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify(response.data),
    );

    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await apiClient.patch<User>("/auth/profile", data);

    // Update stored user data
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify(response.data),
    );

    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Clear all stored data
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER,
      TENANT_STORAGE_KEYS.TENANT_ROLES,
      TENANT_STORAGE_KEYS.SELECTED_TENANT,
    ]);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Get stored tenant roles
   */
  async getStoredTenantRoles(): Promise<any[]> {
    const rolesJson = await AsyncStorage.getItem(
      TENANT_STORAGE_KEYS.TENANT_ROLES,
    );
    return rolesJson ? JSON.parse(rolesJson) : [];
  }

  /**
   * Get stored selected tenant
   */
  async getStoredSelectedTenant(): Promise<any | null> {
    const tenantJson = await AsyncStorage.getItem(
      TENANT_STORAGE_KEYS.SELECTED_TENANT,
    );
    return tenantJson ? JSON.parse(tenantJson) : null;
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, authData.access_token],
      [STORAGE_KEYS.USER, JSON.stringify(authData.user)],
      [TENANT_STORAGE_KEYS.TENANT_ROLES, JSON.stringify(authData.tenantRoles)],
    ]);

    // Store first tenant as selected tenant if available
    if (authData.tenantRoles && authData.tenantRoles.length > 0) {
      await AsyncStorage.setItem(
        TENANT_STORAGE_KEYS.SELECTED_TENANT,
        JSON.stringify(authData.tenantRoles[0].tenant),
      );
    }
  }
}

export default new AuthService();
