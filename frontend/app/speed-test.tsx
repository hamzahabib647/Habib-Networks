import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import Button from "@/src/components/Button";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

type Phase = "idle" | "ping" | "download" | "upload" | "done";

const SIZE = 260;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const ARC = 0.75; // 270 degree gauge

function niceScale(speed: number) {
  if (speed <= 60) return 100;
  if (speed <= 120) return 150;
  if (speed <= 250) return 300;
  return Math.ceil(speed / 100) * 100;
}

export default function SpeedTest() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [scale, setScale] = useState(300);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (raf.current) clearInterval(raf.current);
    raf.current = null;
  };

  const animateTo = useCallback((target: number, duration: number, onDone?: () => void) => {
    if (raf.current) clearInterval(raf.current);
    const start = Date.now();
    const from = 0;
    raf.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      // add small wobble for realism
      const wobble = t < 1 ? (Math.random() - 0.5) * target * 0.04 : 0;
      setDisplay(Math.max(0, from + (target - from) * eased + wobble));
      if (t >= 1) {
        setDisplay(target);
        if (raf.current) clearInterval(raf.current);
        raf.current = null;
        onDone?.();
      }
    }, 40);
  }, []);

  const run = useCallback(async () => {
    clearAll();
    setResult(null);
    setDisplay(0);
    setPhase("ping");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let res: any;
    try {
      res = await api.speedTest();
    } catch (e: any) {
      toast.show(e.message || "Speed test failed", "error");
      setPhase("idle");
      return;
    }
    setScale(niceScale(res.plan_speed_mbps));

    // Ping phase
    timers.current.push(
      setTimeout(() => {
        setPhase("download");
        animateTo(res.download_mbps, 2600, () => {
          Haptics.selectionAsync();
          setPhase("upload");
          animateTo(res.upload_mbps, 1600, () => {
            setResult(res);
            setPhase("done");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          });
        });
      }, 900),
    );
  }, [animateTo, toast]);

  useEffect(() => {
    run();
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.min(1, display / scale);
  const dash = C * ARC * progress;
  const testing = phase === "ping" || phase === "download" || phase === "upload";
  const label =
    phase === "ping" ? "Pinging server…" : phase === "download" ? "Download" : phase === "upload" ? "Upload" : phase === "done" ? "Download" : "";

  const ratingColor =
    result?.rating === "Excellent" ? "#34D399" : result?.rating === "Good" ? "#FBBF24" : colors.brand;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.navyLight, colors.navy]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="speedtest-back" onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Speed Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.gaugeWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${C * ARC} ${C}`}
            strokeLinecap="round"
            transform={`rotate(135 ${SIZE / 2} ${SIZE / 2})`}
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={phase === "upload" ? "#34D399" : colors.brand}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${dash} ${C}`}
            strokeLinecap="round"
            transform={`rotate(135 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={styles.gaugeValue}>{display.toFixed(display >= 100 ? 0 : 1)}</Text>
          <Text style={styles.gaugeUnit}>Mbps</Text>
          <Text style={styles.gaugePhase}>{label}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metrics}>
        <Metric icon="download" label="Download" value={result ? `${result.download_mbps}` : testing ? "…" : "--"} unit="Mbps" active={phase === "download"} />
        <Metric icon="upload" label="Upload" value={result ? `${result.upload_mbps}` : testing && phase !== "ping" && phase !== "download" ? "…" : "--"} unit="Mbps" active={phase === "upload"} />
        <Metric icon="activity" label="Ping" value={result ? `${result.ping_ms}` : "--"} unit="ms" active={phase === "ping"} />
      </View>

      {phase === "done" && result ? (
        <View style={styles.resultCard}>
          <View style={styles.ratingRow}>
            <View style={[styles.ratingDot, { backgroundColor: ratingColor }]} />
            <Text style={styles.ratingText}>{result.rating} connection</Text>
          </View>
          <Text style={styles.resultServer}>{result.server} · Plan {result.plan_speed_mbps} Mbps</Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <Button
          testID="run-speedtest-button"
          label={testing ? "Testing…" : "Test Again"}
          onPress={run}
          loading={testing}
          disabled={testing}
        />
      </View>
    </View>
  );
}

function Metric({ icon, label, value, unit, active }: any) {
  return (
    <View style={[styles.metric, active && styles.metricActive]}>
      <Feather name={icon} size={18} color={active ? colors.brand : "rgba(255,255,255,0.7)"} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>
        {label} · {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: "#fff" },
  gaugeWrap: { alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  gaugeCenter: { position: "absolute", alignItems: "center" },
  gaugeValue: { fontFamily: fonts.displayBold, fontSize: 56, color: "#fff", lineHeight: 60 },
  gaugeUnit: { fontFamily: fonts.displayMedium, fontSize: 16, color: "rgba(255,255,255,0.6)" },
  gaugePhase: { fontFamily: fonts.semibold, fontSize: 13, color: colors.brand, marginTop: spacing.sm },
  metrics: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  metric: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metricActive: { borderColor: colors.brand, backgroundColor: "rgba(217,4,41,0.12)" },
  metricValue: { fontFamily: fonts.displayBold, fontSize: 20, color: "#fff", marginTop: spacing.sm },
  metricLabel: { fontFamily: fonts.medium, fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  resultCard: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ratingDot: { width: 10, height: 10, borderRadius: 5 },
  ratingText: { fontFamily: fonts.bold, fontSize: 16, color: "#fff" },
  resultServer: { fontFamily: fonts.regular, fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 4 },
});
