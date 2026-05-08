import React, { useEffect, useState } from "react";
import {
  View, Text, Image, ScrollView, ActivityIndicator,
  StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { getRankingDados, type RankingDados } from "../../../services/api";
import { FRAME_CFG } from "../../components/MolduraLiga";
import avatarMap from "../../avatarMap";
import insigniaMap from "../../insigniaMap";

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
const NIVEIS = ["I", "II", "III", "IV", "V"] as const;

function parseliga(liga: string | null | undefined): { metal: string; nivel: number } | null {
  if (!liga) return null;
  const parts = liga.split(" ");
  if (parts.length < 2) return null;
  const nivel = ROMAN[parts[parts.length - 1]];
  if (!nivel) return null;
  const metal = parts.slice(0, -1).join(" ");
  return { metal, nivel };
}

function ligaCor(liga: string | null | undefined): string {
  if (!liga) return "#888";
  return FRAME_CFG[liga.split(" ")[0]]?.cor ?? "#888";
}

function tempoNaCasa(createdAt: string): string {
  const meses = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  if (meses < 1) return "< 1 mês";
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const label = anos === 1 ? "1 ano" : `${anos} anos`;
  return resto === 0 ? label : `${label} e ${resto}m`;
}

function StatLinha({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  const { colors } = useTheme();
  return (
    <View style={s.statLinha}>
      <Text style={[s.statLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[s.statValor, { color: cor }]} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

type InsigniaModal = { source: ReturnType<typeof require>; nome: string; cor: string } | null;

export default function RankingPerfil({ route }: { route: any }) {
  const { usuario_id, meus_pontos } = route.params as { usuario_id: number; meus_pontos?: number };
  const { colors } = useTheme();
  const { user } = useAuth();

  const [dados, setDados] = useState<RankingDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [insigniaModal, setInsigniaModal] = useState<InsigniaModal>(null);

  const souEu = user?.id === usuario_id;

  useEffect(() => {
    setLoading(true);
    setDados(null);
    setErro(false);
    getRankingDados(usuario_id)
      .then(setDados)
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, [usuario_id]);

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro || !dados) {
    return (
      <View style={[s.center, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
          Não foi possível carregar o perfil.
        </Text>
      </View>
    );
  }

  const cor = ligaCor(dados.liga);
  const difPontos = meus_pontos !== undefined ? dados.pontos - meus_pontos : null;
  const ligaInfo = parseliga(dados.liga);

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.backgroundSecondary }}
        contentContainerStyle={[s.container, { backgroundColor: colors.backgroundSecondary }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ficha principal ── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: cor + "55" }]}>

          {/* Faixa colorida no topo */}
          <View style={[s.topBar, { backgroundColor: cor }]} />

          {/* Corpo: avatar | divisor | stats */}
          <View style={s.corpo}>

            {/* Coluna esquerda */}
            <View style={s.colunaEsq}>
              <View style={[s.avatarQuadro, { borderColor: cor }]}>
                {dados.avatar_id && avatarMap[dados.avatar_id] ? (
                  <Image source={avatarMap[dados.avatar_id]} style={s.avatar} />
                ) : (
                  <View style={[s.avatar, s.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[s.avatarLetra, { color: cor }]}>
                      {dados.apelido?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[s.apelido, { color: cor }]} numberOfLines={2}>
                {dados.apelido}
              </Text>

              {souEu && (
                <View style={[s.euBadge, { backgroundColor: cor + "22", borderColor: cor }]}>
                  <Text style={[s.euBadgeText, { color: cor }]}>Você</Text>
                </View>
              )}
            </View>

            {/* Divisor vertical */}
            <View style={[s.divisorV, { backgroundColor: colors.border }]} />

            {/* Coluna direita: stats */}
            <View style={s.colunaDireita}>
              <StatLinha label="POSIÇÃO" valor={`#${dados.posicao}`} cor={cor} />
              <StatLinha label="PONTOS" valor={String(dados.pontos)} cor={cor} />
              <StatLinha label="LIGA" valor={dados.liga ?? "–"} cor={cor} />
              {dados.estado ? <StatLinha label="ESTADO" valor={dados.estado} cor={cor} /> : null}
              <StatLinha label="MEMBRO HÁ" valor={tempoNaCasa(dados.created_at)} cor={cor} />
            </View>
          </View>

          {/* ── Comparativo ── */}
          {!souEu && difPontos !== null && (
            <View style={[s.comparativo, { borderTopColor: colors.border }]}>
              <Text style={[s.comparativoLabel, { color: colors.textTertiary }]}>
                COMPARATIVO COM VOCÊ
              </Text>
              <Text style={[
                s.comparativoValor,
                { color: difPontos > 0 ? "#FF3B30" : difPontos < 0 ? colors.primary : colors.textSecondary },
              ]}>
                {difPontos > 0
                  ? `${difPontos} pontos à frente`
                  : difPontos < 0
                  ? `${Math.abs(difPontos)} pontos atrás`
                  : "Empatados"}
              </Text>
            </View>
          )}

          {/* ── Insígnias da liga ── */}
          {ligaInfo && (
            <View style={[s.insigniasSecao, { borderTopColor: colors.border }]}>
              <Text style={[s.insigniasLabel, { color: colors.textTertiary }]}>
                INSÍGNIAS — {ligaInfo.metal.toUpperCase()}
              </Text>
              <View style={s.insigniasRow}>
                {NIVEIS.map((nivel, idx) => {
                  const conquistada = idx + 1 <= ligaInfo.nivel;
                  const chave = `${ligaInfo.metal} ${nivel}`;
                  const source = insigniaMap[chave];
                  return (
                    <TouchableOpacity
                      key={nivel}
                      activeOpacity={0.7}
                      onPress={() => source && setInsigniaModal({ source, nome: chave, cor })}
                    >
                      <View style={s.insigniaItem}>
                        <View style={[
                          s.insigniaCirculo,
                          {
                            borderColor: conquistada ? cor : colors.border,
                            backgroundColor: conquistada ? cor + "18" : colors.backgroundSecondary,
                          },
                        ]}>
                          {source ? (
                            <Image
                              source={source}
                              style={[s.insigniaImg, !conquistada && { opacity: 0.18 }]}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={{ fontSize: 10, color: colors.textTertiary }}>?</Text>
                          )}
                        </View>
                        <Text style={[s.insigniaNivel, { color: conquistada ? cor : colors.textTertiary }]}>
                          {nivel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Modal de detalhe da insígnia ── */}
      <Modal visible={insigniaModal !== null} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setInsigniaModal(null)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[s.modalCard, { backgroundColor: colors.card, borderColor: insigniaModal?.cor + "55" }]}>
                <View style={[s.modalCirculo, { borderColor: insigniaModal?.cor, backgroundColor: insigniaModal?.cor + "18" }]}>
                  {insigniaModal?.source && (
                    <Image
                      source={insigniaModal.source}
                      style={s.modalInsigniaImg}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text style={[s.modalNome, { color: insigniaModal?.cor }]}>
                  {insigniaModal?.nome}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, paddingBottom: 48 },

  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topBar: { height: 6 },

  corpo: {
    flexDirection: "row",
    padding: 20,
  },

  colunaEsq: {
    alignItems: "center",
    width: 124,
    paddingRight: 16,
  },
  avatarQuadro: {
    width: 110,
    height: 110,
    borderRadius: 10,
    borderWidth: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatar:            { width: 104, height: 104, borderRadius: 0 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarLetra:       { fontSize: 38, fontWeight: "800" },
  apelido: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 19,
  },
  euBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  euBadgeText: { fontSize: 11, fontWeight: "700" },

  divisorV: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },

  colunaDireita: {
    flex: 1,
    paddingLeft: 16,
    gap: 11,
    justifyContent: "center",
  },
  statLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statValor: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
  },

  comparativo: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  comparativoLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  comparativoValor: { fontSize: 20, fontWeight: "800" },

  insigniasSecao: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  insigniasLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 14,
  },
  insigniasRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  insigniaItem: {
    alignItems: "center",
    gap: 5,
  },
  insigniaCirculo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  insigniaImg: {
    width: 46,
    height: 46,
  },
  insigniaNivel: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalCirculo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalInsigniaImg: {
    width: 140,
    height: 140,
  },
  modalNome: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
