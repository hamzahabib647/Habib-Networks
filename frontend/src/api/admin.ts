import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const ADMIN_TOKEN_KEY = "hn_admin_token";

async function adminRequest<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = await storage.secureGet<string>(ADMIN_TOKEN_KEY, "");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (res.status === 401 && auth) {
    await storage.secureRemove(ADMIN_TOKEN_KEY);
  }
  if (!res.ok) {
    const detail = (data && data.detail) || "Something went wrong";
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

export const adminApi = {
  login: (pin: string) => adminRequest("/admin/login", { method: "POST", body: { pin }, auth: false }),
  changePin: (current_pin: string, new_pin: string) =>
    adminRequest("/admin/change-pin", { method: "POST", body: { current_pin, new_pin } }),
  stats: () => adminRequest("/admin/stats"),

  plans: () => adminRequest("/admin/plans"),
  createPlan: (p: any) => adminRequest("/admin/plans", { method: "POST", body: p }),
  updatePlan: (id: string, p: any) => adminRequest(`/admin/plans/${id}`, { method: "PUT", body: p }),
  deletePlan: (id: string) => adminRequest(`/admin/plans/${id}`, { method: "DELETE" }),

  offers: () => adminRequest("/admin/offers"),
  createOffer: (o: any) => adminRequest("/admin/offers", { method: "POST", body: o }),
  updateOffer: (id: string, o: any) => adminRequest(`/admin/offers/${id}`, { method: "PUT", body: o }),
  deleteOffer: (id: string) => adminRequest(`/admin/offers/${id}`, { method: "DELETE" }),

  customers: () => adminRequest("/admin/customers"),
  createCustomer: (c: any) => adminRequest("/admin/customers", { method: "POST", body: c }),
  customerDetail: (phone: string) => adminRequest(`/admin/customers/${phone}`),
  assignPlan: (phone: string, plan_id: string) =>
    adminRequest(`/admin/customers/${phone}/assign-plan`, { method: "POST", body: { plan_id } }),

  complaints: (status?: string) => adminRequest(`/admin/complaints${status ? `?status=${status}` : ""}`),
  updateComplaint: (id: string, status: string) =>
    adminRequest(`/admin/complaints/${id}`, { method: "PUT", body: { status } }),
};

export async function adminLogout() {
  await storage.secureRemove(ADMIN_TOKEN_KEY);
}

export async function hasAdminToken() {
  const t = await storage.secureGet<string>(ADMIN_TOKEN_KEY, "");
  return !!t;
}
