import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Chip, StatusPill, Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const FILTERS = ["Active", "Resolved"];

export default function Complaints() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [filter, setFilter] = useState("Active");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.complaints());
    } catch (e: any) {
      toast.show(e.message || "Failed to load complaints", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = items.filter((c) =>
    filter === "Resolved" ? c.status === "resolved" : c.status !== "resolved",
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.subtitle}>Track and raise service complaints</Text>
        <View style={styles.chipRow}>
          {FILTERS.map((f) => (
            <Chip key={f} testID={`complaint-filter-${f}`} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.listPad}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={110} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <View testID={`complaint-${item.id}`} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ticketId}>{item.ticket_id}</Text>
                <StatusPill status={item.status} />
              </View>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.cardFoot}>
                <View style={styles.metaRow}>
                  <Feather name="tag" size={12} color={colors.onSurfaceSecondary} />
                  <Text style={styles.meta}>{item.category}</Text>
                </View>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="check-circle" size={30} color={colors.onSuccess} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "Resolved" ? "No resolved complaints yet" : "Everything is running smoothly!"}
              </Text>
              <Text style={styles.emptySub}>
                {filter === "Resolved" ? "Resolved tickets will appear here." : "No active complaints on your connection."}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable
        testID="new-complaint-fab"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/new-complaint");
        }}
        style={({ pressed }) => [styles.fab, { bottom: spacing.xl }, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
      >
        <Feather name="plus" size={22} color="#fff" />
        <Text style={styles.fabText}>New</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.onSurface },
  subtitle: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.onSurfaceSecondary, marginTop: 2 },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  listPad: { padding: spacing.lg, paddingBottom: 120 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketId: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.brandPrimary },
  subject: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.onSurface, marginTop: spacing.sm },
  desc: { fontFamily: fonts.regular, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 4 },
  cardFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary },
  date: { fontFamily: fonts.regular, fontSize: 12, color: colors.onSurfaceSecondary },
  emptyWrap: { alignItems: "center", marginTop: spacing["3xl"], paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.onSurface, marginTop: spacing.lg, textAlign: "center" },
  emptySub: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.onSurfaceSecondary, marginTop: 6, textAlign: "center" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    backgroundColor: colors.brandPrimary,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...shadow.card,
  },
  fabText: { fontFamily: fonts.bold, fontSize: 15, color: "#fff" },
});
