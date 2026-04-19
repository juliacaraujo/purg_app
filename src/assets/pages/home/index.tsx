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
import { style } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import {
  ApiError,
  getCarteira,
  getDadosCadastro,
  getRendimentosUsuario,
} from "../../../services/api";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// Trunca para 2 casas decimais SEM arredondar, exibe como moeda (vírgula)
function moneyTrunc(value: number | string | null | undefined) {
  const v = Math.trunc((Number(value) || 0) * 100) / 100;
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function Home({ navigation }: { navigation: { navigate: (route: string) => void } }) {
  const { user, logout } = useAuth();

  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [nome, setNome] = useState("");
  const [assinatura, setAssinatura] = useState<string | boolean | null>(null);

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);

  const [rendimentoTotal, setRendimentoTotal] = useState(0);
  const [rendimentoDiario, setRendimentoDiario] = useState(0);

  const primeiroNome = useMemo(
    () => nome?.split(" ")[0] ?? "",
    [nome]
  );

  // Patrimônio = saldo + investido
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

      const [cad, cart, rend] = await Promise.all([
        getDadosCadastro(user.id),
        getCarteira(user.id),
        getRendimentosUsuario(user.id),
      ]);

      setNome(cad?.apelido ?? "");
      setAssinatura(cad?.assinatura ?? null);

      setSaldo(Number(cart?.saldo || 0));
      setInvestido(Number(cart?.investido || 0));

      setRendimentoTotal(rend?.rendimento_total ?? 0);
      setRendimentoDiario(rend?.ultimo_rendimento ?? 0);
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

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = () => {
    setRefreshing(true);
    carregar();
  };

  const handleAssinar = () => {
    Alert.alert(
      "Poppy Pro",
      "Aqui você liga o fluxo de assinatura quando existir."
    );
  };

  const handleDepositar = () => {
    navigation.navigate("Deposit");
  };

  if (!user?.id) {
    return (
      <View style={style.containerCenter}>
        <Text style={style.pageTitle}>Home</Text>
        <Text style={style.pageSubtitle}>
          Faça login para visualizar seus dados
        </Text>

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
            <View style={[
              badgeStyle.badge,
              isPro ? badgeStyle.pro : badgeStyle.basic,
            ]}>
              <Text style={[
                badgeStyle.text,
                isPro ? badgeStyle.proText : badgeStyle.basicText,
              ]}>
                {assinaturaLabel}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={style.eyeBtn}
          onPress={() => setHidden((v) => !v)}
        >
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
        {/* Patrimônio — destaque */}
        <View style={style.heroCard}>
          <View style={style.heroDecor1} />
          <View style={style.heroDecor2} />
          <Text style={style.heroLabel}>Patrimônio</Text>
          <Text style={style.heroValue}>
            {hidden ? "••••••" : moneyTrunc(patrimonio)}
          </Text>
        </View>

        {/* Rendimento Total */}
        <View style={style.card}>
          <Text style={style.cardLabel}>Rendimento Total</Text>
          <Text style={style.cardValueGreen}>
            {hidden ? "••••••" : moneyTrunc(rendimentoTotal)}
          </Text>
        </View>

        {/* Rendimento Diário */}
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
      <TouchableOpacity
        style={[style.btn, style.btnPrimary]}
        onPress={handleDepositar}
      >
        <Text style={style.btnPrimaryText}>Depositar</Text>
      </TouchableOpacity>


    </ScrollView>
    </SwipeTabsWrapper>
  );
}

import { StyleSheet } from "react-native";
const badgeStyle = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  pro: {
    backgroundColor: "#007AFF",
  },
  basic: {
    backgroundColor: "#f0f0f0",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
  proText: {
    color: "#fff",
  },
  basicText: {
    color: "#333",
  },
});
