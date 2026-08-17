import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const TOKEN_KEY = "hn_auth_token";

async function authHeader(): Promise<Record<string, string>> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, await authHeader());

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = (data && data.detail) || "Something went wrong";
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

export const api = {
  sendOtp: (phone: string) =>
    request("/auth/send-otp", { method: "POST", body: { phone }, auth: false }),
  verifyOtp: (phone: string, otp: string) =>
    request("/auth/verify-otp", { method: "POST", body: { phone, otp }, auth: false }),
  me: () => request("/me"),
  updateMe: (name: string) => request("/me", { method: "PUT", body: { name } }),
  plans: (duration?: string) =>
    request(`/plans${duration ? `?duration=${encodeURIComponent(duration)}` : ""}`),
  offers: () => request("/offers", { auth: false }),
  changePlan: (planId: string) => request(`/plans/${planId}/change`, { method: "POST" }),
  recharge: (planId: string, method: string, upiId?: string) =>
    request("/recharge", { method: "POST", body: { plan_id: planId, method, upi_id: upiId } }),
  recharges: () => request("/recharges"),
  complaints: () => request("/complaints"),
  createComplaint: (subject: string, category: string, description: string) =>
    request("/complaints", { method: "POST", body: { subject, category, description } }),
  customerCare: () => request("/customer-care", { auth: false }),
};
