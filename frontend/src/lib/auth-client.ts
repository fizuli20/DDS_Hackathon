const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const USE_AUTH_API = process.env.NEXT_PUBLIC_USE_AUTH_API === "true";

export const TOKEN_KEY = "hspts_access_token";
export const USER_KEY = "hspts_auth_user";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  emailVerified?: boolean;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function persistAuth(token: string, user: AuthUser) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem("hspts_auth", "true");
  sessionStorage.setItem("hspts_user_email", user.email);
  sessionStorage.setItem("hspts_user_role", mapRoleForLegacyShell(user.role));
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("hspts_auth");
    sessionStorage.removeItem("hspts_user_email");
    sessionStorage.removeItem("hspts_user_role");
  } catch {
    // noop
  }
}

/** Maps API roles to existing shell behaviour + new mentor/coordinator. */
export function mapRoleForLegacyShell(role: string): string {
  if (role === "admin" || role === "mentor" || role === "coordinator") return "admin";
  return "user";
}

export function isAdminLikeRole(role: string) {
  return role === "admin" || role === "mentor" || role === "coordinator";
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    user?: AuthUser;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message || "Login failed.");
  }
  const access_token = data.access_token;
  const user = data.user;
  if (!access_token || !user) {
    throw new Error("Invalid login response.");
  }
  return { access_token, user };
}

export async function apiRegister(email: string, password: string) {
  const response = await fetch(`${apiBase}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string | string[] };
  if (!response.ok) {
    const msg = data.message;
    const text =
      typeof msg === "string" ? msg : Array.isArray(msg) ? msg.join(" ") : "Registration failed.";
    throw new Error(text);
  }
  return data;
}

export async function apiForgotPassword(email: string) {
  const response = await fetch(`${apiBase}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

export async function apiResetPassword(token: string, password: string) {
  const response = await fetch(`${apiBase}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Reset failed.");
  }
  return data;
}

export async function apiVerifyEmail(token: string) {
  const response = await fetch(`${apiBase}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Verification failed.");
  }
  return data;
}

export async function apiFetchMe(token: string) {
  const response = await fetch(`${apiBase}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json() as Promise<{ user: AuthUser }>;
}
