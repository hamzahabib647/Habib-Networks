import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/src/components/Button";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/api/client";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

const CATEGORIES = ["Speed Issue", "No Connection", "Billing", "Hardware", "Other"];

export default function NewComplaint() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (subject.trim().length < 3) {
      toast.show("Please add a short subject", "error");
      return;
    }
    if (description.trim().length < 5) {
      toast.show("Please describe the issue", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createComplaint(subject.trim(), category, description.trim());
      toast.show(`Ticket ${res.ticket_id} raised`, "success");
      router.back();
    } catch (e: any) {
      toast.show(e.message || "Could not submit", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>New Complaint</Text>
        <Pressable testID="close-complaint" onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 40}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing["3xl"] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Category</Text>
          <View style={styles.catWrap}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  testID={`category-${c.replace(/\s/g, "-")}`}
                  onPress={() => setCategory(c)}
                  style={[styles.cat, active ? styles.catActive : styles.catInactive]}
                >
                  <Text style={[styles.catText, { color: active ? "#fff" : colors.onSurfaceSecondary }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Subject</Text>
          <TextInput
            testID="complaint-subject"
            style={styles.input}
            placeholder="e.g. Internet down since morning"
            placeholderTextColor={colors.onSurfaceSecondary}
            value={subject}
            onChangeText={setSubject}
            maxLength={80}
            returnKeyType="next"
          />

          <Text style={styles.label}>Describe the issue</Text>
          <TextInput
            testID="complaint-description"
            style={[styles.input, styles.textarea]}
            placeholder="Share details so our team can help faster…"
            placeholderTextColor={colors.onSurfaceSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
          />

          <Button
            testID="submit-complaint-button"
            label="Submit Complaint"
            onPress={submit}
            loading={loading}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onSurface, marginBottom: spacing.sm, marginTop: spacing.lg },
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cat: { height: 38, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  catActive: { backgroundColor: colors.brandPrimary },
  catInactive: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  catText: { fontFamily: fonts.semibold, fontSize: 13 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 54,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.onSurface,
  },
  textarea: { height: 130, paddingTop: spacing.md },
});
