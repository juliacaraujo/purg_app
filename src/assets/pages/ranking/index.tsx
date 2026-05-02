import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import avatarMap from "../../avatarMap";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { useTheme } from "../../../context/ThemeContext";
import type { ThemeColors } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { getRanking } from "../../../services/api";
import type { RankingItem } from "../../../types";


export default function Ranking() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const s = useMemo(() => makeStyle(colors), [colors]);

  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(false);
      const data = await getRanking();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setErro(true);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  return (
    <SwipeTabsWrapper currentTab="Ranking">
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.titulo}>Ranking</Text>
        <View style={{ height: 20 }} />

        {loading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />}

        {!loading && erro && (
          <View style={s.empty}>
            <Text style={s.emptyText}>Não foi possível carregar o ranking. Puxe para atualizar.</Text>
          </View>
        )}

        {!loading && !erro && items.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>Nenhum dado disponível</Text>
          </View>
        )}

        {items.map((item) => {
          const isMe = user?.id !== undefined && item.usuario_id === user.id;
          return (
            <View key={item.usuario_id} style={[s.card, isMe && s.cardMe]}>
              <View style={s.posicaoBox}>
                <Text style={[s.posicao, isMe && s.posicaoMe]}>{item.posicao}º</Text>
              </View>
              {item.avatar_id && avatarMap[item.avatar_id] ? (
                <Image source={avatarMap[item.avatar_id]} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarPlaceholder]}>
                  <Text style={s.avatarLetra}>{item.apelido?.[0]?.toUpperCase() || "?"}</Text>
                </View>
              )}
              <View style={s.info}>
                <Text style={[s.apelido, isMe && s.apelidoMe]} numberOfLines={1}>
                  {item.apelido}
                </Text>
                <Text style={s.liga}>{item.liga}</Text>
              </View>
              <View style={s.pontosBox}>
                <Text style={[s.pontos, isMe && s.pontosMe]}>{item.pontos}</Text>
                <Text style={s.pontosLabel}>pts</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SwipeTabsWrapper>
  );
}

const makeStyle = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: c.backgroundSecondary,
      padding: 20,
      paddingBottom: 36,
    },
    titulo: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.textPrimary,
      marginBottom: 4,
    },
    subtitulo: {
      fontSize: 13,
      color: c.textSecondary,
      marginBottom: 20,
    },
    empty: {
      marginTop: 40,
      alignItems: "center",
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 15,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    cardMe: {
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    posicaoBox: {
      width: 40,
      alignItems: "center",
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginLeft: 8,
    },
    avatarPlaceholder: {
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetra: {
      fontSize: 14,
      fontWeight: "700",
      color: c.textSecondary,
    },
    posicao: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textSecondary,
    },
    posicaoMe: {
      color: c.primary,
    },
    info: {
      flex: 1,
      marginLeft: 10,
    },
    apelido: {
      fontSize: 15,
      fontWeight: "600",
      color: c.textPrimary,
    },
    apelidoMe: {
      color: c.primary,
    },
    liga: {
      fontSize: 11,
      color: c.textSecondary,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    pontosBox: {
      alignItems: "flex-end",
    },
    pontos: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.textPrimary,
    },
    pontosMe: {
      color: c.primary,
    },
    pontosLabel: {
      fontSize: 10,
      color: c.textSecondary,
      fontWeight: "600",
      textTransform: "uppercase",
    },
  });
