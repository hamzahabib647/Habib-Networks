import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Linking, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useToast } from "@/src/components/Toast";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

export default function CustomerCare() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [info, setInfo] = useState<any>(null);
  const [inCall, setInCall] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    api.customerCare().then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  const dial = async () => {
    if (!info) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `tel:${info.phone}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else toast.show("Calling not supported on this device", "error");
  };

  const startInApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSeconds(0);
    setInCall(true);
    // Auto-connect simulation
  };

  const endCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInCall(false);
    toast.show("Call ended", "info");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ---------- In-app calling screen ----------
  if (inCall) {
    return (
      <View style={styles.callRoot}>
        <LinearGradient colors={[colors.navyLight, colors.navy]} style={StyleSheet.absoluteFill} />
        <View style={{ paddingTop: insets.top + spacing["3xl"], alignItems: "center" }}>
          <View style={styles.callAvatar}>
            <Feather name="headphones" size={40} color="#fff" />
          </View>
          <Text style={styles.callName}>Habib Networks Care</Text>
          <Text style={styles.callStatus}>{seconds < 2 ? "Connecting…" : `In call · ${fmt(seconds)}`}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={[styles.callControls, { paddingBottom: insets.bottom + spacing["2xl"] }]}>
          <View style={styles.callActionsRow}>
            <View style={styles.callChip}>
              <Feather name="mic-off" size={20} color="#fff" />
              <Text style={styles.callChipText}>Mute</Text>
            </View>
            <View style={styles.callChip}>
              <Feather name="volume-2" size={20} color="#fff" />
              <Text style={styles.callChipText}>Speaker</Text>
            </View>
            <View style={styles.callChip}>
              <Feather name="grid" size={20} color="#fff" />
              <Text style={styles.callChipText}>Keypad</Text>
            </View>
          </View>
          <Pressable testID="end-call-button" onPress={endCall} style={styles.endBtn}>
            <Feather name="phone-off" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Customer Care</Text>
        <Pressable testID="close-care" onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      {!info ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <View style={{ padding: spacing.lg }}>
          <View style={styles.hero}>
            <LinearGradient colors={[colors.brandSecondary, colors.brandPrimary]} style={StyleSheet.absoluteFill} />
            <Feather name="headphones" size={30} color="#fff" />
            <Text style={styles.heroTitle}>We're here 24x7</Text>
            <Text style={styles.heroSub}>{info.hours}</Text>
            <Text style={styles.heroNumber}>{info.display}</Text>
          </View>

          <Pressable testID="call-now-button" onPress={dial} style={styles.primaryAction}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIcon}>
                <Feather name="phone-call" size={20} color={colors.onBrandPrimary} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Call Now</Text>
                <Text style={styles.actionSub}>Open dialer · {info.display}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <Pressable testID="in-app-call-button" onPress={startInApp} style={styles.secondaryAction}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: colors.brandTertiary }]}>
                <Feather name="wifi" size={20} color={colors.brandPrimary} />
              </View>
              <View>
                <Text style={[styles.actionTitle, { color: colors.onSurface }]}>Call over Internet</Text>
                <Text style={[styles.actionSub, { color: colors.onSurfaceSecondary }]}>Free in-app VoIP call</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.onSurfaceSecondary} />
          </Pressable>

          <View style={styles.contactRow}>
            <Feather name="mail" size={16} color={colors.onSurfaceSecondary} />
            <Text style={styles.contactText}>{info.email}</Text>
          </View>
        </View>
      )}
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
  headerTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.onSurface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroTitle: { fontFamily: fonts.bold, fontSize: 20, color: "#fff", marginTop: spacing.md },
  heroSub: { fontFamily: fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  heroNumber: { fontFamily: fonts.displayBold, fontSize: 26, color: "#fff", marginTop: spacing.md },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontFamily: fonts.bold, fontSize: 15, color: "#fff" },
  actionSub: { fontFamily: fonts.regular, fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  contactRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.xl },
  contactText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onSurfaceSecondary },
  // in-call
  callRoot: { flex: 1, backgroundColor: colors.navy },
  callAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  callName: { fontFamily: fonts.bold, fontSize: 22, color: "#fff", marginTop: spacing.lg },
  callStatus: { fontFamily: fonts.displayMedium, fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 },
  callControls: { alignItems: "center" },
  callActionsRow: { flexDirection: "row", gap: spacing["2xl"], marginBottom: spacing["2xl"] },
  callChip: { alignItems: "center", gap: 6 },
  callChipText: { fontFamily: fonts.medium, fontSize: 12, color: "rgba(255,255,255,0.8)" },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
});
