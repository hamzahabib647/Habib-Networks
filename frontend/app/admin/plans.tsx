import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { AdminHeader, AdminModal, AdminInput } from "@/src/components/admin/kit";
import { Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { adminApi } from "@/src/api/admin";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const DURATIONS = ["Monthly", "6 Months", "Yearly"];
const EMPTY = { name: "", speed_mbps: "", price: "", duration_label: "Monthly", features: "", tag: "" };

export default function AdminPlans() {
  const router = useRouter();
  const toast = useToast();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const load = useCallback(async () => {
    try {
      setPlans(await adminApi.plans());
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      speed_mbps: String(p.speed_mbps),
      price: String(p.price),
      duration_label: p.duration_label,
      features: (p.features || []).join(", "),
      tag: p.tag || "",
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.speed_mbps || !form.price) {
      toast.show("Name, speed and price are required", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      speed_mbps: parseInt(form.speed_mbps, 10) || 0,
      price: parseInt(form.price, 10) || 0,
      duration_label: form.duration_label,
      features: form.features.split(",").map((f: string) => f.trim()).filter(Boolean),
      tag: form.tag.trim() || null,
    };
    setSaving(true);
    try {
      if (editId) await adminApi.updatePlan(editId, payload);
      else await adminApi.createPlan(payload);
      toast.show(editId ? "Plan updated" : "Plan created", "success");
      setModal(false);
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: any) => {
    Haptics.selectionAsync();
    try {
      await adminApi.updatePlan(p.id, { active: !(p.active !== false) });
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    }
  };

  const remove = async (p: any) => {
    try {
      await adminApi.deletePlan(p.id);
      toast.show("Plan deleted", "info");
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Plans"
        onBack={() => router.back()}
        right={
          <Pressable testID="add-plan-btn" onPress={openCreate} hitSlop={12}>
            <Feather name="plus-circle" size={24} color={colors.brandPrimary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={90} style={{ marginBottom: spacing.md }} />)}
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => {
            const active = item.active !== false;
            return (
              <View testID={`admin-plan-${item.id}`} style={[styles.card, !active && { opacity: 0.6 }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.name}</Text>
                      {item.tag ? <View style={styles.tag}><Text style={styles.tagText}>{item.tag}</Text></View> : null}
                    </View>
                    <Text style={styles.meta}>{item.speed_mbps} Mbps · {item.duration_label}</Text>
                  </View>
                  <Text style={styles.price}>₹{item.price}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable testID={`toggle-plan-${item.id}`} onPress={() => toggleActive(item)} style={styles.actionBtn}>
                    <Feather name={active ? "eye" : "eye-off"} size={15} color={active ? colors.onSuccess : colors.onSurfaceSecondary} />
                    <Text style={[styles.actionText, { color: active ? colors.onSuccess : colors.onSurfaceSecondary }]}>
                      {active ? "Visible" : "Hidden"}
                    </Text>
                  </Pressable>
                  <Pressable testID={`edit-plan-${item.id}`} onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Feather name="edit-2" size={15} color={colors.navy} />
                    <Text style={[styles.actionText, { color: colors.navy }]}>Edit</Text>
                  </Pressable>
                  <Pressable testID={`delete-plan-${item.id}`} onPress={() => remove(item)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={15} color={colors.onError} />
                    <Text style={[styles.actionText, { color: colors.onError }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <AdminModal visible={modal} title={editId ? "Edit Plan" : "New Plan"} onClose={() => setModal(false)} onSave={save} saving={saving} saveLabel={editId ? "Save Changes" : "Create Plan"}>
        <AdminInput label="Plan Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="e.g. Turbo 100" testID="plan-name-input" />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <AdminInput label="Speed (Mbps)" value={form.speed_mbps} onChangeText={(t) => setForm({ ...form, speed_mbps: t.replace(/[^0-9]/g, "") })} placeholder="100" keyboardType="number-pad" testID="plan-speed-input" />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}>
            <AdminInput label="Price (₹)" value={form.price} onChangeText={(t) => setForm({ ...form, price: t.replace(/[^0-9]/g, "") })} placeholder="699" keyboardType="number-pad" testID="plan-price-input" />
          </View>
        </View>
        <Text style={styles.fieldLabel}>Duration</Text>
        <View style={styles.segRow}>
          {DURATIONS.map((d) => {
            const on = form.duration_label === d;
            return (
              <Pressable key={d} testID={`plan-duration-${d.replace(/\s/g, "-")}`} onPress={() => setForm({ ...form, duration_label: d })} style={[styles.seg, on ? styles.segOn : styles.segOff]}>
                <Text style={[styles.segText, { color: on ? "#fff" : colors.onSurfaceSecondary }]}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
        <AdminInput label="Features (comma separated)" value={form.features} onChangeText={(t) => setForm({ ...form, features: t })} placeholder="Unlimited Data, Free Router, OTT" multiline testID="plan-features-input" />
        <AdminInput label="Tag (optional)" value={form.tag} onChangeText={(t) => setForm({ ...form, tag: t })} placeholder="Popular / Best Value" testID="plan-tag-input" />
      </AdminModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface },
  tag: { backgroundColor: colors.brandTertiary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  tagText: { fontFamily: fonts.bold, fontSize: 10, color: colors.brandPrimary },
  meta: { fontFamily: fonts.medium, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  price: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.brandPrimary },
  actions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontFamily: fonts.semibold, fontSize: 13 },
  row2: { flexDirection: "row" },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onSurface, marginBottom: 6 },
  segRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  seg: { flex: 1, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.brandPrimary },
  segOff: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  segText: { fontFamily: fonts.semibold, fontSize: 13 },
});
