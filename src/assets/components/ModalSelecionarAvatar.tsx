import React, { useEffect, useState } from "react";
import {
  View, Text, Modal, TouchableOpacity, Image,
  ScrollView, StyleSheet, ActivityIndicator,
} from "react-native";
import avatarMap from "../avatarMap";
import type { useTheme } from "../../context/ThemeContext";

type Colors = ReturnType<typeof useTheme>["colors"];

const avatarEntries = Object.entries(avatarMap).map(([k, v]) => ({ id: Number(k), source: v }));

interface Props {
  visible: boolean;
  onClose: () => void;
  avatarAtual: number | null;
  onSalvar: (avatarId: number) => void;
  loading: boolean;
  colors: Colors;
  nomeInicial: string;
}

export function ModalSelecionarAvatar({ visible, onClose, avatarAtual, onSalvar, loading, colors, nomeInicial }: Props) {
  const [selecionado, setSelecionado] = useState<number | null>(avatarAtual);

  useEffect(() => {
    if (visible) setSelecionado(avatarAtual);
  }, [visible, avatarAtual]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={[s.container, { backgroundColor: colors.background }]}>
          <Text style={[s.titulo, { color: colors.textPrimary }]}>Escolher avatar</Text>

          {avatarEntries.length === 0 ? (
            <View style={s.vazio}>
              <Text style={[s.vazioTexto, { color: colors.textTertiary }]}>Nenhum avatar disponível ainda.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              <View style={s.grid}>
                {avatarEntries.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.item, selecionado === item.id && { borderColor: colors.primary, borderWidth: 3 }]}
                    onPress={() => setSelecionado(item.id)}
                  >
                    <Image source={item.source} style={s.itemImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={s.preview}>
            {selecionado && avatarMap[selecionado] ? (
              <Image source={avatarMap[selecionado]} style={s.previewImg} />
            ) : (
              <View style={[s.previewLetra, { backgroundColor: colors.primary }]}>
                <Text style={s.previewLetraTexto}>{nomeInicial}</Text>
              </View>
            )}
          </View>

          <View style={s.btns}>
            <TouchableOpacity style={[s.btnCancelar, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSalvar, { backgroundColor: colors.primary }, (!selecionado || loading) && { opacity: 0.4 }]}
              onPress={() => selecionado && onSalvar(selecionado)}
              disabled={!selecionado || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "85%" as any },
  titulo: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingBottom: 8 },
  item: { width: "22%", margin: "1.5%" as any, aspectRatio: 1, borderRadius: 50, overflow: "hidden", borderWidth: 3, borderColor: "transparent" },
  itemImg: { width: "100%", height: "100%", resizeMode: "cover" },
  preview: { alignItems: "center", marginVertical: 16 },
  previewImg: { width: 72, height: 72, borderRadius: 36 },
  previewLetra: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  previewLetraTexto: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  vazio: { alignItems: "center", paddingVertical: 40 },
  vazioTexto: { fontSize: 14 },
  btns: { flexDirection: "row", gap: 12, marginTop: 4 },
  btnCancelar: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnSalvar: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
});
