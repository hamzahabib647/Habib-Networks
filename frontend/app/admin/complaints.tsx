import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { AdminHeader } from "@/src/components/admin/kit";
import { Chip, Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { adminApi } from "@/src/api/admin";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];
const STATUSES = [
  { key: "open", label: "Open", color: colors.onWarning },
  { key: "in_progress", label: "In Progress", color: colors.onInfo },
  { key: "resolved", label: "Resolved", color: colors.onSuccess },
];

export default function AdminComplaints() {
  const router = useRouter();
  const toast = useToast();

  const [filter, setFilter] = useState("active");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: string) => {
    setLoading(true);
    try {
      setItems(await adminApi.complaints(f));
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(filter); }, [load, filter]));

  const setStatus = async (c: any, status: string) => {
    if (c.status === status) return;
    Haptics.selectionAsync();
    try {
      await adminApi.updateComplaint(c.id, status);
      toast.show(`Marked ${status.replace("_", " ")}`, "success");
      load(filter);
    } catch (e: any) {
      toast.show(e.message, "error");
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader title="Complaints" onBack={() => router.back()} />
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((f) => (
            <Chip key={f.key} testID={`admin-cfilter-${f.key}`} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={130} style={{ marginBottom: spacing.md }} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <View testID={`admin-complaint-${item.id}`} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ticket}>{item.ticket_id}</Text>
                <Text style={styles.phone}>+91 {item.phone}</Text>
              </View>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.category}>{item.category}</Text>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => {
                  const on = item.status === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      testID={`set-status-${item.id}-${s.key}`}
                      onPress={() => setStatus(item, s.key)}
                      style={[styles.statusBtn, { borderColor: on ? s.color : colors.border, backgroundColor: on ? s.color + "1A" : colors.surface }]}
                    >
                      {on ? <Feather name="check" size={12} color={s.color} /> : null}
                      <Text style={[styles.statusText, { color: on ? s.color : colors.onSurfaceSecondary }]}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No complaints in this view.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  filterBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticket: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.brandPrimary },
  phone: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary },
  subject: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface, marginTop: spacing.sm },
  desc: { fontFamily: fonts.regular, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 4 },
  category: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: spacing.sm },
  statusRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  statusBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, height: 36, borderRadius: radius.md, borderWidth: 1.5 },
  statusText: { fontFamily: fonts.semibold, fontSize: 12 },
  empty: { fontFamily: fonts.medium, fontSize: 14, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing["3xl"] },
});
