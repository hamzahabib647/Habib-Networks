import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DataRing from "@/src/components/DataRing";
import { Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const QUICK_ACTIONS = [
  { key: "recharge", label: "Recharge", icon: "zap" },
  { key: "upgrade", label: "Change Plan", icon: "trending-up" },
  { key: "speedtest", label: "Speed Test", icon: "activity" },
  { key: "care", label: "Call Care", icon: "phone-call" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [active, setActive] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, off] = await Promise.all([api.me(), api.offers()]);
setActive(me.active);
setOffers(Array.isArray(off) ? off : off?.offers ?? []);
    } catch (e: any) {
      toast.show(e.message || "Failed to load", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onAction = (key: string) => {
    if (key === "recharge") router.push({ pathname: "/recharge", params: { planId: active?.plan?.id ?? "" } });
    else if (key === "upgrade") router.push("/(tabs)/plans");
    else if (key === "speedtest") router.push("/speed-test");
    else if (key === "support") router.push("/(tabs)/complaints");
    else if (key === "care") router.push("/customer-care");
  };

  const onOfferPress = (offer: any) => {
    if (/refer/i.test(offer.title)) router.push("/referral");
    else router.push("/(tabs)/plans");
  };

  const offerW = width - spacing.lg * 2;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.brandPrimary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text testID="user-name" style={styles.name}>
              {user?.name ?? "Customer"}
            </Text>
          </View>
          <Pressable testID="notification-btn" style={styles.bell} hitSlop={8}>
            <Feather name="bell" size={20} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Hero active plan */}
        <View style={styles.section}>
          {loading ? (
            <Skeleton height={220} />
          ) : active ? (
            <View testID="active-plan-card" style={styles.hero}>
              <LinearGradient
                colors={[colors.navyLight, colors.navy]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroTop}>
                <View style={styles.activeBadge}>
                  <View style={styles.pulse} />
                  <Text style={styles.activeText}>ACTIVE PLAN</Text>
                </View>
                <Text style={styles.heroSpeed}>{active.plan.speed_mbps} Mbps</Text>
              </View>

              <View style={styles.heroBody}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroPlanName}>{active.plan.name}</Text>
                  <View style={styles.daysWrap}>
                    <Text style={styles.daysNum}>{active.days_remaining}</Text>
                    <Text style={styles.daysLabel}>days{"\n"}remaining</Text>
                  </View>
                  <Text style={styles.validTill}>
                    Valid till {new Date(active.plan_end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <DataRing used={active.data_used_gb} total={active.data_quota_gb} size={132} strokeWidth={12} />
              </View>

              <Pressable
                testID="quick-recharge-btn"
                onPress={() => onAction("recharge")}
                style={({ pressed }) => [styles.rechargeBtn, pressed && { opacity: 0.9 }]}
              >
                <Feather name="zap" size={16} color={colors.onBrandPrimary} />
                <Text style={styles.rechargeText}>Quick Recharge · ₹{active.plan.price}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.hero, { alignItems: "center", justifyContent: "center", minHeight: 160 }]}>
              <Text style={styles.heroPlanName}>No active plan</Text>
              <Pressable style={styles.rechargeBtn} onPress={() => router.push("/(tabs)/plans")}>
                <Text style={styles.rechargeText}>Browse Plans</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* One-tap speed test */}
        {active ? (
          <Pressable
            testID="speedtest-launcher"
            onPress={() => onAction("speedtest")}
            style={({ pressed }) => [styles.speedStrip, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.speedLeft}>
              <View style={styles.speedIcon}>
                <Feather name="activity" size={20} color={colors.brandPrimary} />
              </View>
              <View>
                <Text style={styles.speedTitle}>Check your speed</Text>
                <Text style={styles.speedSub}>Test your connection health instantly</Text>
              </View>
            </View>
            <View style={styles.speedGo}>
              <Feather name="play" size={16} color="#fff" />
            </View>
          </Pressable>
        ) : null}

        {/* Quick actions */}
        <View style={[styles.section, styles.actionsRow]}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.key}
              testID={`quick-action-${a.key}`}
              onPress={() => onAction(a.key)}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.actionIcon}>
                <Feather name={a.icon as any} size={22} color={colors.brandPrimary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Offers */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Promotional Offers</Text>
        </View>
        {loading ? (
          <View style={styles.section}>
            <Skeleton height={150} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            decelerationRate="fast"
            snapToInterval={offerW + spacing.md}
          >
            {(Array.isArray(offers) ? offers : []).map((o) => (
              <Pressable
                key={o.id}
                testID={`offer-${o.id}`}
                onPress={() => onOfferPress(o)}
                style={[styles.offer, { width: offerW }]}
              >
                <Image source={{ uri: o.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                <LinearGradient
                  colors={["rgba(10,17,40,0.1)", "rgba(10,17,40,0.85)"]}
                  style={StyleSheet.absoluteFill}
                />
                {o.badge ? (
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>{o.badge}</Text>
                  </View>
                ) : null}
                <View style={styles.offerBody}>
                  <Text style={styles.offerTitle}>{o.title}</Text>
                  <Text style={styles.offerSub} numberOfLines={2}>
                    {o.subtitle}
                  </Text>
                  <View style={styles.offerCta}>
                    <Text style={styles.offerCtaText}>{o.cta}</Text>
                    <Feather name="arrow-right" size={14} color={colors.onBrandPrimary} />
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: colors.onSurfaceSecondary },
  name: { fontFamily: fonts.bold, fontSize: 24, color: colors.onSurface, marginTop: 2 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  speedStrip: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speedLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  speedIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  speedTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface },
  speedSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 1 },
  speedGo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399" },
  activeText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,0.75)" },
  heroSpeed: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.brand },
  heroBody: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  heroPlanName: { fontFamily: fonts.semibold, fontSize: 16, color: "#fff" },
  daysWrap: { flexDirection: "row", alignItems: "flex-end", marginTop: spacing.sm, gap: spacing.sm },
  daysNum: { fontFamily: fonts.displayBold, fontSize: 44, color: "#fff", lineHeight: 46 },
  daysLabel: { fontFamily: fonts.medium, fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  validTill: { fontFamily: fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  rechargeBtn: {
    marginTop: spacing.lg,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  rechargeText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onBrandPrimary },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xl },
  action: { alignItems: "center", flex: 1 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onSurface, marginTop: spacing.sm },
  sectionHeaderRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
  offer: { height: 160, borderRadius: radius.lg, overflow: "hidden", justifyContent: "flex-end" },
  offerBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  offerBadgeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5, color: "#fff" },
  offerBody: { padding: spacing.lg },
  offerTitle: { fontFamily: fonts.bold, fontSize: 18, color: "#fff" },
  offerSub: { fontFamily: fonts.regular, fontSize: 12.5, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  offerCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  offerCtaText: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand },
});
