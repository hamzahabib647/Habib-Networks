import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts } from "@/src/theme/theme";

type Props = {
  used: number;
  total: number;
  size?: number;
  strokeWidth?: number;
};

// Circular data-usage indicator. Numbers use Space Grotesk.
export default function DataRing({ used, total, size = 150, strokeWidth = 14 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, used / total) : 0;
  const dashOffset = circumference * (1 - pct);
  const remaining = Math.max(0, total - used);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.brand}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{used}</Text>
        <Text style={styles.label}>of {total >= 1000 ? `${Math.round(total / 1000)}TB` : `${total}GB`}</Text>
        <Text style={styles.remaining}>{remaining >= 1000 ? `${(remaining / 1000).toFixed(1)}TB` : `${remaining}GB`} left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center" },
  value: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.onSurfaceInverse, lineHeight: 38 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  remaining: { fontFamily: fonts.displayMedium, fontSize: 12, color: colors.brand, marginTop: 4 },
});
