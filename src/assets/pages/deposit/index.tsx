import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

// Trunca para 2 casas decimais SEM arredondar (vírgula)
const moneyTrunc = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

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

export default function Deposit({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeDepositStyles(colors), [colors]);
  const { menorDeIdade, permissoes } = useRestricao();

  const [valor, setValor] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [parcela, setParcela] = useState<number | null>(null);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);

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
      const ativo = objs.objetivos?.find((o) => !o.objetivo_completo);
      if (ativo) {
        try {
          const detalhe = await getObjetivoDetalhe(user.id, ativo.objetivo_id);
          const metas = detalhe.metas ?? [];
          if (metas.length > 0) {
            const valorParcela = metas.length > 1 ? metas[1].valor_alvo : metas[0].valor_alvo;
            setParcela(Math.trunc(Number(valorParcela) * 100) / 100);
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

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const handleCancelarDeposito = (depositoId: number) => {
    Alert.alert("Cancelar depósito", "Tem certeza que deseja cancelar este depósito?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await cancelarDeposito(depositoId);
            Alert.alert("Sucesso", "Depósito cancelado com sucesso.");
            carregarHistorico();
          } catch (e: any) {
            Alert.alert("Erro", e?.message || "Não foi possível cancelar o depósito.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDepositar = async () => {
    if (!user?.id) return;
    const valorNum = Number(valor.replace(/\./g, "").replace(",", "."));

    if (!valorNum || isNaN(valorNum) || valorNum <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }

    try {
      setLoading(true);
      const res = await solicitarDeposito(user.id, valorNum);
      setValor("");
      navigation.navigate("PixInfo", {
        valor: valorNum,
        pix_copia_cola: res.pix_copia_cola,
        qr_code: res.qr_code,
        expiracao_min: res.expiracao_min ?? 60,
      });
    } catch (e: any) {
      if (e?.status === 403 || e?.status === 422) {
        Alert.alert("Atenção", e.message);
      } else if (e?.status === 429) {
        navigation.navigate("PixInfo", {
          valor: valorNum,
          pix_copia_cola: e.data?.pix_copia_cola,
          qr_code: e.data?.qr_code,
          expiracao_min: e.data?.expiracao_min ?? 60,
        });
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Depósito</Text>

      {/* Input de valor */}
      <TextInput
        style={styles.input}
        placeholder="Valor do depósito (ex: 100,00)"
        placeholderTextColor="#999"
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={setValor}
      />

      {/* Botões */}
      <View style={styles.botoesRow}>
        {parcela !== null && (
          <TouchableOpacity
            style={styles.parcelaBtn}
            onPress={() => {
              const atual = Math.trunc((Number(valor.replace(/\./g, "").replace(",", ".")) || 0) * 100) / 100;
              const novo = Math.trunc((atual + parcela) * 100) / 100;
              setValor(novo.toFixed(2).replace(".", ","));
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
                  {item.qr_code && (
                    <TouchableOpacity
                      style={[styles.copiarBtn, copiadoId === item.id && styles.copiarBtnCopiado]}
                      onPress={() => copiarPix(item.id, item.qr_code)}
                    >
                      <Text style={[styles.copiarText, copiadoId === item.id && styles.copiarTextCopiado]}>
                        {copiadoId === item.id ? "Copiado!" : "Copiar PIX"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelarDeposito(item.id)}>
                    <Text style={styles.cancelarText}>Cancelar</Text>
                  </TouchableOpacity>
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
      ) : historico.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum depósito encontrado.</Text>
      ) : (
        historico.map((item, i) => {
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
    </ScrollView>
    <AppBottomBar />
    </View>
  );
}
