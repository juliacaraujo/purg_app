import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import {
  getObjetivos,
  criarObjetivo,
  cancelarObjetivo,
} from "../../../services/api";

const GREEN = "#34C759";
const DARK = "#111";
const GRAY = "#888";
const BORDER = "#e8e8e8";

function moeda(v: any) {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

// ─── Barra de progresso ───────────────────────────────
function ProgressBar({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <View style={s.barBg}>
      <View style={[s.barFill, { width: `${p}%` as any }]} />
    </View>
  );
}

// ─── Card de objetivo ─────────────────────────────────
function CardObjetivo({
  item,
  onCancelar,
}: {
  item: any;
  onCancelar: (id: number, desc: string) => void;
}) {
  const pct = Number(item.percentual_geral) || 0;
  const cor = item.objetivo_completo ? GREEN : pct > 50 ? "#007AFF" : DARK;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitulo} numberOfLines={2}>
          {item.descricao}
        </Text>
        {item.objetivo_completo && (
          <View style={s.badge}>
            <Text style={s.badgeText}>Concluído</Text>
          </View>
        )}
        {item.is_patrimonio && (
          <View style={[s.badge, { backgroundColor: "#fff3cd", borderColor: "#ffc107" }]}>
            <Text style={[s.badgeText, { color: "#856404" }]}>Patrimônio</Text>
          </View>
        )}
      </View>

      <ProgressBar percent={pct} />
      <Text style={[s.pct, { color: cor }]}>{pct.toFixed(0)}%</Text>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>Meta</Text>
          <Text style={s.valor}>{moeda(item.valor_alvo)}</Text>
        </View>
        <View style={s.col}>
          <Text style={s.label}>Acumulado</Text>
          <Text style={s.valor}>{moeda(item.saldo_alocado_total)}</Text>
        </View>
        <View style={s.col}>
          <Text style={s.label}>Prazo</Text>
          <Text style={s.valor}>{item.prazo_total} meses</Text>
        </View>
      </View>

      <View style={s.row}>
        <Text style={s.metas}>
          {item.metas_completas}/{item.metas_total} metas concluídas
        </Text>
        {!item.is_patrimonio && !item.objetivo_completo && (
          <TouchableOpacity onPress={() => onCancelar(item.objetivo_id, item.descricao)}>
            <Text style={s.cancelar}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const MESES_NOMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function calcMeses(ano: number, mes: number): number {
  const now = new Date();
  const meses = (ano - now.getFullYear()) * 12 + (mes - (now.getMonth() + 1));
  return Math.max(1, meses);
}

// ─── Modal novo objetivo ──────────────────────────────
function ModalNovoObjetivo({
  visible,
  onClose,
  onSalvar,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSalvar: (dados: { descricao: string; valor_alvo: number; prazo: number; pontos_total: number }) => void;
  loading: boolean;
}) {
  const agora = new Date();
  const [descricao, setDescricao] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [mesSel, setMesSel] = useState(agora.getMonth() + 1); // 1–12
  const [anoSel, setAnoSel] = useState(agora.getFullYear() + 1);

  function limpar() {
    setDescricao("");
    setValorAlvo("");
    setMesSel(new Date().getMonth() + 1);
    setAnoSel(new Date().getFullYear() + 1);
  }

  function anteriorMes() {
    if (mesSel === 1) { setMesSel(12); setAnoSel((y) => y - 1); }
    else setMesSel((m) => m - 1);
  }

  function proximoMes() {
    if (mesSel === 12) { setMesSel(1); setAnoSel((y) => y + 1); }
    else setMesSel((m) => m + 1);
  }

  function handleSalvar() {
    const valor = Number(valorAlvo.replace(",", "."));
    if (!descricao.trim()) {
      Alert.alert("Atenção", "Informe uma descrição.");
      return;
    }
    if (!valor || valor <= 0) {
      Alert.alert("Atenção", "Informe um valor alvo válido.");
      return;
    }
    const meses = calcMeses(anoSel, mesSel);
    if (meses < 1) {
      Alert.alert("Atenção", "A data alvo deve ser no futuro.");
      return;
    }

    const pontos = meses * 40;
    onSalvar({ descricao: descricao.trim(), valor_alvo: valor, prazo: meses, pontos_total: pontos });
  }

  function handleClose() {
    limpar();
    onClose();
  }

  const prazoLabel = `${calcMeses(anoSel, mesSel)} meses`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.modalTitulo}>Novo Objetivo</Text>

          <Text style={s.inputLabel}>Descrição</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Comprar um carro"
            placeholderTextColor="#bbb"
            value={descricao}
            onChangeText={setDescricao}
          />

          <Text style={s.inputLabel}>Valor alvo (R$)</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: 15000"
            placeholderTextColor="#bbb"
            keyboardType="decimal-pad"
            value={valorAlvo}
            onChangeText={setValorAlvo}
          />

          <Text style={s.inputLabel}>Prazo — {prazoLabel}</Text>
          <View style={dp.row}>
            <View style={dp.seletor}>
              <TouchableOpacity style={dp.arrow} onPress={anteriorMes}>
                <Text style={dp.arrowText}>{"‹"}</Text>
              </TouchableOpacity>
              <Text style={dp.valor}>{MESES_NOMES[mesSel - 1]}</Text>
              <TouchableOpacity style={dp.arrow} onPress={proximoMes}>
                <Text style={dp.arrowText}>{"›"}</Text>
              </TouchableOpacity>
            </View>

            <View style={dp.seletor}>
              <TouchableOpacity style={dp.arrow} onPress={() => setAnoSel((y) => y - 1)}>
                <Text style={dp.arrowText}>{"‹"}</Text>
              </TouchableOpacity>
              <Text style={dp.valor}>{anoSel}</Text>
              <TouchableOpacity style={dp.arrow} onPress={() => setAnoSel((y) => y + 1)}>
                <Text style={dp.arrowText}>{"›"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.modalBtns}>
            <TouchableOpacity style={s.btnCancelar} onPress={handleClose}>
              <Text style={s.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSalvar, loading && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnSalvarText}>Criar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const dp = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  seletor: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  arrow: {
    paddingHorizontal: 8,
  },
  arrowText: {
    fontSize: 22,
    color: GREEN,
    fontWeight: "700",
    lineHeight: 24,
  },
  valor: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK,
    minWidth: 36,
    textAlign: "center",
  },
});

// ─── Tela principal ───────────────────────────────────
export default function Objetivos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  const [pontos, setPontos] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getObjetivos(user.id);
      setObjetivos(Array.isArray(res?.objetivos) ? res.objetivos : []);
      setPontos(res?.pontos ?? null);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os objetivos.");
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

  async function handleCriar(dados: {
    descricao: string;
    valor_alvo: number;
    prazo: number;
    pontos_total: number;
  }) {
    if (!user?.id) return;
    try {
      setSalvando(true);
      await criarObjetivo(user.id, dados);
      setModalVisible(false);
      carregar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível criar o objetivo.");
    } finally {
      setSalvando(false);
    }
  }

  function handleCancelar(objetivoId: number, descricao: string) {
    Alert.alert(
      "Cancelar objetivo",
      `Deseja cancelar "${descricao}"? O saldo alocado será zerado.`,
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelarObjetivo(user!.id, objetivoId);
              carregar();
            } catch (e: any) {
              Alert.alert("Erro", e?.message || "Não foi possível cancelar.");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SwipeTabsWrapper currentTab="Objetivos">
        <View style={s.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SwipeTabsWrapper>
    );
  }

  return (
    <SwipeTabsWrapper currentTab="Objetivos">
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Pontos */}
        {pontos && (
          <View style={s.pontosCard}>
            <Text style={s.pontosTitle}>Pontos</Text>
            <Text style={s.pontoValor}>{pontos.total}</Text>
          </View>
        )}

        {/* Objetivos */}
        <View style={s.secaoHeader}>
          <Text style={s.secaoTitulo}>Meus Objetivos</Text>
          <TouchableOpacity style={s.novoBtn} onPress={() => setModalVisible(true)}>
            <Text style={s.novoBtnText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        {objetivos.length === 0 ? (
          <Text style={s.vazio}>Nenhum objetivo cadastrado ainda.</Text>
        ) : (
          objetivos.map((item) => (
            <CardObjetivo
              key={item.objetivo_id}
              item={item}
              onCancelar={handleCancelar}
            />
          ))
        )}
      </ScrollView>

      <ModalNovoObjetivo
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSalvar={handleCriar}
        loading={salvando}
      />
    </SwipeTabsWrapper>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Pontos
  pontosCard: {
    backgroundColor: DARK,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  pontosTitle: { color: "#aaa", fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 1 },
  pontosRow: { flexDirection: "row", justifyContent: "space-around" },
  pontoItem: { alignItems: "center" },
  pontoValor: { color: GREEN, fontSize: 22, fontWeight: "700" },
  pontoLabel: { color: "#aaa", fontSize: 12, marginTop: 2 },

  // Seção
  secaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  secaoTitulo: { fontSize: 16, fontWeight: "700", color: DARK },
  novoBtn: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  novoBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  cardTitulo: { flex: 1, fontSize: 14, fontWeight: "700", color: DARK },
  badge: {
    backgroundColor: "#d4edda",
    borderColor: GREEN,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#155724" },

  // Barra
  barBg: { height: 8, backgroundColor: BORDER, borderRadius: 4, marginBottom: 4 },
  barFill: { height: 8, backgroundColor: GREEN, borderRadius: 4 },
  pct: { fontSize: 12, fontWeight: "700", marginBottom: 10, textAlign: "right" },

  // Row
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  col: { flex: 1 },
  label: { fontSize: 10, color: GRAY, fontWeight: "600", marginBottom: 2 },
  valor: { fontSize: 13, fontWeight: "700", color: DARK },
  metas: { fontSize: 12, color: GRAY },
  cancelar: { fontSize: 12, color: "#FF3B30", fontWeight: "600" },

  // Vazio
  vazio: { textAlign: "center", color: GRAY, marginTop: 40, fontSize: 14 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: DARK, marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: GRAY, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    marginBottom: 14,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  btnCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnCancelarText: { color: GRAY, fontWeight: "600" },
  btnSalvar: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
