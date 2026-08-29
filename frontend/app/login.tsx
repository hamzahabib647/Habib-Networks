import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import Button from "@/src/components/Button";
import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

const SPLASH =
  "https://images.unsplash.com/photo-1648737966100-18f790c93a86?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const sendOtp = async () => {
    if (phone.length !== 10) {
      toast.show("Enter a valid 10-digit mobile number", "error");
      return;
    }
    setLoading(true);
    try {
      await api.sendOtp(phone);
      setStep("otp");
      toast.show("OTP sent! Use 1234 to continue", "success");
      setTimeout(() => otpRef.current?.focus(), 350);
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 4) {
      toast.show("Enter the 4-digit OTP", "error");
      return;
    }
    setLoading(true);
    try {
      await signIn(phone, otp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: SPLASH }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient
        colors={["rgba(10,17,40,0.15)", "rgba(10,17,40,0.55)", colors.navy]}
        locations={[0, 0.45, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.brandTop, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>HN</Text>
        </View>
        <Text style={styles.brandName}>Habib Networks</Text>
        <Text style={styles.brandTag}>SITI Broadband · Fiber that never sleeps</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable style={styles.sheet} onPress={Keyboard.dismiss}>
            {step === "phone" ? (
              <>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Login with your registered mobile number</Text>

                <View style={styles.inputRow}>
                  <View style={styles.ccBox}>
                    <Text style={styles.ccText}>+91</Text>
                  </View>
                 <TextInput
  ref={phoneRef}
  testID="phone-input"
  style={styles.input}
  placeholder="10-digit mobile number"
  placeholderTextColor={colors.onSurfaceSecondary}
  keyboardType="number-pad"
  maxLength={10}
  value={phone}
  onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ""))}
  returnKeyType="done"
  onSubmitEditing={sendOtp}
  focusable={true}
  onClick={(e: any) => e.stopPropagation()}
  onFocus={() => {
    if (Platform.OS === 'web') {
      phoneRef.current?.focus();
    }
  }}
/>
                </View>

                <Button
                  testID="send-otp-button"
                  label="Send OTP"
                  onPress={sendOtp}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            ) : (
              <>
                <Pressable
                  testID="back-to-phone"
                  onPress={() => setStep("phone")}
                  style={styles.backRow}
                  hitSlop={12}
                >
                  <Feather name="arrow-left" size={18} color={colors.onSurfaceSecondary} />
                  <Text style={styles.backText}>Change number</Text>
                </Pressable>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>Sent to +91 {phone} · Use 1234</Text>

                <TextInput
                  testID="otp-input"
                  ref={otpRef}
                  style={styles.otpInput}
                  placeholder="• • • •"
                  placeholderTextColor={colors.borderStrong}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ""))}
                  returnKeyType="done"
                  onSubmitEditing={verify}
                />

                <Button
                  testID="verify-otp-button"
                  label="Verify & Continue"
                  onPress={verify}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            )}
            <View style={{ height: insets.bottom + spacing.md }} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  brandTop: { alignItems: "center", paddingHorizontal: spacing.xl },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontFamily: fonts.displayBold, fontSize: 26, color: "#fff" },
  brandName: { fontFamily: fonts.bold, fontSize: 26, color: "#fff", marginTop: spacing.md },
  brandTag: { fontFamily: fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  kav: { flex: 1, justifyContent: "flex-end" },
  scroll: { flexGrow: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingTop: spacing["2xl"],
  },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.onSurface },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.onSurfaceSecondary, marginTop: 6 },
  inputRow: { flexDirection: "row", marginTop: spacing.xl, gap: spacing.sm },
  ccBox: {
    height: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  ccText: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.onSurface },
  input: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    color: colors.onSurface,
  },
  otpInput: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.xl,
    textAlign: "center",
    fontFamily: fonts.displayBold,
    fontSize: 28,
    letterSpacing: 12,
    color: colors.onSurface,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  backText: { fontFamily: fonts.medium, fontSize: 14, color: colors.onSurfaceSecondary, marginLeft: 6 },
});
