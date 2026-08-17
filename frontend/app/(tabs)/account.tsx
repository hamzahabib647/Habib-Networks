import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

export default function Account() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();
  const [recharges, setRecharges] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      setRecharges(await api.recharges());
    } catch {
      // silent
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const initials = (user?.name ?? "HN")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const copyId = async () => {
    await Clipboard.setStringAsync(user?.connection_id ?? "");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.show("Connection ID copied", "success");
  };

  const rows = [
    { key: "referral", icon: "gift", label: "Refer & Earn", value: "1 mo free", onPress: () => router.push("/referral") },
    { key: "speedtest", icon: "activity", label: "Speed Test", value: "", onPress: () => router.push("/speed-test") },
    { key: "billing", icon: "file-text", label: "Billing History", value: `${recharges.length} txns`, onPress: () => toast.show(recharges.length ? `Last: ₹${recharges[0].amount} · ${recharges[0].plan_name}` : "No recharges yet", "info") },
    { key: "care", icon: "phone-call", label: "Customer Care", value: "24x7", onPress: () => router.push("/customer-care") },
    { key: "plans", icon: "wifi", label: "Change Plan", value: "", onPress: () => router.push("/(tabs)/plans") },
    { key: "privacy", icon: "shield", label: "Privacy Policy", value: "", onPress: () => router.push("/privacy") },
    { key: "about", icon: "info", label: "About Habib Networks", value: "v1.0", onPress: () => toast.show("Habib Networks · SITI Broadband", "info") },
  ];

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Account</Text>
      </View>

      {/* Profile card */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text testID="account-name" style={styles.pName}>{user?.name}</Text>
            <Text style={styles.pPhone}>+91 {user?.phone}</Text>
          </View>
        </View>

        <Pressable testID="copy-connection-id" onPress={copyId} style={styles.connBox}>
          <View>
            <Text style={styles.connLabel}>CONNECTION ID</Text>
            <Text style={styles.connId}>{user?.connection_id}</Text>
          </View>
          <Feather name="copy" size={18} color={colors.brandPrimary} />
        </Pressable>
      </View>

      {/* Settings rows */}
      <View style={styles.section}>
        <View style={styles.card}>
          {rows.map((r, i) => (
            <Pressable
              key={r.key}
              testID={`account-row-${r.key}`}
              onPress={r.onPress}
              onLongPress={r.key === "about" ? () => router.push("/admin") : undefined}
              delayLongPress={600}
              style={({ pressed }) => [styles.row, i < rows.length - 1 && styles.rowBorder, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.rowIcon}>
                <Feather name={r.icon as any} size={18} color={colors.brandPrimary} />
              </View>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <View style={styles.rowRight}>
                {r.value ? <Text style={styles.rowValue}>{r.value}</Text> : null}
                <Feather name="chevron-right" size={18} color={colors.onSurfaceSecondary} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          testID="logout-button"
          onPress={logout}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
        >
          <Feather name="log-out" size={18} color={colors.onError} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surfaceSecondary },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.onSurface },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.brandPrimary },
  pName: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
  pPhone: { fontFamily: fonts.displayMedium, fontSize: 14, color: colors.onSurfaceSecondary, marginTop: 2 },
  connBox: {
    marginTop: spacing.md,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, color: "rgba(255,255,255,0.6)" },
  connId: { fontFamily: fonts.displayBold, fontSize: 20, color: "#fff", marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.onSurface },
  rowRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.onSurfaceSecondary },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    height: 54,
  },
  logoutText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onError },
});
