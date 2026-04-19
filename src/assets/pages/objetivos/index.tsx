import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTheme } from "../../../context/ThemeContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { getObjetivos, criarObjetivo, cancelarObjetivo, getCarteira } from "../../../services/api";
import type { ObjetivoItem, PontosInfo } from "../../../types";

const LIGA_CORES: Record<string, { bg: string; text: string }> = {
  "Cobre":     { bg: "#B87333", text: "#fff" },
  "Bronze":    { bg: "#CD7F32", text: "#fff" },
  "Prata":     { bg: "#9E9E9E", text: "#fff" },
  "Ouro":      { bg: "#F0C040", text: "#333" },
  "Platina":   { bg: "#78909C", text: "#fff" },
  "Ametista":  { bg: "#8E44AD", text: "#fff" },
  "Safira":    { bg: "#1565C0", text: "#fff" },
  "Esmeralda": { bg: "#2E7D32", text: "#fff" },
  "Rubi":      { bg: "#C0392B", text: "#fff" },
  "Diamante":  { bg: "#29B6F6", text: "#fff" },
};

function getLigaCores(liga: string | null): { bg: string; text: string } | null {
  if (!liga) return null;
  const metal = liga.split(" ")[0];
  return LIGA_CORES[metal] ?? null;
}

function moeda(v: any) {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function ProgressBar({ percent, cor }: { percent: number; cor: string }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <View style={s.barBg}>
      <View style={[s.barFill, { width: `${p}%` as any, backgroundColor: cor }]} />
    </View>
  );
}

function CardObjetivo({ item, onCancelar, colors }: {
  item: ObjetivoItem;
  onCancelar: (id: number, desc: string) => void;
  colors: ReturnType<typeof import("../../../context/ThemeContext").useTheme>["colors"];
}) {
  const pct = Number(item.percentual_geral) || 0;
  const cor = item.objetivo_completo ? colors.primary : pct > 50 ? "#007AFF" : colors.textPrimary;

  return (
    <View style={[s.card, { backgroundColor: colors.card }]}>
      <View style={s.cardHeader}>
        <Text style={[s.cardTitulo, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.descricao}
        </Text>
        {item.objetivo_completo && (
          <View style={[s.badge, { backgroundColor: "#d4edda", borderColor: colors.primary }]}>
            <Text style={s.badgeText}>Concluído</Text>
          </View>
        )}
        {item.is_patrimonio && (
          <View style={[s.badge, { backgroundColor: "#fff3cd", borderColor: "#ffc107" }]}>
            <Text style={[s.badgeText, { color: "#856404" }]}>Patrimônio</Text>
          </View>
        )}
      </View>

      <ProgressBar percent={pct} cor={colors.primary} />
      <Text style={[s.pct, { color: cor }]}>{pct.toFixed(0)}%</Text>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={[s.label, { color: colors.textTertiary }]}>Meta</Text>
          <Text style={[s.valor, { color: colors.textPrimary }]}>{moeda(item.valor_alvo)}</Text>
        </View>
        <View style={s.col}>
          <Text style={[s.label, { color: colors.textTertiary }]}>Acumulado</Text>
          <Text style={[s.valor, { color: colors.textPrimary }]}>{moeda(item.saldo_alocado_total)}</Text>
        </View>
        <View style={s.col}>
          <Text style={[s.label, { color: colors.textTertiary }]}>Prazo</Text>
          <Text style={[s.valor, { color: colors.textPrimary }]}>{item.prazo_total} meses</Text>
        </View>
      </View>

      <View style={s.row}>
        <Text style={[s.metas, { color: colors.textTertiary }]}>
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

function ModalNovoObjetivo({ visible, onClose, onSalvar, loading, colors }: {
  visible: boolean; onClose: () => void;
  onSalvar: (dados: { descricao: string; valor_alvo: number; prazo: number; pontos_total: number }) => void;
  loading: boolean;
  colors: ReturnType<typeof import("../../../context/ThemeContext").useTheme>["colors"];
}) {
  const agora = new Date();
  const [descricao, setDescricao] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [mesSel, setMesSel] = useState(agora.getMonth() + 1);
  const [anoSel, setAnoSel] = useState(agora.getFullYear() + 1);

  function limpar() {
    setDescricao(""); setValorAlvo("");
    setMesSel(new Date().getMonth() + 1);
    setAnoSel(new Date().getFullYear() + 1);
  }

  function anteriorMes() {
    if (mesSel === 1) { setMesSel(12); setAnoSel((y) => y - 1); } else setMesSel((m) => m - 1);
  }
  function proximoMes() {
    if (mesSel === 12) { setMesSel(1); setAnoSel((y) => y + 1); } else setMesSel((m) => m + 1);
  }

  function handleSalvar() {
    const valor = Number(valorAlvo.replace(",", "."));
    if (!descricao.trim()) { Alert.alert("Atenção", "Informe uma descrição."); return; }
    if (!valor || valor <= 0) { Alert.alert("Atenção", "Informe um valor alvo válido."); return; }
    const meses = calcMeses(anoSel, mesSel);
    if (meses < 1) { Alert.alert("Atenção", "A data alvo deve ser no futuro."); return; }
    onSalvar({ descricao: descricao.trim(), valor_alvo: valor, prazo: meses, pontos_total: meses * 40 });
  }

  function handleClose() { limpar(); onClose(); }

  const prazoLabel = `${calcMeses(anoSel, mesSel)} meses`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <Text style={[s.modalTitulo, { color: colors.textPrimary }]}>Novo Objetivo</Text>

          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Descrição</Text>
          <TextInput style={[s.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }]} placeholder="Ex: Comprar um carro" placeholderTextColor="#bbb" value={descricao} onChangeText={setDescricao} />

          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Valor alvo (R$)</Text>
          <TextInput style={[s.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }]} placeholder="Ex: 15000" placeholderTextColor="#bbb" keyboardType="decimal-pad" value={valorAlvo} onChangeText={setValorAlvo} />

          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Prazo — {prazoLabel}</Text>
          <View style={dp.row}>
            <View style={[dp.seletor, { borderColor: colors.border }]}>
              <TouchableOpacity style={dp.arrow} onPress={anteriorMes}><Text style={[dp.arrowText, { color: colors.primary }]}>{"‹"}</Text></TouchableOpacity>
              <Text style={[dp.valor, { color: colors.textPrimary }]}>{MESES_NOMES[mesSel - 1]}</Text>
              <TouchableOpacity style={dp.arrow} onPress={proximoMes}><Text style={[dp.arrowText, { color: colors.primary }]}>{"›"}</Text></TouchableOpacity>
            </View>
            <View style={[dp.seletor, { borderColor: colors.border }]}>
              <TouchableOpacity style={dp.arrow} onPress={() => setAnoSel((y) => y - 1)}><Text style={[dp.arrowText, { color: colors.primary }]}>{"‹"}</Text></TouchableOpacity>
              <Text style={[dp.valor, { color: colors.textPrimary }]}>{anoSel}</Text>
              <TouchableOpacity style={dp.arrow} onPress={() => setAnoSel((y) => y + 1)}><Text style={[dp.arrowText, { color: colors.primary }]}>{"›"}</Text></TouchableOpacity>
            </View>
          </View>

          <View style={s.modalBtns}>
            <TouchableOpacity style={[s.btnCancelar, { borderColor: colors.border }]} onPress={handleClose}>
              <Text style={[s.btnCancelarText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnSalvar, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]} onPress={handleSalvar} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnSalvarText}>Criar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Objetivos() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [objetivos, setObjetivos] = useState<ObjetivoItem[]>([]);
  const [pontos, setPontos] = useState<PontosInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [liga, setLiga] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [res, cart] = await Promise.allSettled([
        getObjetivos(user.id),
        getCarteira(user.id),
      ]);
      if (res.status === "fulfilled") {
        setObjetivos(Array.isArray(res.value?.objetivos) ? res.value.objetivos : []);
        setPontos(res.value?.pontos ?? null);
      }
      if (cart.status === "fulfilled") {
        setLiga(cart.value?.liga ?? null);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os objetivos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);


  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  async function handleCriar(dados: { descricao: string; valor_alvo: number; prazo: number; pontos_total: number }) {
    if (!user?.id) return;
    try {
      setSalvando(true);
      await criarObjetivo(user.id, dados);
      setModalVisible(false);
      carregar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível criar o objetivo.");
    } finally { setSalvando(false); }
  }

  function handleCancelar(objetivoId: number, descricao: string) {
    Alert.alert("Cancelar objetivo", `Deseja cancelar "${descricao}"? O saldo alocado será zerado.`, [
      { text: "Não", style: "cancel" },
      { text: "Sim, cancelar", style: "destructive", onPress: async () => {
        try { await cancelarObjetivo(user!.id, objetivoId); carregar(); }
        catch (e: any) { Alert.alert("Erro", e?.message || "Não foi possível cancelar."); }
      }},
    ]);
  }

  const containerStyle = useMemo(() => ({ flex: 1, backgroundColor: colors.backgroundSecondary }), [colors]);

  if (loading) {
    return (
      <SwipeTabsWrapper currentTab="Objetivos">
        <View style={[s.center, containerStyle]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SwipeTabsWrapper>
    );
  }

  return (
    <SwipeTabsWrapper currentTab="Objetivos">
      <ScrollView
        style={containerStyle}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 16 }}>
          <Text style={[s.tituloPagina, { marginTop: 0, marginBottom: 0, color: colors.textPrimary }]}>Objetivos</Text>
          {(() => {
            const ligaCores = getLigaCores(liga);
            return ligaCores ? (
              <View style={{ backgroundColor: ligaCores.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: ligaCores.text }}>{liga}</Text>
              </View>
            ) : null;
          })()}
        </View>

        {pontos && (
          <View style={[s.pontosCard, { backgroundColor: colors.heroCard }]}>
            <Text style={s.pontosTitle}>Pontos</Text>
            <Text style={[s.pontoValor, { color: colors.primary }]}>{pontos.total}</Text>
          </View>
        )}

        <View style={s.secaoHeader}>
          <Text style={[s.secaoTitulo, { color: colors.textPrimary }]}>Meus Objetivos</Text>
          <TouchableOpacity style={[s.novoBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
            <Text style={s.novoBtnText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        {objetivos.length === 0 ? (
          <Text style={[s.vazio, { color: colors.textTertiary }]}>Nenhum objetivo cadastrado ainda.</Text>
        ) : (
          objetivos.map((item) => (
            <CardObjetivo key={item.objetivo_id} item={item} onCancelar={handleCancelar} colors={colors} />
          ))
        )}
      </ScrollView>

      <ModalNovoObjetivo
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSalvar={handleCriar}
        loading={salvando}
        colors={colors}
      />
    </SwipeTabsWrapper>
  );
}

const dp = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 14 },
  seletor: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 10 },
  arrow: { paddingHorizontal: 8 },
  arrowText: { fontSize: 22, fontWeight: "700", lineHeight: 24 },
  valor: { fontSize: 15, fontWeight: "700", minWidth: 36, textAlign: "center" },
});

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tituloPagina: { fontSize: 22, fontWeight: "bold", marginTop: 20, marginBottom: 16 },
  pontosCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  pontosTitle: { color: "#aaa", fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 1 },
  pontoValor: { fontSize: 22, fontWeight: "700" },
  secaoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  secaoTitulo: { fontSize: 16, fontWeight: "700" },
  novoBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  novoBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  cardTitulo: { flex: 1, fontSize: 14, fontWeight: "700" },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#155724" },
  barBg: { height: 8, backgroundColor: "#e8e8e8", borderRadius: 4, marginBottom: 4 },
  barFill: { height: 8, borderRadius: 4 },
  pct: { fontSize: 12, fontWeight: "700", marginBottom: 10, textAlign: "right" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  col: { flex: 1 },
  label: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
  valor: { fontSize: 13, fontWeight: "700" },
  metas: { fontSize: 12 },
  cancelar: { fontSize: 12, color: "#FF3B30", fontWeight: "600" },
  vazio: { textAlign: "center", marginTop: 40, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitulo: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  btnCancelar: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnCancelarText: { fontWeight: "600" },
  btnSalvar: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
