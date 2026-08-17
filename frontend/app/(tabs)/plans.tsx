import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlanCard, { PlanType } from "@/src/components/PlanCard";
import { Chip, Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { colors, fonts, spacing } from "@/src/theme/theme";

const FILTERS = ["All", "Monthly", "6 Months", "Yearly"];

export default function Plans() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [filter, setFilter] = useState("All");
  const [plans, setPlans] = useState<PlanType[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | undefined>(user?.active_plan_id);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (f: string) => {
      setLoading(true);
      try {
        const [data, me] = await Promise.all([api.plans(f), api.me()]);
        setPlans(data);
        setActivePlanId(me.user.active_plan_id);
      } catch (e: any) {
        toast.show(e.message || "Failed to load plans", "error");
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useFocusEffect(
    useCallback(() => {
      load(filter);
    }, [load, filter]),
  );

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Broadband Plans</Text>
        <Text style={styles.subtitle}>Choose a plan that fits your speed</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroller}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f}
              testID={`filter-${f.replace(/\s/g, "-")}`}
              label={f}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.listPad}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={260} style={{ marginBottom: spacing.lg }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              isActive={item.id === activePlanId}
              onSelect={() => router.push({ pathname: "/recharge", params: { planId: item.id } })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No plans found for this filter.</Text>
          }
        />
      )}
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
  chipScroller: { marginTop: spacing.lg, marginHorizontal: -spacing.lg },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  listPad: { padding: spacing.lg },
  empty: { fontFamily: fonts.medium, fontSize: 14, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing["3xl"] },
});
