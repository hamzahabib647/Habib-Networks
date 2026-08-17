import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/src/components/Button";
import { colors, fonts, radius, spacing } from "@/src/theme/theme";

export function AdminHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[hStyles.header, { paddingTop: insets.top + spacing.sm }]}>
      {onBack ? (
        <Pressable testID="admin-back" onPress={onBack} hitSlop={12} style={{ width: 40 }}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text style={hStyles.title}>{title}</Text>
      <View style={{ width: 40, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

const hStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, textAlign: "center", fontFamily: fonts.bold, fontSize: 18, color: colors.onSurface },
});

export function AdminInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  testID?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={iStyles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={[iStyles.input, multiline && iStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const iStyles = StyleSheet.create({
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onSurface, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 50,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.onSurface,
  },
  multiline: { height: 100, paddingTop: spacing.md },
});

export function AdminModal({
  visible,
  title,
  onClose,
  onSave,
  saving,
  saveLabel = "Save",
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={mStyles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={mStyles.kav}>
          <View style={[mStyles.sheet, { paddingBottom: insets.bottom + spacing.lg, maxHeight: height * 0.88 }]}>
            <View style={mStyles.grabber} />
            <View style={mStyles.headerRow}>
              <Text style={mStyles.title}>{title}</Text>
              <Pressable testID="modal-close" onPress={onClose} hitSlop={12}>
                <Feather name="x" size={24} color={colors.onSurface} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 1 }}>
              {children}
            </ScrollView>
            {onSave ? (
              <Button testID="modal-save" label={saveLabel} onPress={onSave} loading={saving} style={{ marginTop: spacing.md }} />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,17,40,0.5)", justifyContent: "flex-end" },
  kav: { justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.onSurface },
});
