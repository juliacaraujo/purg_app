import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import imgOlhoAberto from "../../../../assets/olho_aberto.png";
import imgOlhoFechado from "../../../../assets/olho_fechado.png";
import { makeHomeStyle } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import {
  ApiError,
  getCarteira,
  getDadosCadastro,
  getRendimentosUsuario,
  getHistoricoPatrimonio,
} from "../../../services/api";
import GraficoLinha from "../../components/GraficoLinha";
import type { GraficoPoint } from "../../../types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function moneyTrunc(value: number | string | null | undefined) {
  const v = Math.trunc((Number(value) || 0) * 100) / 100;
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function Home({ navigation }: { navigation: { navigate: (route: string) => void } }) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const style = useMemo(() => makeHomeStyle(colors), [colors]);

  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [nome, setNome] = useState("");
  const [assinatura, setAssinatura] = useState<string | boolean | null>(null);

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);

  const [rendimentoTotal, setRendimentoTotal] = useState(0);
  const [rendimentoDiario, setRendimentoDiario] = useState(0);
  const [historicoPatrimonio, setHistoricoPatrimonio] = useState<GraficoPoint[]>([]);

  const primeiroNome = useMemo(() => nome?.split(" ")[0] ?? "", [nome]);

  const patrimonio = useMemo(() => saldo + investido, [saldo, investido]);

  const hasAssinatura = useMemo(() => {
    if (assinatura === true) return true;
    if (assinatura === false) return false;
    if (!assinatura) return false;
    if (typeof assinatura === "string") return assinatura.trim().length > 0;
    return !!assinatura;
  }, [assinatura]);

  const assinaturaLabel = useMemo(() => {
    if (typeof assinatura === "string" && assinatura.trim()) return assinatura.trim();
    return "Poppy Pro";
  }, [assinatura]);

  const isPro = assinaturaLabel === "Poppy Pro";

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [cad, cart, rend, hist] = await Promise.allSettled([
        getDadosCadastro(user.id),
        getCarteira(user.id),
        getRendimentosUsuario(user.id),
        getHistoricoPatrimonio(user.id),
      ]);
      if (cad.status === "fulfilled") {
        setNome(cad.value?.apelido ?? "");
        setAssinatura(cad.value?.assinatura ?? null);
      }
      if (cart.status === "fulfilled") {
        setSaldo(Number(cart.value?.saldo || 0));
        setInvestido(Number(cart.value?.investido || 0));
      }
      if (rend.status === "fulfilled") {
        setRendimentoTotal(rend.value?.rendimento_total ?? 0);
        setRendimentoDiario(rend.value?.ultimo_rendimento ?? 0);
      }
      if (hist.status === "fulfilled") {
        const items = Array.isArray(hist.value?.historico) ? hist.value.historico : [];
        setHistoricoPatrimonio(
          items.map((item) => ({ data: item.data, valor: Number(item.carteira_dia) || 0 }))
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        Alert.alert("Erro", err.message || "Falha ao carregar dados.");
      } else {
        Alert.alert("Erro", "Não foi possível carregar a Home.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const handleAssinar = () => {
    Alert.alert("Poppy Pro", "Aqui você liga o fluxo de assinatura quando existir.");
  };

  const handleDepositar = () => { navigation.navigate("Deposit"); };

  if (!user?.id) {
    return (
      <View style={style.containerCenter}>
        <Text style={style.pageTitle}>Home</Text>
        <Text style={style.pageSubtitle}>Faça login para visualizar seus dados</Text>
        <TouchableOpacity style={[style.btn, style.btnPrimary]} onPress={logout}>
          <Text style={style.btnPrimaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SwipeTabsWrapper currentTab="Home">
      <ScrollView
        contentContainerStyle={style.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Topo */}
        <View style={style.topRow}>
          <View style={style.avatar}>
            <Text style={style.avatarText}>
              {primeiroNome?.[0]?.toUpperCase() || "P"}
            </Text>
          </View>

          <View style={style.greetingBlock}>
            <Text style={style.greeting}>{getGreeting()},</Text>
            <Text style={style.welcomeName}>{primeiroNome || "…"}</Text>
            {hasAssinatura && (
              <View style={isPro ? style.badgePro : style.badgeBasic}>
                <Text style={isPro ? style.badgeProText : style.badgeBasicText}>
                  {assinaturaLabel}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={style.eyeBtn} onPress={() => setHidden((v) => !v)}>
            <Image
              source={hidden ? imgOlhoFechado : imgOlhoAberto}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

        {/* Cards */}
        <View style={style.grid}>
          <View style={style.heroCard}>
            <View style={style.heroDecor1} />
            <View style={style.heroDecor2} />
            <Text style={style.heroLabel}>Patrimônio</Text>
            <Text style={style.heroValue}>
              {hidden ? "••••••" : moneyTrunc(patrimonio)}
            </Text>
          </View>

          <View style={style.card}>
            <Text style={style.cardLabel}>Rendimento Total</Text>
            <Text style={style.cardValueGreen}>
              {hidden ? "••••••" : moneyTrunc(rendimentoTotal)}
            </Text>
          </View>

          <View style={style.card}>
            <Text style={style.cardLabel}>Rendimento Diário</Text>
            <Text style={style.cardValueGreen}>
              {hidden ? "••••••" : moneyTrunc(rendimentoDiario)}
            </Text>
          </View>
        </View>

        {/* Assinatura */}
        {!hasAssinatura && (
          <>
            <Text style={style.sectionTitle}>Assinatura</Text>
            <View style={style.cardFull}>
              <Text style={style.cardLabel}>Status</Text>
              <Text style={style.cardValue}>Sem assinatura</Text>
              <TouchableOpacity
                style={[style.btn, style.btnPrimary, { marginTop: 12 }]}
                onPress={handleAssinar}
              >
                <Text style={style.btnPrimaryText}>Assinar Poppy Pro</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Ações */}
        <TouchableOpacity style={[style.btn, style.btnPrimary]} onPress={handleDepositar}>
          <Text style={style.btnPrimaryText}>Depositar</Text>
        </TouchableOpacity>

        {/* Gráfico de crescimento */}
        {historicoPatrimonio.length >= 2 && (
          <View style={style.chartCard}>
            <GraficoLinha
              pontos={historicoPatrimonio}
              cor={colors.primary}
              titulo="Crescimento do Patrimônio"
              altura={140}
              formatarValor={moneyTrunc}
            />
          </View>
        )}
      </ScrollView>
    </SwipeTabsWrapper>
  );
}
