import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

const WEB_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/privacy`;

const SECTIONS = [
  {
    h: "1. Information We Collect",
    b: "Mobile number (to log you in via OTP and identify your connection), account details (name, connection ID, optional email), service data (active plan, recharge history, data-usage summary, speed tests, referral code), and support data (complaint tickets you raise).",
  },
  {
    h: "2. How We Use Your Information",
    b: "To provide and manage your broadband service, plans and recharges; to respond to complaints and provide support; to show relevant plans and offers; and to operate the referral program.",
  },
  {
    h: "3. Payments",
    b: "Recharge payments are processed through your chosen UPI app. We never store your UPI PIN, card numbers, or bank credentials — only a transaction reference, plan, and amount.",
  },
  {
    h: "4. Sharing of Information",
    b: "We do not sell your personal information. We share it only with service providers who help us operate the app (such as hosting), and where required by law.",
  },
  {
    h: "5. Data Retention",
    b: "We retain your account and service data for as long as your connection is active and as needed to meet legal and accounting obligations.",
  },
  {
    h: "6. Your Choices & Rights",
    b: "You can request access to, correction of, or deletion of your account data by contacting us at care@habibnetworks.in.",
  },
  {
    h: "7. Children",
    b: "The app is intended for account holders aged 18 and above and is not directed at children.",
  },
  {
    h: "8. Security",
    b: "We use reasonable technical and organizational measures to protect your data. Authentication tokens are stored securely on your device.",
  },
  {
    h: "9. Changes to This Policy",
    b: "We may update this policy from time to time. Material changes will be reflected here with a new date.",
  },
];

export default function Privacy() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="privacy-back" onPress={() => router.back()} hitSlop={12} style={{ width: 40 }}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing["3xl"] }} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Habib Networks (SITI Broadband) respects your privacy. This policy explains what we collect and how we use it. Last updated: June 2026.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.h} style={styles.section}>
            <Text style={styles.h}>{s.h}</Text>
            <Text style={styles.b}>{s.b}</Text>
          </View>
        ))}

        <Pressable testID="privacy-open-web" onPress={() => Linking.openURL(WEB_URL)} style={styles.webBtn}>
          <Feather name="external-link" size={16} color={colors.brandPrimary} />
          <Text style={styles.webText}>View full policy on the web</Text>
        </Pressable>

        <Pressable testID="privacy-email" onPress={() => Linking.openURL("mailto:care@habibnetworks.in")} style={styles.contact}>
          <Feather name="mail" size={16} color={colors.onSurfaceSecondary} />
          <Text style={styles.contactText}>care@habibnetworks.in</Text>
        </Pressable>
      </ScrollView>
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
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
  intro: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.onSurfaceSecondary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  h: { fontFamily: fonts.bold, fontSize: 16, color: colors.onSurface, marginBottom: 6 },
  b: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.onSurfaceTertiary, lineHeight: 22 },
  webBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    height: 50,
    marginTop: spacing.sm,
  },
  webText: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.brandPrimary },
  contact: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.lg },
  contactText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.onSurfaceSecondary },
});
