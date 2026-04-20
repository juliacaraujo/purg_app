import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { styles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import {
  getCarteira,
  getDadosCadastro,
  getBuscarSaquesPendentes,
  getHistoricoSaques,
  solicitarSaque,
  cancelarSaque,
  atualizarAssinatura,
} from "../../../services/api";

// Trunca para 2 casas decimais SEM arredondar (vírgula)
const moneyTrunc = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

type PixKeyName = "pix_cpf" | "pix_celular" | "pix_email" | "pix_chave";

export default function Withdraw() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);

  const [valor, setValor] = useState("");
  const [saquesPendentes, setSaquesPendentes] = useState<any[]>([]);
  const [historicoSaques, setHistoricoSaques] = useState<any[]>([]);

  const [dadosCadastro, setDadosCadastro] = useState<any>(null);
  const [pixSelecionado, setPixSelecionado] = useState<PixKeyName | null>(null);

  const totalDisponivel = useMemo(
    () => saldo + investido,
    [saldo, investido]
  );

  const pixDisponiveis = useMemo(() => {
    if (!dadosCadastro) return [];
    const map: { key: PixKeyName; label: string }[] = [];

    if (dadosCadastro.pix_email)
      map.push({ key: "pix_email", label: "PIX E-mail" });
    if (dadosCadastro.pix_cpf)
      map.push({ key: "pix_cpf", label: "PIX CPF" });
    if (dadosCadastro.pix_celular)
      map.push({ key: "pix_celular", label: "PIX Celular" });
    if (dadosCadastro.pix_chave)
      map.push({ key: "pix_chave", label: "PIX Chave aleatória" });

    return map;
  }, [dadosCadastro]);

  const carregarDados = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      const [c, d, pendentes, hist] = await Promise.all([
        getCarteira(user.id),
        getDadosCadastro(user.id),
        getBuscarSaquesPendentes(user.id),
        getHistoricoSaques(user.id),
      ]);

      setSaldo(Number(c?.saldo || 0));
      setInvestido(Number(c?.investido || 0));
      setDadosCadastro(d || null);

      setSaquesPendentes(Array.isArray(pendentes) ? pendentes : []);
      setHistoricoSaques(Array.isArray(hist) ? hist : []);
    } catch (e) {
      Alert.alert("Erro", "Erro ao carregar dados do saque.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleCancelar = async () => {
    Alert.alert("Cancelar saque", "Tem certeza que deseja cancelar o saque pendente?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await cancelarSaque(user.id);
            Alert.alert("Sucesso", "Saque cancelado com sucesso.");
            carregarDados();
          } catch (e: any) {
            Alert.alert("Erro", e?.message || "Não foi possível cancelar o saque.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSacar = async () => {
    const valorNum = Number(valor.replace(",", "."));

    if (!valorNum || valorNum <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }

    if (valorNum > totalDisponivel) {
      Alert.alert(
        "Valor inválido",
        "O valor do saque não pode ser maior que o disponível."
      );
      return;
    }

    if (!pixSelecionado) {
      Alert.alert("Atenção", "Selecione uma chave PIX.");
      return;
    }

    try {
      setLoading(true);

      await solicitarSaque(user.id, valorNum, pixSelecionado);

      atualizarAssinatura(user.id, "Poppy Pro").catch(() => {});

      Alert.alert("Sucesso", "Saque solicitado com sucesso.");
      setValor("");
      carregarDados();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível realizar o saque.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Saque</Text>

      {/* Saldo + Investido */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Disponível para saque</Text>
        <Text style={styles.infoValue}>
          {moneyTrunc(totalDisponivel)}
        </Text>
      </View>

      {/* Valor */}
      <TextInput
        style={styles.input}
        placeholder="Valor do saque"
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={setValor}
      />

      {/* Seleção PIX */}
      <View style={styles.pixBox}>
        <Text style={styles.pixLabel}>Selecionar PIX</Text>

        {pixDisponiveis.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.pixOption,
              pixSelecionado === p.key && styles.pixOptionActive,
            ]}
            onPress={() => setPixSelecionado(p.key)}
          >
            <Text style={styles.pixText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botão sacar */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : (
        <TouchableOpacity style={styles.sacarBtn} onPress={handleSacar}>
          <Text style={styles.sacarText}>Sacar</Text>
        </TouchableOpacity>
      )}

      {/* Saques pendentes */}
      {saquesPendentes.map((s, i) => (
        <View key={s.id ?? i} style={styles.pendenteBox}>
          <Text style={styles.pendenteText}>
            Saque pendente — {moneyTrunc(s.valor_saque)}
          </Text>
          <TouchableOpacity style={styles.cancelarBtn} onPress={handleCancelar}>
            <Text style={styles.cancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Histórico de saques */}
      {historicoSaques.length > 0 && (
        <>
          <Text style={styles.historicoTitle}>Histórico de saques</Text>
          {historicoSaques.map((s, i) => (
            <View key={s.id ?? i} style={styles.historicoBox}>
              <View style={styles.historicoRow}>
                <Text style={styles.historicoLabel}>Valor</Text>
                <Text style={styles.historicoValor}>{moneyTrunc(s.valor_saque)}</Text>
              </View>
              <View style={styles.historicoRow}>
                <Text style={styles.historicoLabel}>Status</Text>
                <Text style={styles.historicoStatus}>{s.status_saque}</Text>
              </View>
              <View style={styles.historicoRow}>
                <Text style={styles.historicoLabel}>Data</Text>
                <Text style={styles.historicoStatus}>
                  {new Date(s.data_criacao).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
