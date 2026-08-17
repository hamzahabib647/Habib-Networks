import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

import { AdminHeader, AdminModal, AdminInput } from "@/src/components/admin/kit";
import { Skeleton } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { adminApi } from "@/src/api/admin";
import { colors, fonts, radius, spacing, shadow } from "@/src/theme/theme";

const EMPTY = { title: "", subtitle: "", cta: "Grab Offer", image: "", badge: "" };

export default function AdminOffers() {
  const router = useRouter();
  const toast = useToast();

  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const load = useCallback(async () => {
    try {
      setOffers(await adminApi.offers());
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => { setEditId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (o: any) => {
    setEditId(o.id);
    setForm({ title: o.title, subtitle: o.subtitle, cta: o.cta, image: o.image, badge: o.badge || "" });
    setModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.subtitle.trim() || !form.image.trim()) {
      toast.show("Title, subtitle and image URL are required", "error");
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      cta: form.cta.trim() || "Learn More",
      image: form.image.trim(),
      badge: form.badge.trim() || null,
    };
    setSaving(true);
    try {
      if (editId) await adminApi.updateOffer(editId, payload);
      else await adminApi.createOffer(payload);
      toast.show(editId ? "Offer updated" : "Offer created", "success");
      setModal(false);
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (o: any) => {
    try {
      await adminApi.deleteOffer(o.id);
      toast.show("Offer removed", "info");
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Offers"
        onBack={() => router.back()}
        right={
          <Pressable testID="add-offer-btn" onPress={openCreate} hitSlop={12}>
            <Feather name="plus-circle" size={24} color={colors.brandPrimary} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          {[0, 1].map((i) => <Skeleton key={i} height={120} style={{ marginBottom: spacing.md }} />)}
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.lg }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <View testID={`admin-offer-${item.id}`} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.sub} numberOfLines={2}>{item.subtitle}</Text>
                <View style={styles.actions}>
                  <Pressable testID={`edit-offer-${item.id}`} onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Feather name="edit-2" size={14} color={colors.navy} />
                    <Text style={[styles.actionText, { color: colors.navy }]}>Edit</Text>
                  </Pressable>
                  <Pressable testID={`delete-offer-${item.id}`} onPress={() => remove(item)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={14} color={colors.onError} />
                    <Text style={[styles.actionText, { color: colors.onError }]}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <AdminModal visible={modal} title={editId ? "Edit Offer" : "New Offer"} onClose={() => setModal(false)} onSave={save} saving={saving} saveLabel={editId ? "Save Changes" : "Create Offer"}>
        <AdminInput label="Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="e.g. Gamer's Delight" testID="offer-title-input" />
        <AdminInput label="Subtitle" value={form.subtitle} onChangeText={(t) => setForm({ ...form, subtitle: t })} placeholder="Short description" multiline testID="offer-subtitle-input" />
        <AdminInput label="Button Text" value={form.cta} onChangeText={(t) => setForm({ ...form, cta: t })} placeholder="Grab Offer" testID="offer-cta-input" />
        <AdminInput label="Image URL" value={form.image} onChangeText={(t) => setForm({ ...form, image: t })} placeholder="https://..." testID="offer-image-input" />
        <AdminInput label="Badge (optional)" value={form.badge} onChangeText={(t) => setForm({ ...form, badge: t })} placeholder="LIMITED / HOT" testID="offer-badge-input" />
      </AdminModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceSecondary },
  card: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.onSurface },
  sub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.onSurfaceSecondary, marginTop: 2 },
  actions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontFamily: fonts.semibold, fontSize: 13 },
});
