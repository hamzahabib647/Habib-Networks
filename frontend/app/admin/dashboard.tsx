import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminModal, AdminInput } from "@/src/components/admin/kit";
import { Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { adminApi, adminLogout } from "@/src/api/admin";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const NAV = [
  { key: "plans", label: "Plans", icon: "wifi", route: "/admin/plans", desc: "Add & edit plans" },
  { key: "offers", label: "Offers", icon: "gift", route: "/admin/offers", desc: "Promotions" },
  { key: "customers", label: "Customers", icon: "users", route: "/admin/customers", desc: "Accounts & plans" },
  { key: "complaints", label: "Complaints", icon: "life-buoy", route: "/admin/complaints", desc: "Support tickets" },
];

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await adminApi.stats());
    } catch (e: any) {
      toast.show(e.message || "Failed to load", "error");
      if (/authentication/i.test(e.message)) router.replace("/admin");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const logout = async () => {
    await adminLogout();
    router.replace("/admin");
  };

  const changePin = async () => {
    if (newPin.length < 4) {
      toast.show("New PIN must be at least 4 digits", "error");
      return;
    }
    setSavingPin(true);
    try {
      await adminApi.changePin(currentPin, newPin);
      toast.show("Admin PIN updated", "success");
      setPinModal(false);
      setCurrentPin("");
      setNewPin("");
    } catch (e: any) {
      toast.show(e.message || "Could not update PIN", "error");
    } finally {
      setSavingPin(false);
    }
  };

  const statCards = stats
    ? [
        { label: "Customers", value: stats.total_customers, icon: "users", color: colors.brandPrimary },
        { label: "Active Plans", value: stats.active_plans, icon: "zap", color: colors.onSuccess },
        { label: "Revenue", value: `₹${stats.total_revenue.toLocaleString("en-IN")}`, icon: "trending-up", color: colors.navy },
        { label: "Open Tickets", value: stats.open_complaints, icon: "alert-circle", color: colors.onWarning },
      ]
    : [];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#fff" />
        }
      >
        {/* Header */}
        <LinearGradient colors={[colors.navyLight, colors.navy]} style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.hello}>Admin Panel</Text>
              <Text style={styles.brand}>Habib Networks</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable testID="change-pin-btn" onPress={() => setPinModal(true)} style={styles.iconBtn} hitSlop={8}>
                <Feather name="key" size={18} color="#fff" />
              </Pressable>
              <Pressable testID="admin-logout-btn" onPress={logout} style={styles.iconBtn} hitSlop={8}>
                <Feather name="log-out" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            {loading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} width="47%" style={{ marginBottom: spacing.md }} />)
              : statCards.map((s) => (
                  <View key={s.label} testID={`stat-${s.label}`} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: s.color + "1A" }]}>
                      <Feather name={s.icon as any} size={16} color={s.color} />
                    </View>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
          </View>
        </LinearGradient>

        {/* Manage */}
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.navGrid}>
          {NAV.map((n) => (
            <Pressable
              key={n.key}
              testID={`admin-nav-${n.key}`}
              onPress={() => router.push(n.route as any)}
              style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.navIcon}>
                <Feather name={n.icon as any} size={22} color={colors.brandPrimary} />
              </View>
              <Text style={styles.navLabel}>{n.label}</Text>
              <Text style={styles.navDesc}>{n.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <AdminModal
        visible={pinModal}
        title="Change Admin PIN"
        onClose={() => setPinModal(false)}
        onSave={changePin}
        saving={savingPin}
        saveLabel="Update PIN"
      >
        <AdminInput label="Current PIN" value={currentPin} onChangeText={(t) => setCurrentPin(t.replace(/[^0-9]/g, ""))} placeholder="Enter current PIN" keyboardType="number-pad" testID="current-pin-input" />
        <AdminInput label="New PIN" value={newPin} onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, ""))} placeholder="Choose a new PIN" keyboardType="number-pad" testID="new-pin-input" />
      </AdminModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  hello: { fontFamily: fonts.medium, fontSize: 13, color: "rgba(255,255,255,0.65)" },
  brand: { fontFamily: fonts.bold, fontSize: 24, color: "#fff", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: spacing.xl },
  statCard: { width: "47%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  statIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: fonts.displayBold, fontSize: 22, color: "#fff", marginTop: spacing.sm },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  navGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: spacing.lg, gap: spacing.md },
  navCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  navIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  navLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface, marginTop: spacing.md },
  navDesc: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.onSurfaceSecondary, marginTop: 2 },
});
