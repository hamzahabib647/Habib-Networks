import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import Button from "@/src/components/Button";
import { useToast } from "@/src/components/Toast";
import { storage } from "@/src/utils/storage";
import { adminApi, ADMIN_TOKEN_KEY, hasAdminToken } from "@/src/api/admin";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

export default function AdminLogin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    hasAdminToken().then((has) => {
      if (has) router.replace("/admin/dashboard");
    });
  }, [router]);

  const login = async () => {
    if (pin.length < 4) {
      toast.show("Enter your admin PIN", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.login(pin);
      await storage.secureSet(ADMIN_TOKEN_KEY, res.access_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/admin/dashboard");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show(e.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.navyLight, colors.navy]} style={StyleSheet.absoluteFill} />
      <Pressable
        testID="admin-exit"
        onPress={() => router.replace("/login")}
        hitSlop={12}
        style={[styles.exit, { top: insets.top + spacing.sm }]}
      >
        <Feather name="x" size={22} color="rgba(255,255,255,0.7)" />
      </Pressable>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.center}>
        <View style={styles.lockBadge}>
          <Feather name="shield" size={30} color="#fff" />
        </View>
        <Text style={styles.title}>Admin Access</Text>
        <Text style={styles.subtitle}>Habib Networks control panel</Text>

        <TextInput
          testID="admin-pin-input"
          ref={inputRef}
          style={styles.pinInput}
          placeholder="• • • •"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          value={pin}
          onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ""))}
          returnKeyType="go"
          onSubmitEditing={login}
        />

        <Button testID="admin-login-button" label="Unlock Panel" onPress={login} loading={loading} style={{ width: "100%", marginTop: spacing.xl }} />
        <Text style={styles.hint}>Staff only. Contact the owner for the PIN.</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  exit: { position: "absolute", right: spacing.lg, zIndex: 2, padding: spacing.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  lockBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.bold, fontSize: 26, color: "#fff", marginTop: spacing.lg },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  pinInput: {
    width: "100%",
    height: 64,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: spacing["2xl"],
    textAlign: "center",
    fontFamily: fonts.displayBold,
    fontSize: 28,
    letterSpacing: 16,
    color: "#fff",
  },
  hint: { fontFamily: fonts.regular, fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginTop: spacing.lg, textAlign: "center" },
});
