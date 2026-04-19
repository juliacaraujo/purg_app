import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { makeAccountStyles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
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
import type { PinUsuario, GraficoPoint } from "../../../types";

const moneyTrunc8 = (v: number | string | null | undefined) => {
  const n = Math.trunc((Number(v) || 0) * 1e8) / 1e8;
  return `R$ ${n.toFixed(8).replace(".", ",")}`;
};

const moneyTrunc2 = (v: number | string | null | undefined) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

export default function Account({ navigation }: { navigation: { navigate: (route: string) => void } }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeAccountStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);
  const [rendimentoDiario, setRendimentoDiario] = useState(0);

  const [pins, setPins] = useState<PinUsuario[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);

  const [historicoPatrimonio, setHistoricoPatrimonio] = useState<GraficoPoint[]>([]);
  const [historicoRendimentos, setHistoricoRendimentos] = useState<GraficoPoint[]>([]);

  const patrimonio = useMemo(() => saldo + investido, [saldo, investido]);

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
        setPins(Array.isArray(p.value?.data) ? p.value.data : []);
        setPinsLoaded(true);
      }
      if (hp.status === "fulfilled") {
        const hist = Array.isArray(hp.value?.historico) ? hp.value.historico : [];
        setHistoricoPatrimonio(
          hist.map((item) => ({ data: item.data, valor: Number(item.carteira_dia) || 0 }))
        );
      }
      if (hr.status === "fulfilled") {
        const hist = Array.isArray(hr.value?.historico) ? hr.value.historico : [];
        setHistoricoRendimentos(
          hist.map((item) => ({ data: item.data, valor: Number(item.rendimento_dia) || 0 }))
        );
      }
      const falhas: string[] = [];
      if (c.status === "rejected") falhas.push("saldo");
      if (r.status === "rejected") falhas.push("rendimentos");
      if (p.status === "rejected") falhas.push("pins");
      if (hp.status === "rejected") falhas.push("histórico de patrimônio");
      if (hr.status === "rejected") falhas.push("histórico de rendimentos");
      if (falhas.length > 0) {
        Alert.alert("Aviso", `Não foi possível carregar: ${falhas.join(", ")}.`);
      }
    } catch (err: unknown) {
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

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const go = (route: string) => navigation.navigate(route);

  if (!user?.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Patrimônio</Text>
        <Text style={styles.pageSubtitle}>Faça login para visualizar sua carteira.</Text>
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
        {/* Título + botões */}
        <View style={styles.tituloRow}>
          <Text style={styles.pageTitle}>Patrimônio</Text>
          <View style={styles.tituloBtns}>
            <TouchableOpacity style={styles.depositarBtn} onPress={() => go("Deposit")}>
              <Text style={styles.depositarText}>Depositar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sacarBtn} onPress={() => go("Withdraw")}>
              <Text style={styles.sacarBtnText}>Sacar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && <ActivityIndicator style={{ marginBottom: 12 }} />}

        {/* ── Carteira ── */}
        <View style={styles.carteiraSecao}>
          <Text style={styles.carteiraSecaoTitulo}>Carteira</Text>
          <View style={styles.carteiraLinha}>
            <Text style={styles.carteiraLabel}>Patrimônio</Text>
            <Text style={styles.carteiraValor}>{moneyTrunc2(patrimonio)}</Text>
          </View>
          <View style={styles.carteiraLinha}>
            <Text style={styles.carteiraLabel}>Investido</Text>
            <Text style={styles.carteiraValor}>{moneyTrunc2(investido)}</Text>
          </View>
          <View style={styles.carteiraLinha}>
            <Text style={styles.carteiraLabel}>Saldo</Text>
            <Text style={styles.carteiraValor}>{moneyTrunc8(saldo)}</Text>
          </View>
          <View style={[styles.carteiraLinha, { borderBottomWidth: 0 }]}>
            <Text style={styles.carteiraLabel}>Rendimento diário</Text>
            <Text style={styles.carteiraValor}>{moneyTrunc8(rendimentoDiario)}</Text>
          </View>
        </View>

        {/* ── Gráficos ── */}
        {(historicoPatrimonio.length >= 2 || historicoRendimentos.length >= 2) && (
          <>
            <Text style={styles.secaoTitulo}>Gráficos</Text>
            <View style={styles.secaoCard}>
              {historicoPatrimonio.length >= 2 && (
                <GraficoLinha
                  pontos={historicoPatrimonio}
                  cor={colors.primary}
                  titulo="Crescimento do Patrimônio"
                  altura={140}
                  formatarValor={moneyTrunc2}
                />
              )}
              {historicoRendimentos.length >= 2 && (
                <View style={historicoPatrimonio.length >= 2 ? { marginTop: 20 } : undefined}>
                  <GraficoLinha
                    pontos={historicoRendimentos}
                    cor="#007AFF"
                    titulo="Crescimento dos Rendimentos"
                    altura={140}
                    formatarValor={moneyTrunc8}
                  />
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Pins ── */}
        <Text style={styles.secaoTitulo}>Pins</Text>
        <View style={styles.secaoCard}>
          {pinsSorted.length === 0 ? (
            <Text style={styles.pinsEmpty}>
              {pinsLoaded ? "Você ainda não possui pins." : "Carregando..."}
            </Text>
          ) : (
            pinsSorted.map((item, index) => (
              <View
                key={item.id_resultado}
                style={[styles.pinCardSmall, index === pinsSorted.length - 1 && { marginBottom: 0 }]}
              >
                <Text style={styles.pinTitleSmall} numberOfLines={2}>{item.razao_social}</Text>
                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Pins investidos</Text>
                  <Text style={styles.pinValue}>
                    {Number(item.quantidade_tokens_total_usuario || 0).toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Rendimento diário</Text>
                  <Text style={styles.pinValue}>{moneyTrunc8(item.rendimento_token_total_usuario)}</Text>
                </View>
                <View style={styles.pinRow}>
                  <Text style={styles.pinLabel}>Juros a.a</Text>
                  <Text style={styles.pinValue}>{item.juros_a_a}%</Text>
                </View>
                <View style={[styles.pinRow, { borderBottomWidth: 0 }]}>
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
