import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { makeDepositStyles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { getHistoricoDepositos, getBuscarDepositosPendentes, cancelarDeposito, solicitarDeposito, getObjetivos, getObjetivoDetalhe } from "../../../services/api";
import { AppBottomBar } from "../../components/AppBottomBar";
import { BloqueioTela } from "../../components/BloqueioTela";
import { useRestricao } from "../../../context/RestricaoContext";
import * as Clipboard from "expo-clipboard";
import ScrollViewRefresh from "../../components/ScrollViewRefresh";

// Trunca para 2 casas decimais SEM arredondar (vírgula)
const moneyTrunc = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

function aplicarMascaraMoeda(text: string): string {
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  const reais = Math.floor(num / 100);
  const centavos = num % 100;
  return reais.toLocaleString("pt-BR") + "," + String(centavos).padStart(2, "0");
}

function parseMascaraMoeda(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

function depositoCancelavel(status: string): boolean {
  return !["Executado", "Cancelado", "Rejeitado"].includes(status);
}

function statusColor(status: string) {
  switch (status) {
    case "Executado":
      return { bg: "#dcfce7", text: "#166534" };
    case "Processando":
      return { bg: "#fef9c3", text: "#854d0e" };
    case "Cancelado":
    case "Rejeitado":
      return { bg: "#fee2e2", text: "#991b1b" };
    default:
      return { bg: "#f1f5f9", text: "#475569" };
  }
}

function formatData(val: string) {
  if (!val) return "";
  try {
    return new Date(val).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return val;
  }
}

export default function Deposit({ navigation, route }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeDepositStyles(colors), [colors]);
  const { menorDeIdade, permissoes } = useRestricao();

  const [valor, setValor] = useState<string>(() => {
    const v = route?.params?.valorInicial;
    return v != null ? aplicarMascaraMoeda(String(Math.round(Number(v) * 100))) : "";
  });
  const [historico, setHistorico] = useState<any[]>([]);
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [parcela, setParcela] = useState<number | null>(null);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [semObjetivo, setSemObjetivo] = useState<boolean | null>(null);

  const copiarPix = useCallback(async (id: number, texto: string) => {
    await Clipboard.setStringAsync(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  }, []);

  const carregarHistorico = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [hist, pend, objs] = await Promise.all([
        getHistoricoDepositos(user.id),
        getBuscarDepositosPendentes(user.id),
        getObjetivos(user.id),
      ]);
      const lista = Array.isArray(hist) ? hist : Array.isArray(hist?.data) ? hist.data : [];
      setHistorico(lista);
      setPendentes(pend);
      const ativo = objs.objetivos?.find((o: any) => !o.objetivo_completo);
      setSemObjetivo(!ativo);
      if (ativo) {
        try {
          const detalhe = await getObjetivoDetalhe(user.id, ativo.objetivo_id);
          const metas = detalhe.metas ?? [];
          if (metas.length > 0) {
            const proxMeta = metas.find((m: any) => !m.completo) ?? metas[metas.length - 1];
            setParcela(Math.trunc(Number(proxMeta.valor_alvo) * 100) / 100);
          }
        } catch {
          // parcela opcional — não bloqueia a tela
        }
      }
    } catch {
      // histórico opcional — não bloqueia a tela
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarHistorico();
    setRefreshing(false);
  }, [carregarHistorico]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const handleCancelarDeposito = async (depositoId: number) => {
    try {
      setLoading(true);
      await cancelarDeposito(depositoId);
      Alert.alert("Sucesso", "Depósito cancelado com sucesso.");
      carregarHistorico();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível cancelar o depósito.");
    } finally {
      setLoading(false);
      setCancelandoId(null);
    }
  };

  const handleDepositar = async () => {
    if (!user?.id) return;
    const valorNum = parseMascaraMoeda(valor);

    if (!valorNum || isNaN(valorNum) || valorNum <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }

    try {
      setLoading(true);
      const res = await solicitarDeposito(user.id, valorNum);
      setValor("");

      if (res.jaExistente) {
        // Cenário 1: PIX existente reutilizado (HTTP 200)
        Alert.alert(
          "Você já tem um Pix ativo",
          "Você já tem uma solicitação de depósito, faça ela ou cancele para poder criar uma nova.",
          [
            { text: "Fechar", style: "cancel" },
            {
              text: "Ver Pix",
              onPress: () =>
                navigation.navigate("PixInfo", {
                  pix_copia_cola: res.pix_copia_cola,
                  qr_code: res.qr_code,
                  expiracao_seconds: res.expiracao_restante,
                }),
            },
          ]
        );
      } else {
        // Cenário normal: novo PIX criado (HTTP 201)
        navigation.navigate("PixInfo", {
          valor: valorNum,
          pix_copia_cola: res.pix_copia_cola,
          qr_code: res.qr_code,
          expiracao_min: res.expiracao_min ?? 60,
        });
      }
    } catch (e: any) {
      if (e?.status === 403 || e?.status === 422) {
        Alert.alert("Atenção", e.message);
      } else if (e?.status === 429) {
        // Cenário 2: PIX existente sem QR Code (inconsistência interna)
        Alert.alert("Depósito em análise", e.message);
      } else {
        Alert.alert("Erro", e?.message || "Não foi possível registrar o depósito.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (menorDeIdade && !permissoes.podeDepositar) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
        <BloqueioTela mensagem="Depósitos estão bloqueados. Solicite ao seu responsável que habilite esta funcionalidade." />
        <AppBottomBar />
      </View>
    );
  }

  if (semObjetivo === true) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={[styles.title, { textAlign: "center", marginBottom: 16 }]}>
            Nenhum objetivo ativo
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
            Para fazer um depósito você precisa ter um objetivo configurado. Crie seu primeiro objetivo e comece a guardar dinheiro!
          </Text>
          <TouchableOpacity
            style={[styles.depositBtn, { paddingHorizontal: 32, flex: 0, alignSelf: "center" }]}
            onPress={() => navigation.navigate("AppTabs", { screen: "Objetivos" })}
          >
            <Text style={styles.depositBtnText}>Criar meu primeiro objetivo</Text>
          </TouchableOpacity>
        </View>
        <AppBottomBar />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
    <ScrollViewRefresh
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
    >
      <Text style={styles.title}>Depósito</Text>

      {/* Input de valor */}
      <TextInput
        style={styles.input}
        placeholder="Valor do depósito (ex: 100,00)"
        placeholderTextColor="#999"
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={(t) => setValor(aplicarMascaraMoeda(t))}
      />

      {/* Botões */}
      <View style={styles.botoesRow}>
        {parcela !== null && (
          <TouchableOpacity
            style={styles.parcelaBtn}
            onPress={() => {
              const atual = parseMascaraMoeda(valor);
              const novo = Math.trunc((atual + parcela) * 100) / 100;
              setValor(aplicarMascaraMoeda(String(Math.round(novo * 100))));
            }}
          >
            <Text style={styles.parcelaBtnText}>Meta: +{moneyTrunc(parcela)}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.depositBtn} onPress={handleDepositar}>
          <Text style={styles.depositBtnText}>Depositar</Text>
        </TouchableOpacity>
      </View>

      {/* Depósitos pendentes */}
      {pendentes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Depósitos pendentes</Text>
          {pendentes.map((item, i) => {
            const sc = statusColor(item.status_deposito);
            return (
              <View key={item.id ?? i} style={styles.historicoItem}>
                <View style={styles.historicoRow}>
                  <Text style={styles.historicoValor}>
                    {moneyTrunc(item.valor_deposito)}
                  </Text>
                  <View style={[styles.historicoBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.historicoBadgeText, { color: sc.text }]}>
                      {item.status_deposito ?? "—"}
                    </Text>
                  </View>
                </View>
                {item.data_criacao && (
                  <Text style={styles.historicoData}>
                    {formatData(item.data_criacao)}
                  </Text>
                )}
                <View style={styles.pendenteBtns}>
                  {item.pix_copia_cola && (
                    <TouchableOpacity
                      style={[styles.copiarBtn, copiadoId === item.id && styles.copiarBtnCopiado]}
                      onPress={() => copiarPix(item.id, item.pix_copia_cola)}
                    >
                      <Text style={[styles.copiarText, copiadoId === item.id && styles.copiarTextCopiado]}>
                        {copiadoId === item.id ? "Copiado!" : "Copiar PIX"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {cancelandoId === item.id ? (
                    <>
                      <TouchableOpacity style={styles.cancelarNaoBtn} onPress={() => setCancelandoId(null)}>
                        <Text style={styles.cancelarNaoText}>Não</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelarDeposito(item.id)}>
                        <Text style={styles.cancelarText}>Confirmar</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.cancelarBtn} onPress={() => setCancelandoId(item.id)}>
                      <Text style={styles.cancelarText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Histórico */}
      <Text style={styles.sectionTitle}>Histórico de depósitos</Text>

      {loading ? (
        <ActivityIndicator />
      ) : historico.filter(item => !depositoCancelavel(item.status_deposito)).length === 0 ? (
        <Text style={styles.emptyText}>Nenhum depósito encontrado.</Text>
      ) : (
        historico.filter(item => !depositoCancelavel(item.status_deposito)).map((item, i) => {
          const sc = statusColor(item.status_deposito);
          return (
            <View key={item.id ?? i} style={styles.historicoItem}>
              <View style={styles.historicoRow}>
                <Text style={styles.historicoValor}>
                  {moneyTrunc(item.valor_deposito)}
                </Text>
                <View style={[styles.historicoBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.historicoBadgeText, { color: sc.text }]}>
                    {item.status_deposito ?? "—"}
                  </Text>
                </View>
              </View>
              {item.data_criacao && (
                <Text style={styles.historicoData}>
                  {formatData(item.data_criacao)}
                </Text>
              )}
              {depositoCancelavel(item.status_deposito) && item.id != null && (
                <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelarDeposito(item.id)}>
                  <Text style={styles.cancelarText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </ScrollViewRefresh>
    <AppBottomBar />
    </View>
  );
}
