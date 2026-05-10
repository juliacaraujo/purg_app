import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import * as Contacts from "expo-contacts";
import avatarMap from "../../avatarMap";
import { BadgeInsignia } from "../../components/BadgeInsignia";
import { FRAME_CFG } from "../../components/MolduraLiga";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import Svg, { Polygon, Line } from "react-native-svg";
import { useTheme } from "../../../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import type { ThemeColors } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { getRanking, getRankingContatos } from "../../../services/api";
import ScrollViewRefresh from "../../components/ScrollViewRefresh";
import type { RankingItem } from "../../../types";
import { isWeb } from "../../global/responsive";

const MEDAL_CORES = ["#F0C040", "#B8BEC5", "#CD7F32"];

type Aba = "global" | "contatos";
type Permissao = "desconhecida" | "concedida" | "negada";

function normalizarTelefone(numero: string): string {
  const digits = numero.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}

function TituloRanking({ cor }: { cor: string }) {
  const [w, setW] = useState(0);
  const D = 9;
  const lineY = 14;

  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ marginBottom: 16 }}>
      {w > 0 && (
        <Svg width={w} height={28} style={{ marginBottom: 6 }}>
          <Polygon points={`${D},${lineY} ${D * 2},${lineY - D} ${D * 3},${lineY} ${D * 2},${lineY + D}`} fill={cor} />
          <Line x1={D * 3 + 4} y1={lineY} x2={w / 2 - 60} y2={lineY} stroke={cor} strokeWidth={2} />
          <Line x1={w / 2 + 60} y1={lineY} x2={w - D * 3 - 4} y2={lineY} stroke={cor} strokeWidth={2} />
          <Polygon points={`${w - D * 3},${lineY} ${w - D * 2},${lineY - D} ${w - D},${lineY} ${w - D * 2},${lineY + D}`} fill={cor} />
          <Polygon points={`${D * 3 + 16},${lineY} ${D * 3 + 22},${lineY - 5} ${D * 3 + 28},${lineY} ${D * 3 + 22},${lineY + 5}`} fill={cor} opacity={0.5} />
          <Polygon points={`${w - D * 3 - 28},${lineY} ${w - D * 3 - 22},${lineY - 5} ${w - D * 3 - 16},${lineY} ${w - D * 3 - 22},${lineY + 5}`} fill={cor} opacity={0.5} />
        </Svg>
      )}
      <Text style={{ textAlign: "center", fontSize: 26, fontWeight: "800", color: cor, letterSpacing: 6, textTransform: "uppercase" }}>
        Ranking
      </Text>
      {w > 0 && (
        <Svg width={w} height={10} style={{ marginTop: 6 }}>
          <Line x1={w * 0.15} y1={5} x2={w * 0.85} y2={5} stroke={cor} strokeWidth={1} opacity={0.35} />
        </Svg>
      )}
    </View>
  );
}

function ligaCor(liga: string | null | undefined): string {
  if (!liga) return "#888";
  return FRAME_CFG[liga.split(" ")[0]]?.cor ?? "#888";
}

function CardRanking({ item, meusPontos, navigation, s, colors }: {
  item: RankingItem;
  meusPontos: number | undefined;
  navigation: any;
  s: ReturnType<typeof makeStyle>;
  colors: ThemeColors;
}) {
  const { user } = useAuth();
  const isMe = user?.id !== undefined && item.usuario_id === user.id;
  const cor = ligaCor(item.liga);
  const isTop3 = item.posicao <= 3;
  const medalCor = isTop3 ? MEDAL_CORES[item.posicao - 1] : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => navigation.navigate("RankingPerfil", { usuario_id: item.usuario_id, meus_pontos: meusPontos })}
    >
      <View style={[s.card, { borderLeftColor: cor }, isMe && { backgroundColor: cor + "18" }]}>
        <View style={s.posicaoBox}>
          <Text style={[s.posicao, isTop3 && { color: medalCor, fontSize: 20, fontWeight: "800" }]}>
            {item.posicao}º
          </Text>
        </View>

        <View style={[s.avatarRing, isMe && { borderColor: cor }]}>
          {item.avatar_id && avatarMap[item.avatar_id] ? (
            <Image source={avatarMap[item.avatar_id]} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <Text style={s.avatarLetra}>{item.apelido?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
          )}
        </View>

        <View style={s.info}>
          <Text style={[s.apelido, isMe && { color: cor }]} numberOfLines={1}>
            {item.apelido}
          </Text>
          <View style={s.ligaRow}>
            <BadgeInsignia ligaNome={item.liga} size={16} />
            <Text style={[s.ligaText, { color: cor }]}>{item.liga}</Text>
          </View>
        </View>

        <View style={s.pontosBox}>
          <Text style={[s.pontos, isMe && { color: cor }]}>{item.pontos}</Text>
          <Text style={s.pontosLabel}>pts</Text>
        </View>

        <Text style={[s.chevron, { color: cor + "88" }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Ranking({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = useMemo(() => makeStyle(colors), [colors]);

  const [abaAtiva, setAbaAtiva] = useState<Aba>("global");

  // ── Global ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState(false);

  const carregarGlobal = useCallback(async () => {
    try {
      setLoading(true);
      setErro(false);
      const data = await getRanking();
      setItems(Array.isArray(data) ? data.filter((i) => i.pontos > 1) : []);
    } catch {
      setErro(true);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarGlobal(); }, [carregarGlobal]));

  // ── Contatos ────────────────────────────────────────────────────────────────
  const [permissao, setPermissao] = useState<Permissao>("desconhecida");
  const [contatosItems, setContatosItems] = useState<RankingItem[]>([]);
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [erroContatos, setErroContatos] = useState(false);
  const [contatosCarregados, setContatosCarregados] = useState(false);

  const carregarContatos = useCallback(async () => {
    if (isWeb) return;
    try {
      setLoadingContatos(true);
      setErroContatos(false);

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setPermissao("negada");
        return;
      }
      setPermissao("concedida");

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const telefones = Array.from(new Set(
        data
          .flatMap(c => c.phoneNumbers ?? [])
          .map(p => normalizarTelefone(p.number ?? ""))
          .filter(n => n.length >= 12)
      ));

      if (telefones.length === 0) {
        setContatosItems([]);
        setContatosCarregados(true);
        return;
      }

      const ranking = await getRankingContatos(telefones);
      setContatosItems(Array.isArray(ranking) ? ranking : []);
      setContatosCarregados(true);
    } catch {
      setErroContatos(true);
    } finally {
      setLoadingContatos(false);
      setRefreshing(false);
    }
  }, []);

  const handleAbaContatos = () => {
    setAbaAtiva("contatos");
    if (!contatosCarregados && !loadingContatos && permissao !== "negada") {
      carregarContatos();
    }
  };

  const meusPontosGlobal = items.find(i => i.usuario_id === user?.id)?.pontos;
  const meusPontosContatos = contatosItems.find(i => i.usuario_id === user?.id)?.pontos;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (abaAtiva === "global") {
      carregarGlobal();
    } else {
      setContatosCarregados(false);
      carregarContatos();
    }
  }, [abaAtiva, carregarGlobal, carregarContatos]);

  return (
    <SwipeTabsWrapper currentTab="Ranking">
      <ScrollViewRefresh
        contentContainerStyle={s.container}
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary}
        showsVerticalScrollIndicator={false}
      >
        <TituloRanking cor={colors.primary} />

        {/* ── Seletor de abas ── */}
        <View style={[s.abaBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[s.abaBtn, abaAtiva === "global" && { backgroundColor: colors.primary }]}
            onPress={() => setAbaAtiva("global")}
            activeOpacity={0.8}
          >
            <Text style={[s.abaBtnText, { color: abaAtiva === "global" ? "#fff" : colors.textSecondary }]}>
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.abaBtn, abaAtiva === "contatos" && { backgroundColor: colors.primary }]}
            onPress={handleAbaContatos}
            activeOpacity={0.8}
          >
            <Text style={[s.abaBtnText, { color: abaAtiva === "contatos" ? "#fff" : colors.textSecondary }]}>
              Contatos
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Aba Global ── */}
        {abaAtiva === "global" && (
          <>
            {loading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />}

            {!loading && erro && (
              <View style={s.empty}>
                <Text style={s.emptyText}>Não foi possível carregar. Puxe para atualizar.</Text>
              </View>
            )}

            {!loading && !erro && items.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyText}>Nenhum dado disponível</Text>
              </View>
            )}

            {items.map((item) => (
              <CardRanking
                key={item.usuario_id}
                item={item}
                meusPontos={meusPontosGlobal}
                navigation={navigation}
                s={s}
                colors={colors}
              />
            ))}
          </>
        )}

        {/* ── Aba Contatos ── */}
        {abaAtiva === "contatos" && (
          <>
            {isWeb && (
              <View style={s.empty}>
                <Image
                  source={require("../../purg_contrucao.png")}
                  style={{ width: 180, height: 180, resizeMode: "contain", marginBottom: 20 }}
                />
                <Text style={[s.emptyText, { fontWeight: "700", marginBottom: 8 }]}>
                  Em desenvolvimento!
                </Text>
                <Text style={[s.emptySubtext, { color: "#888", fontSize: 15, lineHeight: 22 }]}>
                  Estamos construindo o ranking por contatos.{"\n"}
                  Essa funcionalidade estará disponível na versão do app.
                </Text>
              </View>
            )}

            {!isWeb && permissao === "negada" && (
              <View style={s.empty}>
                <Text style={[s.emptyText, { marginBottom: 16 }]}>
                  Acesso aos contatos negado.
                </Text>
                <Text style={[s.emptySubtext, { color: colors.textTertiary }]}>
                  Ative nas configurações do seu dispositivo para usar esta funcionalidade.
                </Text>
              </View>
            )}

            {!isWeb && permissao !== "negada" && loadingContatos && (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            )}

            {!isWeb && permissao !== "negada" && !loadingContatos && erroContatos && (
              <View style={s.empty}>
                <Text style={s.emptyText}>Não foi possível carregar. Puxe para atualizar.</Text>
              </View>
            )}

            {!isWeb && permissao !== "negada" && !loadingContatos && !erroContatos && contatosCarregados && contatosItems.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyText}>Nenhum contato seu usa o Purg ainda.</Text>
              </View>
            )}

            {contatosItems.map((item) => (
              <CardRanking
                key={item.usuario_id}
                item={item}
                meusPontos={meusPontosContatos}
                navigation={navigation}
                s={s}
                colors={colors}
              />
            ))}
          </>
        )}
      </ScrollViewRefresh>
    </SwipeTabsWrapper>
  );
}

const makeStyle = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: c.backgroundSecondary,
      padding: 19,
      paddingBottom: 43,
    },
    empty: {
      marginTop: 48,
      alignItems: "center",
      paddingHorizontal: 24,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 18,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },

    // Seletor de abas
    abaBar: {
      flexDirection: "row",
      borderRadius: 12,
      borderWidth: 1,
      padding: 4,
      marginBottom: 18,
    },
    abaBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: "center",
    },
    abaBtnText: {
      fontSize: 14,
      fontWeight: "700",
    },

    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingRight: 17,
      paddingLeft: 14,
      marginBottom: 10,
      borderLeftWidth: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 5,
      elevation: 2,
    },
    posicaoBox: {
      width: 41,
      alignItems: "center",
    },
    posicao: {
      fontSize: 17,
      fontWeight: "700",
      color: c.textSecondary,
    },
    avatarRing: {
      width: 53,
      height: 53,
      borderRadius: 27,
      borderWidth: 2,
      borderColor: "transparent",
      marginLeft: 7,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarPlaceholder: {
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetra: {
      fontSize: 17,
      fontWeight: "700",
      color: c.textSecondary,
    },
    info: {
      flex: 1,
      marginLeft: 12,
    },
    apelido: {
      fontSize: 18,
      fontWeight: "600",
      color: c.textPrimary,
    },
    ligaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
    },
    ligaText: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    pontosBox: {
      alignItems: "flex-end",
      marginLeft: 10,
    },
    pontos: {
      fontSize: 20,
      fontWeight: "bold",
      color: c.textPrimary,
    },
    pontosLabel: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    chevron: {
      fontSize: 26,
      fontWeight: "300",
      marginLeft: 6,
      alignSelf: "center",
    },
  });
