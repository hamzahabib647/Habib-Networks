import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

import { AdminHeader, AdminModal, AdminInput } from "@/src/components/admin/kit";
import { Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { adminApi } from "@/src/api/admin";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

export default function AdminCustomers() {
  const router = useRouter();
  const toast = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ name: "", phone: "", email: "", plan_id: "" });

  const [detail, setDetail] = useState<any>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cs, ps] = await Promise.all([adminApi.customers(), adminApi.plans()]);
      setCustomers(cs);
      setPlans(ps.filter((p: any) => p.active !== false));
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addCustomer = async () => {
    if (!form.name.trim() || form.phone.trim().length < 10) {
      toast.show("Name and a valid 10-digit phone are required", "error");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        plan_id: form.plan_id || null,
      });
      toast.show("Customer added", "success");
      setAddModal(false);
      setForm({ name: "", phone: "", email: "", plan_id: "" });
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (phone: string) => {
    setDetailModal(true);
    setDetail(null);
    try {
      setDetail(await adminApi.customerDetail(phone));
    } catch (e: any) {
      toast.show(e.message, "error");
      setDetailModal(false);
    }
  };

  const assign = async (planId: string) => {
    if (!detail) return;
    setAssigning(true);
    try {
      await adminApi.assignPlan(detail.phone, planId);
      toast.show("Plan activated for customer", "success");
      setDetail(await adminApi.customerDetail(detail.phone));
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Customers"
        onBack={() => router.back()}
        right={
          <Pressable testID="add-customer-btn" onPress={() => setAddModal(true)} hitSlop={12}>
            <Feather name="user-plus" size={22} color={colors.brandPrimary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={72} style={{ marginBottom: spacing.md }} />)}
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable testID={`customer-${item.phone}`} onPress={() => openDetail(item.phone)} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>+91 {item.phone} · {item.connection_id}</Text>
                <Text style={styles.plan}>{item.active_plan_name || "No active plan"}</Text>
              </View>
              <View style={[styles.dot, { backgroundColor: item.is_active ? colors.onSuccess : colors.borderStrong }]} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No customers yet.</Text>}
        />
      )}

      {/* Add customer */}
      <AdminModal visible={addModal} title="Add Customer" onClose={() => setAddModal(false)} onSave={addCustomer} saving={saving} saveLabel="Create Account">
        <AdminInput label="Full Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Customer name" testID="cust-name-input" />
        <AdminInput label="Mobile Number" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t.replace(/[^0-9]/g, "") })} placeholder="10-digit number" keyboardType="number-pad" testID="cust-phone-input" />
        <AdminInput label="Email (optional)" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} placeholder="name@email.com" keyboardType="email-address" testID="cust-email-input" />
        <Text style={styles.pickerLabel}>Assign Plan (optional)</Text>
        <View style={styles.planChips}>
          <Pressable testID="cust-plan-none" onPress={() => setForm({ ...form, plan_id: "" })} style={[styles.chip, form.plan_id === "" ? styles.chipOn : styles.chipOff]}>
            <Text style={[styles.chipText, { color: form.plan_id === "" ? "#fff" : colors.onSurfaceSecondary }]}>None</Text>
          </Pressable>
          {plans.map((p) => {
            const on = form.plan_id === p.id;
            return (
              <Pressable key={p.id} testID={`cust-plan-${p.id}`} onPress={() => setForm({ ...form, plan_id: p.id })} style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
                <Text style={[styles.chipText, { color: on ? "#fff" : colors.onSurfaceSecondary }]}>{p.name} · ₹{p.price}</Text>
              </Pressable>
            );
          })}
        </View>
      </AdminModal>

      {/* Detail */}
      <AdminModal visible={detailModal} title="Customer" onClose={() => setDetailModal(false)}>
        {!detail ? (
          <Skeleton height={200} />
        ) : (
          <View>
            <View style={styles.detailHead}>
              <View style={styles.avatarLg}>
                <Text style={styles.avatarText}>{(detail.name || "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dName}>{detail.name}</Text>
                <Text style={styles.dMeta}>+91 {detail.phone}</Text>
                {detail.email ? <Text style={styles.dMeta}>{detail.email}</Text> : null}
                <Text style={styles.dMeta}>{detail.connection_id}</Text>
              </View>
            </View>

            <View style={styles.currentPlan}>
              <Text style={styles.currentLabel}>CURRENT PLAN</Text>
              <Text style={styles.currentValue}>{detail.active_plan_name || "No active plan"}</Text>
              {detail.plan_end ? (
                <Text style={styles.currentMeta}>Valid till {new Date(detail.plan_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
              ) : null}
            </View>

            <Text style={styles.pickerLabel}>Activate Plan (offline / cash)</Text>
            <View style={styles.planChips}>
              {plans.map((p) => {
                const on = detail.active_plan_id === p.id;
                return (
                  <Pressable key={p.id} disabled={assigning} testID={`assign-plan-${p.id}`} onPress={() => assign(p.id)} style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
                    <Text style={[styles.chipText, { color: on ? "#fff" : colors.onSurfaceSecondary }]}>{p.name} · ₹{p.price}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.pickerLabel}>Recharge History ({detail.recharges?.length || 0})</Text>
            {(detail.recharges || []).slice(0, 5).map((r: any) => (
              <View key={r.id} style={styles.histRow}>
                <Text style={styles.histName}>{r.plan_name}</Text>
                <Text style={styles.histAmt}>₹{r.amount}</Text>
              </View>
            ))}
            {(!detail.recharges || detail.recharges.length === 0) ? <Text style={styles.histEmpty}>No recharges yet</Text> : null}

            <Text style={styles.pickerLabel}>Complaints ({detail.complaints?.length || 0})</Text>
            {(detail.complaints || []).slice(0, 5).map((c: any) => (
              <View key={c.id} style={styles.histRow}>
                <Text style={styles.histName} numberOfLines={1}>{c.subject}</Text>
                <Text style={[styles.histStatus, { color: c.status === "resolved" ? colors.onSuccess : colors.onWarning }]}>{c.status}</Text>
              </View>
            ))}
            {(!detail.complaints || detail.complaints.length === 0) ? <Text style={styles.histEmpty}>No complaints</Text> : null}
          </View>
        )}
      </AdminModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  avatarLg: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.brandPrimary },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface },
  phone: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 1 },
  plan: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.brandPrimary, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  empty: { fontFamily: fonts.medium, fontSize: 14, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing["3xl"] },
  pickerLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  planChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: colors.brandPrimary },
  chipOff: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  chipText: { fontFamily: fonts.semibold, fontSize: 12.5 },
  detailHead: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  dName: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
  dMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.onSurfaceSecondary, marginTop: 1 },
  currentPlan: { backgroundColor: colors.navy, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg },
  currentLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: "rgba(255,255,255,0.6)" },
  currentValue: { fontFamily: fonts.bold, fontSize: 17, color: "#fff", marginTop: 4 },
  currentMeta: { fontFamily: fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  histRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  histName: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onSurface, flex: 1, marginRight: spacing.md },
  histAmt: { fontFamily: fonts.displayMedium, fontSize: 13.5, color: colors.onSurface },
  histStatus: { fontFamily: fonts.semibold, fontSize: 12, textTransform: "capitalize" },
  histEmpty: { fontFamily: fonts.regular, fontSize: 13, color: colors.onSurfaceSecondary, paddingVertical: spacing.sm },
});
