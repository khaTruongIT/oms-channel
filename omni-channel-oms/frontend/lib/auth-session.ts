export interface AuthSessionTokens {
  access_token?: string;
  refresh_token?: string;
}

export interface AuthSessionStorage {
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export function persistAuthSession(
  session: AuthSessionTokens,
  storage: AuthSessionStorage,
): void {
  storage.removeItem("currentTenant");

  if (session.access_token) {
    storage.setItem("token", session.access_token);
  }

  if (session.refresh_token) {
    storage.setItem("refreshToken", session.refresh_token);
  }
}
