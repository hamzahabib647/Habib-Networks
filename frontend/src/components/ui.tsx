import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

// ---------- Status Pill ----------
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    open: { bg: colors.warningBg, fg: colors.onWarning, label: "Open" },
    in_progress: { bg: colors.infoBg, fg: colors.onInfo, label: "In Progress" },
    resolved: { bg: colors.successBg, fg: colors.onSuccess, label: "Resolved" },
  };
  const s = map[status] || map.open;
  return (
    <View style={[pill.wrap, { backgroundColor: s.bg }]}>
      <View style={[pill.dot, { backgroundColor: s.fg }]} />
      <Text style={[pill.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontFamily: fonts.semibold, fontSize: 12 },
});

// ---------- Filter Chip ----------
export function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[chip.chip, active ? chip.active : chip.inactive]}
    >
      <Text style={[chip.text, { color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const chip = StyleSheet.create({
  chip: {
    height: 36,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  active: { backgroundColor: colors.brandPrimary },
  inactive: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  text: { fontFamily: fonts.semibold, fontSize: 13 },
});

// ---------- Skeleton ----------
export function Skeleton({ height, width, style }: { height: number; width?: any; style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        { height, width: width ?? "100%", borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, opacity },
        style,
      ]}
    />
  );
}
