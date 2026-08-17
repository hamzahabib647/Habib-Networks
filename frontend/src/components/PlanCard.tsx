import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

export type PlanType = {
  id: string;
  name: string;
  speed_mbps: number;
  price: number;
  duration_label: string;
  duration_days: number;
  data_quota_gb: number;
  features: string[];
  tag?: string | null;
};

export default function PlanCard({
  plan,
  isActive,
  onSelect,
}: {
  plan: PlanType;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <View testID={`plan-card-${plan.id}`} style={[styles.card, isActive && styles.cardActive]}>
      {plan.tag ? (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{plan.tag}</Text>
        </View>
      ) : null}

      <View style={styles.head}>
        <View>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.duration}>{plan.duration_label}</Text>
        </View>
        <View style={styles.speedBox}>
          <Text style={styles.speed}>{plan.speed_mbps}</Text>
          <Text style={styles.speedUnit}>Mbps</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.currency}>₹</Text>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.per}>
          {plan.duration_label === "Monthly" ? "/mo" : plan.duration_label === "Yearly" ? "/yr" : "/6mo"}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.features}>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Feather name="check-circle" size={15} color={colors.onSuccess} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {isActive ? (
        <View style={[styles.cta, styles.ctaActive]}>
          <Feather name="check" size={16} color={colors.onSuccess} />
          <Text style={[styles.ctaText, { color: colors.onSuccess }]}>Current Plan</Text>
        </View>
      ) : (
        <Pressable
          testID={`select-plan-${plan.id}`}
          onPress={onSelect}
          style={({ pressed }) => [styles.cta, styles.ctaSelect, pressed && { opacity: 0.9 }]}
        >
          <Text style={[styles.ctaText, { color: colors.onBrandPrimary }]}>Select Plan</Text>
          <Feather name="arrow-right" size={16} color={colors.onBrandPrimary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  cardActive: { borderColor: colors.brandPrimary, borderWidth: 2 },
  tag: {
    position: "absolute",
    top: -1,
    right: spacing.lg,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  tagText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5, color: "#fff" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface, maxWidth: 200 },
  duration: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  speedBox: { alignItems: "flex-end" },
  speed: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.brandPrimary, lineHeight: 28 },
  speedUnit: { fontFamily: fonts.displayMedium, fontSize: 11, color: colors.onSurfaceSecondary },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: spacing.md },
  currency: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.onSurface, marginBottom: 4 },
  price: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.onSurface, lineHeight: 34 },
  per: { fontFamily: fonts.medium, fontSize: 14, color: colors.onSurfaceSecondary, marginBottom: 4, marginLeft: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  features: { gap: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.onSurfaceTertiary },
  cta: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  ctaSelect: { backgroundColor: colors.brandPrimary },
  ctaActive: { backgroundColor: colors.successBg },
  ctaText: { fontFamily: fonts.bold, fontSize: 15 },
});
