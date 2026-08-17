import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

type ToastType = "success" | "error" | "info";
type ToastCtx = { show: (msg: string, type?: ToastType) => void };

const Ctx = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (m: string, t: ToastType = "info") => {
      setMsg(m);
      setType(t);
      setVisible(true);
      if (t === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (t === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 220, useNativeDriver: true }),
        ]).start(() => setVisible(false));
      }, 2600);
    },
    [opacity, translateY],
  );

  const iconName = type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";
  const tint = type === "success" ? colors.onSuccess : type === "error" ? colors.onError : colors.navy;

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          testID="app-toast"
          pointerEvents="none"
          style={[
            styles.toast,
            shadow.card,
            { top: insets.top + spacing.sm, opacity, transform: [{ translateY }] },
          ]}
        >
          <Feather name={iconName as any} size={20} color={tint} />
          <Text style={styles.msg} numberOfLines={2}>
            {msg}
          </Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 9999,
  },
  msg: { flex: 1, marginLeft: spacing.sm, fontFamily: fonts.semibold, fontSize: 14, color: colors.onSurface },
});
