import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useFamilia } from "../../context/FamiliaContext";
import { useAuth } from "../../context/AuthContext";

export function SeletorPerfilModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { tutelados, atuandoComo, trocarParaTutelado, retornarAoGuardiao } = useFamilia();
  const { user } = useAuth();
  const [trocando, setTrocando] = useState<number | "guardiao" | null>(null);

  useEffect(() => {
    if (!visible) setTrocando(null);
  }, [visible]);

  const handleTrocar = async (tuteladoId: number, nome: string) => {
    try {
      setTrocando(tuteladoId);
      await trocarParaTutelado(tuteladoId, nome);
      onClose();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível acessar esta conta.");
    } finally {
      setTrocando(null);
    }
  };

  const handleVoltar = async () => {
    try {
      setTrocando("guardiao");
      await retornarAoGuardiao();
      onClose();
    } catch {
      Alert.alert("Erro", "Não foi possível voltar ao seu perfil. Tente novamente.");
    } finally { setTrocando(null); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: colors.background }]}>
          <Text style={[s.titulo, { color: colors.textPrimary }]}>Escolher perfil</Text>

          <TouchableOpacity
            style={[s.item, {
              borderColor: !atuandoComo ? colors.primary : colors.border,
              backgroundColor: !atuandoComo ? colors.primary + "11" : colors.backgroundSecondary,
            }]}
            onPress={() => { if (atuandoComo) handleVoltar(); else onClose(); }}
            disabled={!atuandoComo || trocando === "guardiao"}
          >
            <View style={[s.avatar, { backgroundColor: colors.primary + "33" }]}>
              <Text style={[s.avatarLetra, { color: colors.primary }]}>
                {user?.email?.[0]?.toUpperCase() ?? "G"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.nome, { color: colors.textPrimary }]}>Minha conta</Text>
              <Text style={[s.sub, { color: colors.textSecondary }]}>Conta principal</Text>
            </View>
            {trocando === "guardiao"
              ? <ActivityIndicator color={colors.primary} size="small" />
              : !atuandoComo
                ? <Text style={[s.ativo, { color: colors.primary }]}>Ativo</Text>
                : null
            }
          </TouchableOpacity>

          {tutelados.length > 0 && (
            <Text style={[s.secaoLabel, { color: colors.textTertiary }]}>Dependentes ou Tutelados</Text>
          )}

          {tutelados.map((t) => {
            const isAtivo = atuandoComo?.id === t.tutelado_id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.item, {
                  borderColor: isAtivo ? colors.primary : colors.border,
                  backgroundColor: isAtivo ? colors.primary + "11" : colors.backgroundSecondary,
                  opacity: trocando !== null || isAtivo ? 0.7 : 1,
                }]}
                onPress={() => handleTrocar(t.tutelado_id, t.tutelado_nome)}
                disabled={!!trocando || isAtivo}
              >
                <View style={[s.avatar, { backgroundColor: "#E0700022" }]}>
                  <Text style={[s.avatarLetra, { color: "#E07000" }]}>
                    {t.tutelado_nome?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.nome, { color: colors.textPrimary }]}>{t.tutelado_nome}</Text>
                  <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={1}>{t.tutelado_email}</Text>
                </View>
                {trocando === t.tutelado_id
                  ? <ActivityIndicator color="#E07000" size="small" />
                  : isAtivo
                    ? <Text style={[s.ativo, { color: colors.primary }]}>Ativo</Text>
                    : <Text style={[s.acessar, { color: "#E07000" }]}>Acessar</Text>
                }
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[s.btnFechar, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={[s.btnFecharText, { color: "#fff" }]}>Fechar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  titulo: { fontSize: 17, fontWeight: "700", marginBottom: 18 },
  item: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarLetra: { fontSize: 17, fontWeight: "700" },
  nome: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 12, marginTop: 2 },
  ativo: { fontSize: 12, fontWeight: "700" },
  btnFechar: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  btnFecharText: { fontWeight: "600", fontSize: 15 },
  secaoLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  acessar: { fontSize: 12, fontWeight: "700" },
});
