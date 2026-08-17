import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Share, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import Button from "@/src/components/Button";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

export default function Referral() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.referral().then(setData).catch((e) => toast.show(e.message || "Failed to load", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyCode = async () => {
    if (!data) return;
    await Clipboard.setStringAsync(data.code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.show("Referral code copied", "success");
  };

  const share = async () => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join me on Habib Networks (SITI Broadband) for blazing-fast fiber! Use my code ${data.code} and we both get 1 month FREE. ${data.share_url}`,
      });
    } catch {
      // user dismissed
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="referral-back" onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 24 }} />
      </View>

      {!data ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing["3xl"] }} showsVerticalScrollIndicator={false}>
          {/* Reward hero */}
          <View style={styles.hero}>
            <LinearGradient colors={[colors.brandSecondary, colors.brandPrimary]} style={StyleSheet.absoluteFill} />
            <View style={styles.giftBadge}>
              <Feather name="gift" size={28} color="#fff" />
            </View>
            <Text style={styles.heroValue}>{data.reward_value}</Text>
            <Text style={styles.heroText}>{data.reward_text}</Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Stat label="Friends Joined" value={data.joined_count} />
            <View style={styles.statDivider} />
            <Stat label="Months Earned" value={data.rewards_earned} />
          </View>

          {/* Code */}
          <Text style={styles.sectionLabel}>Your Referral Code</Text>
          <Pressable testID="copy-referral-code" onPress={copyCode} style={styles.codeBox}>
            <Text style={styles.code}>{data.code}</Text>
            <View style={styles.copyBtn}>
              <Feather name="copy" size={16} color={colors.brandPrimary} />
              <Text style={styles.copyText}>Copy</Text>
            </View>
          </Pressable>

          {/* How it works */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>How it works</Text>
          <View style={styles.steps}>
            {data.steps.map((s: any, i: number) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepIcon}>
                  <Feather name={s.icon} size={18} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <Button
            testID="share-invite-button"
            label="Share Invite Link"
            onPress={share}
            style={{ marginTop: spacing.xl }}
            icon={<Feather name="share-2" size={18} color="#fff" />}
          />
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", overflow: "hidden", ...shadow.card },
  giftBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroValue: { fontFamily: fonts.displayBold, fontSize: 30, color: "#fff", marginTop: spacing.md },
  heroText: { fontFamily: fonts.regular, fontSize: 13.5, color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: spacing.sm },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 36, backgroundColor: colors.borderStrong },
  statValue: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.onSurface },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: 0.3 },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.brandTertiary,
  },
  code: { fontFamily: fonts.displayBold, fontSize: 22, letterSpacing: 2, color: colors.brandPrimary },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  copyText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brandPrimary },
  steps: { gap: spacing.md },
  step: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface },
  stepDesc: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.onSurfaceSecondary, marginTop: 2 },
});
