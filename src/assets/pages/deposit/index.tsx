import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { styles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { getHistoricoDepositos, getBuscarDepositosPendentes, cancelarDeposito, solicitarDeposito } from "../../../services/api";

// Trunca para 2 casas decimais SEM arredondar (vírgula)
const moneyTrunc = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "confirmado":
    case "aprovado":
    case "concluido":
    case "concluído":
      return { bg: "#dcfce7", text: "#166534" };
    case "pendente":
    case "aguardando":
      return { bg: "#fef9c3", text: "#854d0e" };
    case "cancelado":
    case "recusado":
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

  const [valor, setValor] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarHistorico = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [hist, pend] = await Promise.all([
        getHistoricoDepositos(user.id),
        getBuscarDepositosPendentes(user.id),
      ]);
      const lista = Array.isArray(hist) ? hist : Array.isArray(hist?.data) ? hist.data : [];
      setHistorico(lista);
      setPendentes(pend);
    } catch {
      // histórico opcional — não bloqueia a tela
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const handleCancelarDeposito = () => {
    Alert.alert("Cancelar depósito", "Tem certeza que deseja cancelar o depósito pendente?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await cancelarDeposito(user.id);
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
    const valorNum = Number(valor.replace(/\./g, "").replace(",", "."));

    if (!valorNum || isNaN(valorNum) || valorNum <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }

    try {
      setLoading(true);
      await solicitarDeposito(user.id, valorNum);
      setValor("");
      carregarHistorico();
      navigation.navigate("PixInfo", { valor: valorNum });
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível registrar o depósito.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

      {/* Botão */}
      <TouchableOpacity style={styles.depositBtn} onPress={handleDepositar}>
        <Text style={styles.depositBtnText}>Depositar</Text>
      </TouchableOpacity>

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
                <TouchableOpacity style={styles.cancelarBtn} onPress={handleCancelarDeposito}>
                  <Text style={styles.cancelarText}>Cancelar</Text>
                </TouchableOpacity>
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
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
