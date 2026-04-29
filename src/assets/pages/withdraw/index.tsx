import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import { makeWithdrawStyles } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import type { ThemeColors } from "../../../context/ThemeContext";
import { AppBottomBar } from "../../components/AppBottomBar";
import {
  getCarteira,
  getDadosCadastro,
  getBuscarSaquesPendentes,
  getHistoricoSaques,
  solicitarSaque,
  cancelarSaque,
  getPinNegociacaoStatus,
  criarPinNegociacao,
  recuperarPinSolicitar,
} from "../../../services/api";

const moneyTrunc = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

type PixKeyName = "pix_cpf" | "pix_celular" | "pix_email" | "pix_chave";

function saqueCancelavel(status: string): boolean {
  return !["Executado", "Cancelado", "Rejeitado"].includes(status);
}

function saqueStatusInfo(status: string): { label: string; cor: string; bg: string } {
  switch (status) {
    case "Executado":   return { label: "Executado",   cor: "#166534", bg: "#dcfce7" };
    case "Processando": return { label: "Processando", cor: "#854d0e", bg: "#fef9c3" };
    case "Rejeitado":   return { label: "Rejeitado",   cor: "#991b1b", bg: "#fee2e2" };
    case "Cancelado":   return { label: "Cancelado",   cor: "#475569", bg: "#f1f5f9" };
    default:            return { label: status ?? "—", cor: "#475569", bg: "#f1f5f9" };
  }
}

function formatData(val: string) {
  if (!val) return "";
  try {
    return new Date(val).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return val;
  }
}

function tentativasLabel(n: number): string {
  return `${n} tentativa${n !== 1 ? "s" : ""} restante${n !== 1 ? "s" : ""}`;
}

export default function Withdraw() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeWithdrawStyles(colors), [colors]);
  const ps = useMemo(() => makePinStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);
  const [valor, setValor] = useState("");
  const [saquesPendentes, setSaquesPendentes] = useState<any[]>([]);
  const [historicoSaques, setHistoricoSaques] = useState<any[]>([]);
  const [dadosCadastro, setDadosCadastro] = useState<any>(null);
  const [pixSelecionado, setPixSelecionado] = useState<PixKeyName | null>(null);

  const [pinCadastrado, setPinCadastrado] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinErro, setPinErro] = useState<string | null>(null);

  const [modalCriarPin, setModalCriarPin] = useState(false);
  const [pinNovo, setPinNovo] = useState("");
  const [pinNovoConf, setPinNovoConf] = useState("");
  const [erroCriarPin, setErroCriarPin] = useState<string | null>(null);
  const [criandoPin, setCriandoPin] = useState(false);

  const [modalEsqueciPin, setModalEsqueciPin] = useState(false);
  const [senhaLoginRecup, setSenhaLoginRecup] = useState("");
  const [erroRecupPin, setErroRecupPin] = useState<string | null>(null);
  const [recuperando, setRecuperando] = useState(false);
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false);

  const totalDisponivel = useMemo(() => saldo + investido, [saldo, investido]);

  const pixDisponiveis = useMemo(() => {
    if (!dadosCadastro) return [];
    const map: { key: PixKeyName; label: string }[] = [];
    if (dadosCadastro.pix_email)   map.push({ key: "pix_email",   label: "PIX E-mail" });
    if (dadosCadastro.pix_cpf)     map.push({ key: "pix_cpf",     label: "PIX CPF" });
    if (dadosCadastro.pix_celular) map.push({ key: "pix_celular", label: "PIX Celular" });
    if (dadosCadastro.pix_chave)   map.push({ key: "pix_chave",   label: "PIX Chave aleatória" });
    return map;
  }, [dadosCadastro]);

  const carregarDados = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [c, d, pendentes, hist, pinStatus] = await Promise.all([
        getCarteira(user.id),
        getDadosCadastro(user.id),
        getBuscarSaquesPendentes(user.id),
        getHistoricoSaques(user.id),
        getPinNegociacaoStatus(user.id),
      ]);
      setSaldo(Number(c?.saldo || 0));
      setInvestido(Number(c?.investido || 0));
      setDadosCadastro(d || null);
      setSaquesPendentes(Array.isArray(pendentes) ? pendentes : []);
      setHistoricoSaques(Array.isArray(hist) ? hist : []);
      setPinCadastrado(pinStatus.senha_cadastrada);
    } catch {
      Alert.alert("Erro", "Erro ao carregar dados do saque.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleCancelar = (saqueId: number) => {
    Alert.alert("Cancelar saque", "Tem certeza que deseja cancelar este saque?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await cancelarSaque(saqueId);
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
    if (!user?.id) return;
    const valorNum = Number(valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }
    if (valorNum > totalDisponivel) {
      Alert.alert("Valor inválido", "O valor do saque não pode ser maior que o disponível.");
      return;
    }
    if (!pixSelecionado) {
      Alert.alert("Atenção", "Selecione uma chave PIX.");
      return;
    }
    if (!pinInput || pinInput.length !== 4) {
      setPinErro("Informe os 4 dígitos da Senha de Negociação.");
      return;
    }
    setPinErro(null);
    try {
      setLoading(true);
      await solicitarSaque(user.id, valorNum, pixSelecionado, pinInput);
      Alert.alert("Saque em processamento", "O valor chegará em instantes após a confirmação do banco.");
      setValor("");
      setPinInput("");
      carregarDados();
    } catch (e: any) {
      if (e?.status === 401) {
        const tent = e?.data?.tentativas_restantes;
        setPinErro(`Senha incorreta.${tent != null ? ` ${tentativasLabel(tent)}.` : ""}`);
      } else if (e?.status === 423) {
        const ate = e?.data?.bloqueado_ate;
        let msg = "Conta bloqueada temporariamente.";
        if (ate) {
          try {
            const hora = new Date(ate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            msg = `Conta bloqueada. Tente novamente após ${hora}.`;
          } catch {}
        }
        setPinErro(msg);
      } else {
        Alert.alert("Erro", e?.message || "Não foi possível realizar o saque.");
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleCriarPin() {
    if (pinNovo.length !== 4 || !/^\d{4}$/.test(pinNovo)) {
      setErroCriarPin("A senha deve ter exatamente 4 dígitos numéricos.");
      return;
    }
    if (pinNovo !== pinNovoConf) {
      setErroCriarPin("As senhas não coincidem.");
      return;
    }
    try {
      setCriandoPin(true);
      setErroCriarPin(null);
      await criarPinNegociacao(user!.id, { senha: pinNovo, senha_confirmacao: pinNovoConf });
      setModalCriarPin(false);
      setPinNovo("");
      setPinNovoConf("");
      setPinCadastrado(true);
    } catch (e: any) {
      setErroCriarPin(e?.message || "Não foi possível criar a senha.");
    } finally {
      setCriandoPin(false);
    }
  }

  async function handleRecuperarPin() {
    if (!senhaLoginRecup) {
      setErroRecupPin("Informe sua senha de login.");
      return;
    }
    try {
      setRecuperando(true);
      setErroRecupPin(null);
      await recuperarPinSolicitar(user!.id, { senha_login: senhaLoginRecup });
      setRecuperacaoEnviada(true);
    } catch (e: any) {
      setErroRecupPin(e?.message || "Não foi possível enviar o e-mail de recuperação.");
    } finally {
      setRecuperando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Saque</Text>

        {/* Saldo disponível */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Disponível para saque</Text>
          <Text style={styles.infoValue}>{moneyTrunc(totalDisponivel)}</Text>
        </View>

        {loading && pinCadastrado === null && (
          <ActivityIndicator style={{ marginTop: 16 }} />
        )}

        {/* Sem Senha de Negociação */}
        {!loading && pinCadastrado === false && (
          <View style={ps.aviso}>
            <Text style={ps.avisoTitulo}>Senha de Negociação necessária</Text>
            <Text style={ps.avisoText}>
              Para realizar saques, você precisa criar uma senha de 4 dígitos que protege suas transações financeiras.
            </Text>
            <TouchableOpacity
              style={ps.criarPinBtn}
              onPress={() => { setPinNovo(""); setPinNovoConf(""); setErroCriarPin(null); setModalCriarPin(true); }}
            >
              <Text style={ps.criarPinText}>Criar Senha de Negociação</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Formulário de saque */}
        {pinCadastrado === true && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Valor do saque (ex: 100,00)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
            />

            <View style={styles.pixBox}>
              <Text style={styles.pixLabel}>Selecionar PIX</Text>
              {pixDisponiveis.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.pixOption, pixSelecionado === p.key && styles.pixOptionActive]}
                  onPress={() => setPixSelecionado(p.key)}
                >
                  <Text style={styles.pixText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={ps.pinSection}>
              <View style={ps.pinLabelRow}>
                <Text style={ps.pinLabel}>Senha de Negociação</Text>
                <TouchableOpacity
                  onPress={() => { setSenhaLoginRecup(""); setErroRecupPin(null); setRecuperacaoEnviada(false); setModalEsqueciPin(true); }}
                >
                  <Text style={ps.esqueciLink}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[ps.pinInput, pinErro ? ps.pinInputErro : undefined]}
                placeholder="••••"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={pinInput}
                onChangeText={(v) => { setPinInput(v); setPinErro(null); }}
              />
              {pinErro && <Text style={ps.pinErroText}>{pinErro}</Text>}
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 16 }} />
            ) : (
              <TouchableOpacity style={styles.sacarBtn} onPress={handleSacar}>
                <Text style={styles.sacarText}>Sacar</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Saques pendentes */}
        {saquesPendentes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Saques pendentes</Text>
            {saquesPendentes.map((s, i) => {
              const st = saqueStatusInfo(s.status_saque);
              return (
                <View key={s.id ?? i} style={styles.historicoItem}>
                  <View style={styles.historicoRow}>
                    <Text style={styles.historicoValor}>{moneyTrunc(s.valor_saque)}</Text>
                    <View style={[styles.historicoBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.historicoBadgeText, { color: st.cor }]}>{st.label}</Text>
                    </View>
                  </View>
                  {s.data_criacao && (
                    <Text style={styles.historicoData}>{formatData(s.data_criacao)}</Text>
                  )}
                  <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelar(s.id)}>
                    <Text style={styles.cancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Histórico de saques */}
        <Text style={styles.sectionTitle}>Histórico de saques</Text>
        {loading ? (
          <ActivityIndicator />
        ) : historicoSaques.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum saque encontrado.</Text>
        ) : (
          historicoSaques.map((s, i) => {
            const st = saqueStatusInfo(s.status_saque);
            return (
              <View key={s.id ?? i} style={styles.historicoItem}>
                <View style={styles.historicoRow}>
                  <Text style={styles.historicoValor}>{moneyTrunc(s.valor_saque)}</Text>
                  <View style={[styles.historicoBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.historicoBadgeText, { color: st.cor }]}>{st.label}</Text>
                  </View>
                </View>
                {s.data_criacao && (
                  <Text style={styles.historicoData}>{formatData(s.data_criacao)}</Text>
                )}
                {saqueCancelavel(s.status_saque) && s.id != null && (
                  <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelar(s.id)}>
                    <Text style={styles.cancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Modal: Criar Senha de Negociação */}
        <Modal visible={modalCriarPin} animationType="slide" transparent>
          <View style={ps.overlay}>
            <View style={ps.modal}>
              <Text style={ps.modalTitulo}>Criar Senha de Negociação</Text>
              <Text style={ps.modalDesc}>
                Escolha uma senha de 4 dígitos numéricos (sem sequências repetidas como 1111) para proteger seus saques.
              </Text>
              <Text style={ps.inputLabel}>Senha</Text>
              <TextInput
                style={ps.modalInput}
                placeholder="••••"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={pinNovo}
                onChangeText={(v) => { setPinNovo(v); setErroCriarPin(null); }}
              />
              <Text style={ps.inputLabel}>Confirmar Senha</Text>
              <TextInput
                style={ps.modalInput}
                placeholder="••••"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={pinNovoConf}
                onChangeText={(v) => { setPinNovoConf(v); setErroCriarPin(null); }}
              />
              {erroCriarPin && <Text style={ps.erroText}>{erroCriarPin}</Text>}
              <View style={ps.modalBtns}>
                <TouchableOpacity style={ps.btnCancelar} onPress={() => setModalCriarPin(false)}>
                  <Text style={ps.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ps.btnSalvar, criandoPin && { opacity: 0.6 }]}
                  onPress={handleCriarPin}
                  disabled={criandoPin}
                >
                  {criandoPin
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={ps.btnSalvarText}>Criar Senha</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Esqueci minha senha */}
        <Modal visible={modalEsqueciPin} animationType="slide" transparent>
          <View style={ps.overlay}>
            <View style={ps.modal}>
              <Text style={ps.modalTitulo}>Recuperar Senha de Negociação</Text>
              {recuperacaoEnviada ? (
                <>
                  <Text style={[ps.modalDesc, { color: "#166534" }]}>
                    E-mail enviado com sucesso! Verifique sua caixa de entrada para redefinir a senha. O link expira em 15 minutos.
                  </Text>
                  <TouchableOpacity style={[ps.btnSalvar, { marginTop: 8 }]} onPress={() => setModalEsqueciPin(false)}>
                    <Text style={ps.btnSalvarText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={ps.modalDesc}>
                    Informe a senha do seu login para confirmar sua identidade. Enviaremos um e-mail com o link de recuperação da senha.
                  </Text>
                  <Text style={ps.inputLabel}>Senha de Login</Text>
                  <TextInput
                    style={ps.modalInput}
                    placeholder="Sua senha de acesso"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    value={senhaLoginRecup}
                    onChangeText={(v) => { setSenhaLoginRecup(v); setErroRecupPin(null); }}
                  />
                  {erroRecupPin && <Text style={ps.erroText}>{erroRecupPin}</Text>}
                  <View style={ps.modalBtns}>
                    <TouchableOpacity style={ps.btnCancelar} onPress={() => setModalEsqueciPin(false)}>
                      <Text style={ps.btnCancelarText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[ps.btnSalvar, recuperando && { opacity: 0.6 }]}
                      onPress={handleRecuperarPin}
                      disabled={recuperando}
                    >
                      {recuperando
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={ps.btnSalvarText}>Enviar e-mail</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
      <AppBottomBar />
    </View>
  );
}

function makePinStyles(c: ThemeColors) {
  return StyleSheet.create({
    aviso: {
      backgroundColor: "#fff7ed",
      borderWidth: 1,
      borderColor: "#f97316",
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    avisoTitulo: { fontSize: 14, fontWeight: "bold", color: "#7c2d12", marginBottom: 6 },
    avisoText: { fontSize: 13, color: "#7c2d12", marginBottom: 14, lineHeight: 19 },
    criarPinBtn: { backgroundColor: c.primary, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
    criarPinText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

    pinSection: { marginBottom: 16 },
    pinLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    pinLabel: { fontWeight: "bold", color: c.textPrimary },
    esqueciLink: { fontSize: 13, fontWeight: "bold", color: c.primary },
    pinInput: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontWeight: "bold",
      color: c.textPrimary,
      fontSize: 20,
      letterSpacing: 10,
      textAlign: "center",
      backgroundColor: c.card,
    },
    pinInputErro: { borderColor: "#ef4444" },
    pinErroText: { color: "#ef4444", fontSize: 13, fontWeight: "bold", marginTop: 6 },

    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitulo: { fontSize: 18, fontWeight: "bold", color: c.textPrimary, marginBottom: 8 },
    modalDesc: { fontSize: 14, color: c.textSecondary, marginBottom: 20, lineHeight: 20 },
    inputLabel: { fontSize: 12, fontWeight: "bold", color: c.textSecondary, marginBottom: 4 },
    modalInput: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: c.textPrimary,
      marginBottom: 14,
      backgroundColor: c.backgroundSecondary,
    },
    erroText: { color: "#ef4444", fontSize: 13, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
    modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
    btnCancelar: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnCancelarText: { color: c.textSecondary, fontWeight: "bold" },
    btnSalvar: { flex: 1, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnSalvarText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  });
}
