import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRefresh } from "../../../context/RefreshContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { makeAccountStyles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { useRestricao } from "../../../context/RestricaoContext";
import GraficoBarras from "../../components/GraficoBarras";
import ScrollViewRefresh from "../../components/ScrollViewRefresh";
import GraficoPizza from "../../components/GraficoPizza";
import type { FatiaPizza } from "../../components/GraficoPizza";
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
  const { menorDeIdade, permissoes } = useRestricao();
  const { colors } = useTheme();
  const styles = useMemo(() => makeAccountStyles(colors), [colors]);
  const { refreshToken } = useRefresh();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);
  const [rendimentoDiario, setRendimentoDiario] = useState(0);

  const [pins, setPins] = useState<PinUsuario[]>([]);
  const [pinsLoaded, setPinsLoaded] = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  const [historicoPatrimonio, setHistoricoPatrimonio] = useState<GraficoPoint[]>([]);
  const [historicoRendimentos, setHistoricoRendimentos] = useState<GraficoPoint[]>([]);

  const rendimentosMensal = useMemo((): GraficoPoint[] => {
    const mapa: Record<string, number> = {};
    for (const p of historicoRendimentos) {
      const mes = p.data.slice(0, 7);
      mapa[mes] = (mapa[mes] ?? 0) + p.valor;
    }
    return Object.entries(mapa)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({ data: mes + "-01", valor }));
  }, [historicoRendimentos]);

  const patrimonio = useMemo(() => saldo + investido, [saldo, investido]);

  const pinsSorted = useMemo(
    () =>
      [...pins]
        .filter((p) => Number(p.quantidade_tokens_total_usuario || 0) > 0)
        .sort((a, b) => Number(b.juros_a_a || 0) - Number(a.juros_a_a || 0)),
    [pins]
  );

  const pinsFiltrados = useMemo(() => {
    if (!filtroEmpresa.trim()) return pinsSorted;
    const termo = filtroEmpresa.trim().toLowerCase();
    return pinsSorted.filter((p) =>
      (p.razao_social ?? "").toLowerCase().includes(termo)
    );
  }, [pinsSorted, filtroEmpresa]);

  const RISCO_CORES: Record<string, string> = {
    Baixo: "#00C48C",
    Médio: "#FFB300",
    Alto: "#FF3D71",
    Outro: "#845EC2",
  };

  const resumoPins = useMemo(() => {
    if (pinsSorted.length === 0) return null;
    const mediaJuros =
      pinsSorted.reduce((acc, p) => acc + Number(p.juros_a_a || 0), 0) / pinsSorted.length;
    const FALLBACK_CORES = ["#845EC2", "#0096FF", "#FF6F91", "#F9A03F", "#00B4D8"];
    let fallbackIdx = 0;
    const riscoMap: Record<string, { quantidade: number; cor: string; rendDiario: number }> = {};
    for (const p of pinsSorted) {
      const risco = p.risco || "Outro";
      const cor = RISCO_CORES[risco] ?? FALLBACK_CORES[fallbackIdx++ % FALLBACK_CORES.length];
      if (!riscoMap[risco]) riscoMap[risco] = { quantidade: 0, cor, rendDiario: 0 };
      riscoMap[risco].quantidade += Number(p.quantidade_tokens_total_usuario || 0);
      riscoMap[risco].rendDiario += Number(p.rendimento_token_total_usuario || 0);
    }
    const riscoPizza: FatiaPizza[] = Object.entries(riscoMap).map(([label, { quantidade, cor, rendDiario }]) => ({
      label,
      valor: quantidade,
      cor,
      rendDiario,
    }));
    return { quantidade: pinsSorted.length, mediaJuros, riscoPizza };
  }, [pinsSorted]);

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

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  useEffect(() => { if (refreshToken > 0) carregar(); }, [refreshToken]);

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
      <ScrollViewRefresh
        contentContainerStyle={styles.container}
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary}
        showsVerticalScrollIndicator={false}
      >
        {/* Título + botões */}
        <View style={styles.tituloRow}>
          <Text style={styles.pageTitle}>Patrimônio</Text>
          <View style={styles.tituloBtns}>
            <TouchableOpacity
              style={[styles.depositarBtn, menorDeIdade && !permissoes.podeDepositar && { opacity: 0.4 }]}
              onPress={menorDeIdade && !permissoes.podeDepositar ? undefined : () => go("Deposit")}
              disabled={menorDeIdade && !permissoes.podeDepositar}
            >
              <Text style={styles.depositarText}>{menorDeIdade && !permissoes.podeDepositar ? "🔒 Depositar" : "Depositar"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sacarBtn, menorDeIdade && !permissoes.podeSacar && { opacity: 0.4 }]}
              onPress={menorDeIdade && !permissoes.podeSacar ? undefined : () => go("Withdraw")}
              disabled={menorDeIdade && !permissoes.podeSacar}
            >
              <Text style={styles.sacarBtnText}>{menorDeIdade && !permissoes.podeSacar ? "🔒 Sacar" : "Sacar"}</Text>
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
                <GraficoBarras
                  pontos={historicoPatrimonio}
                  cor="#4BC0C0"
                  titulo="CRESCIMENTO DE PATRIMÔNIO"
                  altura={140}
                  formatarValor={moneyTrunc2}
                />
              )}
              {rendimentosMensal.length >= 2 && (
                <View style={historicoPatrimonio.length >= 2 ? { marginTop: 20 } : undefined}>
                  <GraficoBarras
                    pontos={rendimentosMensal}
                    cor="#A0D47C"
                    titulo="CRESCIMENTO DOS RENDIMENTOS"
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
        {resumoPins && (
          <>
            <View style={styles.carteiraSecao}>
              <View style={styles.carteiraLinha}>
                <Text style={styles.carteiraLabel}>Pins diferentes investidos</Text>
                <Text style={styles.carteiraValor}>{resumoPins.quantidade}</Text>
              </View>
              <View style={[styles.carteiraLinha, { borderBottomWidth: 0 }]}>
                <Text style={styles.carteiraLabel}>Média dos juros a.a</Text>
                <Text style={styles.carteiraValor}>{resumoPins.mediaJuros.toFixed(2).replace(".", ",")}%</Text>
              </View>
            </View>
            <View style={styles.carteiraSecao}>
              <GraficoPizza fatias={resumoPins.riscoPizza} />
            </View>
          </>
        )}
        {pinsSorted.length === 0 ? (
          <View style={styles.secaoCard}>
            <Text style={styles.pinsEmpty}>
              {pinsLoaded ? "Você ainda não possui pins." : "Carregando..."}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.carteiraSecao, { paddingVertical: 10, marginBottom: 8 }]}>
              <View style={{
                flexDirection: "row", alignItems: "center",
                borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
                paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.background,
              }}>
                <Text style={{ color: colors.textTertiary, marginRight: 6, fontSize: 13 }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 }}
                  placeholder="Filtrar por empresa..."
                  placeholderTextColor={colors.textTertiary}
                  value={filtroEmpresa}
                  onChangeText={setFiltroEmpresa}
                />
                {filtroEmpresa.length > 0 && (
                  <TouchableOpacity onPress={() => setFiltroEmpresa("")}>
                    <Text style={{ color: colors.textTertiary, fontSize: 16, paddingLeft: 6 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.pinTableContainer}>
              <View style={styles.pinTableHeaderRow}>
                <Text style={[styles.pinTableHeaderCell, { flex: 2, textAlign: "left" }]}>EMPRESA</Text>
                <Text style={[styles.pinTableHeaderCell, { flex: 1 }]}>PINS</Text>
                <Text style={[styles.pinTableHeaderCell, { flex: 1.3 }]}>REND. DIÁRIO</Text>
                <Text style={[styles.pinTableHeaderCell, { flex: 1 }]}>JUROS A.A</Text>
                <Text style={[styles.pinTableHeaderCell, { flex: 1 }]}>RISCO</Text>
              </View>
              {pinsFiltrados.length === 0 ? (
                <View style={{ padding: 16 }}>
                  <Text style={[styles.pinsEmpty, { marginTop: 0 }]}>Nenhuma empresa encontrada.</Text>
                </View>
              ) : (
                pinsFiltrados.map((item, index) => (
                  <View
                    key={item.id_resultado}
                    style={[styles.pinTableRow, index === pinsFiltrados.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Text style={[styles.pinTableCellName, { flex: 2 }]} numberOfLines={2}>{item.razao_social}</Text>
                    <Text style={[styles.pinTableCell, { flex: 1 }]}>
                      {Number(item.quantidade_tokens_total_usuario || 0).toLocaleString("pt-BR")}
                    </Text>
                    <Text style={[styles.pinTableCell, { flex: 1.3 }]}>
                      {moneyTrunc8(item.rendimento_token_total_usuario)}
                    </Text>
                    <Text style={[styles.pinTableCell, { flex: 1 }]}>{item.juros_a_a}%</Text>
                    <Text style={[styles.pinTableCell, { flex: 1 }]}>{item.risco}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollViewRefresh>
    </SwipeTabsWrapper>
  );
}
