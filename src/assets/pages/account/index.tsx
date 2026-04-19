import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { styles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import GraficoLinha from "../../components/GraficoLinha";
import {
  ApiError,
  getCarteira,
  getRendimentosUsuario,
  getPinsUsuario,
  getHistoricoPatrimonio,
  getHistoricoRendimentos,
} from "../../../services/api";

const moneyTrunc8 = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 1e8) / 1e8;
  return `R$ ${n.toFixed(8).replace(".", ",")}`;
};

const moneyTrunc2 = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

export default function Account({ navigation }: any) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);
  const [rendimentoDiario, setRendimentoDiario] = useState(0);

  const [pins, setPins] = useState<any[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);

  // Gráficos
  const [historicoPatrimonio, setHistoricoPatrimonio] = useState<{ data: string; valor: number }[]>([]);
  const [historicoRendimentos, setHistoricoRendimentos] = useState<{ data: string; valor: number }[]>([]);

  // Patrimônio = saldo + investido
  const patrimonio = useMemo(() => saldo + investido, [saldo, investido]);

  // Pins ordenados por juros a.a. decrescente
  const pinsSorted = useMemo(
    () => [...pins].sort((a, b) => Number(b.juros_a_a || 0) - Number(a.juros_a_a || 0)),
    [pins]
  );

  const carregar = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [c, r, p, hp, hr] = await Promise.allSettled([
        getCarteira(user.id),
        getRendimentosUsuario(user.id),
        getPinsUsuario(user.id),
        getHistoricoPatrimonio(user.id),
        getHistoricoRendimentos(user.id),
      ]);

      if (c.status === "fulfilled") {
        setSaldo(Number(c.value?.saldo || 0));
        setInvestido(Number(c.value?.investido || 0));
      }
      if (r.status === "fulfilled") {
        setRendimentoDiario(Number(r.value?.ultimo_rendimento || 0));
      }
      if (p.status === "fulfilled") {
        const pinsData = Array.isArray((p.value as any)?.data) ? (p.value as any).data : [];
        setPins(pinsData);
        setPinsLoaded(true);
      }
      if (hp.status === "fulfilled") {
        const hist = Array.isArray(hp.value?.historico) ? hp.value.historico : [];
        setHistoricoPatrimonio(
          hist.map((item: any) => ({ data: item.data, valor: Number(item.carteira_dia) || 0 }))
        );
      }
      if (hr.status === "fulfilled") {
        const hist = Array.isArray(hr.value?.historico) ? hr.value.historico : [];
        setHistoricoRendimentos(
          hist.map((item: any) => ({ data: item.data, valor: Number(item.rendimento_dia) || 0 }))
        );
      }

    } catch (err: any) {
      if (err instanceof ApiError) {
        Alert.alert("Erro", err.message);
      } else {
        Alert.alert("Erro", "Falha ao carregar dados da carteira.");
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

  const go = (route: string) => {
    navigation.navigate(route);
  };

  if (!user?.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Carteira</Text>
        <Text style={styles.pageSubtitle}>
          Faça login para visualizar sua carteira.
        </Text>
      </View>
    );
  }

  return (
    <SwipeTabsWrapper currentTab="Patrimônio">
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Título + botão Depositar */}
        <View style={tituloRow.row}>
          <Text style={styles.pageTitle}>Carteira</Text>
          <TouchableOpacity style={tituloRow.depositarBtn} onPress={() => go("Deposit")}>
            <Text style={tituloRow.depositarText}>Depositar</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginBottom: 12 }} />}

        <View style={styles.menu}>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Patrimônio</Text>
            <Text style={styles.menuValue}>{moneyTrunc2(patrimonio)}</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Investido</Text>
            <Text style={styles.menuValue}>{moneyTrunc2(investido)}</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Saldo</Text>
            <Text style={styles.menuValue}>{moneyTrunc8(saldo)}</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Rendimento diário</Text>
            <Text style={styles.menuValue}>{moneyTrunc8(rendimentoDiario)}</Text>
          </View>
        </View>

        {/* Gráfico de Crescimento do Patrimônio */}
        {historicoPatrimonio.length >= 2 && (
          <View style={graficoStyle.card}>
            <GraficoLinha
              pontos={historicoPatrimonio}
              cor="#34C759"
              titulo="Crescimento do Patrimônio"
              altura={140}
              formatarValor={moneyTrunc2}
            />
          </View>
        )}

        {/* Gráfico de Crescimento dos Rendimentos */}
        {historicoRendimentos.length >= 2 && (
          <View style={graficoStyle.card}>
            <GraficoLinha
              pontos={historicoRendimentos}
              cor="#007AFF"
              titulo="Crescimento dos Rendimentos"
              altura={140}
              formatarValor={moneyTrunc8}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.menuItem, styles.centeredButton, styles.sacar]}
          onPress={() => go("Withdraw")}
        >
          <Text style={styles.sacarText}>Sacar</Text>
        </TouchableOpacity>

        {/* Pins */}
        <View style={styles.pinsSection}>
          <Text style={styles.pinsSectionTitle}>Meus Pins</Text>

          {pinsSorted.length === 0 ? (
            <Text style={styles.pinsEmpty}>
              {pinsLoaded ? "Você ainda não possui pins." : "Carregando..."}
            </Text>
          ) : (
            pinsSorted.map((item) => (
              <View key={item.id_resultado} style={styles.pinCardSmall}>
                <Text style={styles.pinTitleSmall} numberOfLines={2}>
                  {item.razao_social}
                </Text>

                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Pins investidos</Text>
                  <Text style={styles.pinValue}>
                    {Number(item.quantidade_tokens_total_usuario || 0).toLocaleString("pt-BR")}
                  </Text>
                </View>

                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Rendimento diário</Text>
                  <Text style={styles.pinValue}>
                    {moneyTrunc8(item.rendimento_token_total_usuario)}
                  </Text>
                </View>

                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Juros a.a</Text>
                  <Text style={styles.pinValue}>{item.juros_a_a}%</Text>
                </View>

                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Risco</Text>
                  <Text style={styles.pinValue}>{item.risco}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SwipeTabsWrapper>
  );
}

const graficoStyle = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});

const tituloRow = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 16,
  },
  depositarBtn: {
    backgroundColor: "#34C759",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  depositarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
