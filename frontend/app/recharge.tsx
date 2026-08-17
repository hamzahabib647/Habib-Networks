import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import Button from "@/src/components/Button";
import { Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const METHODS = [
  { key: "gpay", label: "Google Pay", icon: "smartphone", color: "#1A73E8" },
  { key: "phonepe", label: "PhonePe", icon: "smartphone", color: "#5F259F" },
  { key: "paytm", label: "Paytm", icon: "smartphone", color: "#00BAF2" },
  { key: "upi_id", label: "Other UPI App", icon: "at-sign", color: colors.navy },
];

export default function Recharge() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { refreshUser } = useAuth();
  const { planId } = useLocalSearchParams<{ planId: string }>();

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("gpay");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const plans = await api.plans("All");
      const p = plans.find((x: any) => x.id === planId) ?? plans[0];
      setPlan(p);
    } catch (e: any) {
      toast.show(e.message || "Failed to load plan", "error");
    } finally {
      setLoading(false);
    }
  }, [planId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const pay = async () => {
    if (!plan) return;
    setProcessing(true);
    // Attempt to open the real UPI intent on native (best-effort, non-blocking).
    if (Platform.OS !== "web") {
      const upiUrl = `upi://pay?pa=habibnetworks@upi&pn=Habib%20Networks&am=${plan.price}&cu=INR&tn=${encodeURIComponent(plan.name)}`;
      Linking.canOpenURL(upiUrl).then((ok) => ok && Linking.openURL(upiUrl).catch(() => {}));
    }
    try {
      // Simulate gateway processing time
      await new Promise((r) => setTimeout(r, 1400));
      const res = await api.recharge(plan.id, method);
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(res);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(e.message || "Payment failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  // ---------- Success state ----------
  if (success) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top }]}>
        <View style={styles.successBadge}>
          <Feather name="check" size={48} color="#fff" />
        </View>
        <Text testID="recharge-success-title" style={styles.successTitle}>Recharge Successful</Text>
        <Text style={styles.successSub}>Your plan is now active</Text>

        <View style={styles.receipt}>
          <Row label="Plan" value={success.plan_name} />
          <Row label="Amount Paid" value={`₹${success.amount}`} strong />
          <Row label="Transaction ID" value={success.txn_id} mono />
          <Row label="Status" value="Success" success />
        </View>

        <View style={{ flex: 1 }} />
        <View style={{ paddingBottom: insets.bottom + spacing.lg, width: "100%" }}>
          <Button testID="back-to-home-button" label="Back to Home" onPress={() => router.replace("/(tabs)")} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="recharge-back" onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Recharge</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <Text style={styles.sectionLabel}>Order Summary</Text>
        {loading ? (
          <Skeleton height={110} />
        ) : (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planMeta}>
                  {plan.speed_mbps} Mbps · {plan.duration_label}
                </Text>
              </View>
              <Text style={styles.amount}>₹{plan.price}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{plan.price}</Text>
            </View>
          </View>
        )}

        {/* Payment methods */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Select Payment Method</Text>
        <View style={styles.methods}>
          {METHODS.map((m) => {
            const selected = method === m.key;
            return (
              <Pressable
                key={m.key}
                testID={`pay-method-${m.key}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMethod(m.key);
                }}
                style={[styles.method, selected && styles.methodSelected]}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.color + "18" }]}>
                  <Feather name={m.icon as any} size={20} color={m.color} />
                </View>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Feather
                  name={selected ? "check-circle" : "circle"}
                  size={20}
                  color={selected ? colors.brandPrimary : colors.borderStrong}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.upiNote}>
          <Feather name="shield" size={14} color={colors.onSuccess} />
          <Text style={styles.upiNoteText}>100% secure payments via UPI</Text>
        </View>
      </ScrollView>

      {/* Sticky Pay Now */}
      {!loading && plan && (
        <View style={[styles.payBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View>
            <Text style={styles.payBarLabel}>Amount</Text>
            <Text style={styles.payBarAmount}>₹{plan.price}</Text>
          </View>
          <Button testID="pay-now-button" label="Pay Now" onPress={pay} style={{ flex: 1, marginLeft: spacing.lg }} />
        </View>
      )}

      {/* Processing overlay */}
      {processing && (
        <View style={styles.overlay} testID="payment-processing">
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text style={styles.overlayText}>Processing payment…</Text>
            <Text style={styles.overlaySub}>Please don't close the app</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Row({ label, value, strong, mono, success }: any) {
  return (
    <View style={styles.rRow}>
      <Text style={styles.rLabel}>{label}</Text>
      <Text
        style={[
          styles.rValue,
          strong && { fontFamily: fonts.displayBold, fontSize: 16 },
          mono && { fontFamily: fonts.displayMedium },
          success && { color: colors.onSuccess },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 22 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.onSurfaceSecondary, marginBottom: spacing.md, letterSpacing: 0.3 },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planName: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface },
  planMeta: { fontFamily: fonts.medium, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  amount: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.onSurface },
  summaryDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.onSurface },
  totalValue: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.brandPrimary },
  methods: { gap: spacing.md },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodSelected: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  methodIcon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  methodLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.onSurface },
  upiNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.lg },
  upiNoteText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.onSurfaceSecondary },
  payBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  payBarLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurfaceSecondary },
  payBarAmount: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,17,40,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing["2xl"],
    alignItems: "center",
    width: 240,
  },
  overlayText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface, marginTop: spacing.lg },
  overlaySub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.onSurfaceSecondary, marginTop: 4 },
  // success
  successRoot: { flex: 1, backgroundColor: colors.surface, alignItems: "center", paddingHorizontal: spacing.xl },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.onSuccess,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["3xl"],
  },
  successTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.onSurface, marginTop: spacing.xl },
  successSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.onSurfaceSecondary, marginTop: 4 },
  receipt: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing["2xl"],
    gap: spacing.md,
  },
  rRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rLabel: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onSurfaceSecondary },
  rValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onSurface, maxWidth: "60%", textAlign: "right" },
});
