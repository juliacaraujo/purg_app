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
import { getObjetivos, getObjetivoDetalhe, getLigas, criarObjetivo, cancelarObjetivo, getProjecaoPatrimonio, getProjecaoRendimento } from "../../../services/api";
import type { ObjetivoItem, MetaDetalhe, PontosInfo, LigaItem, ProjecaoItem } from "../../../types";
import GraficoLinha from "../../components/GraficoLinha";
import { MolduraLiga, getLigaCores } from "../../components/MolduraLiga";

function moeda(v: any) {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

const MESES_ABR = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function formatDataLimite(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const mes = MESES_ABR[d.getUTCMonth()];
  const aa = String(d.getUTCFullYear()).slice(2);
  return `${mes}/${aa}`;
}

function calcIntervalo(total: number): number {
  if (total <= 10) return 1;
  if (total <= 20) return 2;
  if (total <= 30) return 3;
  if (total <= 60) return 6;
  return 12;
}

function SegmentedBar({ completas, total, cor, bgColor, metas }: { completas: number; total: number; cor: string; bgColor: string; metas?: MetaDetalhe[] }) {
  const n = Math.max(1, total);
  const intervalo = calcIntervalo(n);
  return (
    <View style={s.segRow}>
      {Array.from({ length: n }).map((_, i) => {
        const mostraData = i === 0 || i % intervalo === 0;
        const dataLabel = i === 0 ? "aporte" : mostraData && metas?.[i]?.data_limite ? formatDataLimite(metas[i].data_limite) : "";
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View
              style={[
                s.segItem,
                { backgroundColor: i < completas ? cor : bgColor },
                i === 0 && s.segFirst,
                i === n - 1 && s.segLast,
              ]}
            />
            {dataLabel ? <Text style={s.segData}>{dataLabel}</Text> : <Text style={s.segData}>{" "}</Text>}
          </View>
        );
      })}
    </View>
  );
}

function CardObjetivo({ item, metas, onCancelar, colors }: {
  item: ObjetivoItem;
  metas?: MetaDetalhe[];
  onCancelar: (id: number, desc: string) => void;
  colors: ReturnType<typeof import("../../../context/ThemeContext").useTheme>["colors"];
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const total = Number(item.metas_total) || 0;
  const pct = total > 0 ? Math.min(100, (item.metas_completas / total) * 100) : 0;
  const valorAlvo = Number(item.valor_alvo) || 0;
  const saldo = Number(item.saldo_alocado_total) || 0;
  const pctFinanceiro = valorAlvo > 0 ? Math.min(100, (saldo / valorAlvo) * 100) : 0;
  const cor = item.objetivo_completo ? colors.primary : pct > 50 ? "#007AFF" : colors.textPrimary;
  const corFin = item.objetivo_completo ? colors.primary : pctFinanceiro > 50 ? "#007AFF" : colors.textPrimary;

  return (
    <View style={[s.card, { backgroundColor: colors.card }]}>
      <View style={s.cardHeader}>
        {!item.is_patrimonio && (
          <Text style={[s.cardTitulo, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.objetivo_descricao}
          </Text>
        )}
        {item.is_patrimonio && (
          <View style={{ flex: 1 }}>
            <View style={[s.badge, { backgroundColor: "#fff3cd", borderColor: "#ffc107", alignSelf: "flex-start" }]}>
              <Text style={[s.badgeText, { color: "#856404" }]}>{item.objetivo_descricao}</Text>
            </View>
          </View>
        )}
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[s.label, { color: colors.textTertiary }]}>Meta</Text>
          <Text style={[s.valor, { color: colors.textPrimary }]}>{moeda(item.valor_alvo)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
          <Text style={[s.label, { color: colors.textTertiary }]}>Prazo</Text>
          <Text style={[s.valor, { color: colors.textPrimary }]}>
            {metas && metas.length > 0 ? formatDataLimite(metas[metas.length - 1].data_limite) : "—"}
          </Text>
        </View>
      </View>

      <View style={s.secaoBloco}>
        <View style={s.secaoBlocoHeader}>
          <Text style={[s.barLabel, { color: colors.textSecondary }]}>Progressão Financeira</Text>
          <Text style={[s.pct, { color: corFin, marginBottom: 0 }]}>{pctFinanceiro.toFixed(2)}%</Text>
        </View>
        <View style={[s.barBg, { backgroundColor: colors.border }]}>
          <View style={[s.barFill, { width: `${pctFinanceiro}%` as any, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[s.metas, { color: colors.textTertiary, marginTop: 6 }]}>Alocado: {moeda(item.saldo_alocado_total)}</Text>
      </View>

      <View style={[s.separador, { backgroundColor: colors.borderLight }]} />

      <View style={s.secaoBloco}>
        <View style={s.secaoBlocoHeader}>
          <Text style={[s.barLabel, { color: colors.textSecondary }]}>Progressão das Metas</Text>
          <Text style={[s.pct, { color: cor, marginBottom: 0 }]}>{pct.toFixed(2)}%</Text>
        </View>
        <SegmentedBar completas={item.metas_completas} total={item.metas_total} cor={colors.primary} bgColor={colors.border} metas={metas} />
      </View>

      <View style={[s.separador, { backgroundColor: colors.borderLight }]} />
      <View style={s.rodapeRow}>
        <View style={s.rodapeCol}>
          <Text style={[s.label, { color: colors.textTertiary }]}>Metas</Text>
          <Text style={[s.metas, { color: colors.textPrimary }]}>{item.metas_completas}/{item.metas_total}</Text>
        </View>
        {metas && metas.length > 0 && (
          <>
            <View style={[s.rodapeDivisor, { backgroundColor: colors.border }]} />
            <View style={s.rodapeCol}>
              <Text style={[s.label, { color: colors.textTertiary }]}>Aporte</Text>
              <Text style={[s.metas, { color: colors.textPrimary }]}>{moeda(metas[0].valor_alvo)}</Text>
            </View>
            <View style={[s.rodapeDivisor, { backgroundColor: colors.border }]} />
            <View style={s.rodapeCol}>
              <Text style={[s.label, { color: colors.textTertiary }]}>Parcela</Text>
              <Text style={[s.metas, { color: colors.textPrimary }]}>{moeda(metas.length > 1 ? metas[1].valor_alvo : metas[0].valor_alvo)}</Text>
            </View>
          </>
        )}
        {!item.is_patrimonio && !item.objetivo_completo && (
          <TouchableOpacity style={{ marginLeft: "auto" as any }} onPress={() => onCancelar(item.objetivo_id, item.objetivo_descricao)}>
            <Text style={s.cancelar}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      {metas && metas.length > 0 && (() => {
        const pontosPorMeta = metas[0].pontos;
        const valorParcela = metas.length > 1 ? metas[1].valor_alvo : metas[0].valor_alvo;
        const pontosPorReal = valorParcela > 0
          ? (pontosPorMeta / valorParcela).toFixed(2)
          : "—";
        return (
          <>
            <View style={[s.separador, { backgroundColor: colors.borderLight }]} />
            <View style={s.rodapeRow}>
              <View style={s.rodapeCol}>
                <Text style={[s.label, { color: colors.textTertiary }]}>Pontos por meta</Text>
                <Text style={[s.metas, { color: colors.textPrimary }]}>{pontosPorMeta} pontos</Text>
              </View>
              <View style={[s.rodapeDivisor, { backgroundColor: colors.border }]} />
              <View style={[s.rodapeCol, { position: "relative" }]}>
                <Text style={[s.label, { color: colors.textTertiary }]}>Pontos a cada R$ 1,00</Text>
                <Text style={[s.metas, { color: colors.textPrimary }]}>{pontosPorReal} pontos</Text>
                <TouchableOpacity
                  onPress={() => setTooltipVisible((v) => !v)}
                  style={[s.tooltipBtn, { borderColor: colors.textTertiary, position: "absolute", top: 0, right: 0 }]}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={[s.tooltipBtnText, { color: colors.textTertiary }]}>?</Text>
                </TouchableOpacity>
              </View>
            </View>
            {tooltipVisible && (
              <View style={[s.tooltip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Text style={[s.tooltipText, { color: colors.textSecondary }]}>
                  Esse valor é considerado para as metas após o aporte, o aporte dá uma pontuação fixa de 40 pontos.
                </Text>
              </View>
            )}
          </>
        );
      })()}
    </View>
  );
}

const MESES_NOMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function calcMeses(ano: number, mes: number): number {
  const now = new Date();
  const meses = (ano - now.getFullYear()) * 12 + (mes - (now.getMonth() + 1));
  return Math.max(1, meses);
}

function formatarMoeda(text: string): string {
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  return "R$ " + parseInt(digits, 10).toLocaleString("pt-BR");
}

function parseMoeda(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ""), 10) || 0;
}

function ModalNovoObjetivo({ visible, onClose, onSalvar, loading, colors }: {
  visible: boolean; onClose: () => void;
  onSalvar: (dados: { descricao: string; valor_alvo: number; aporte_inicial: number; prazo: number; pontos_total: number }) => void;
  loading: boolean;
  colors: ReturnType<typeof import("../../../context/ThemeContext").useTheme>["colors"];
}) {
  const agora = new Date();
  const [valorAlvo, setValorAlvo] = useState("");
  const [aporteInicial, setAporteInicial] = useState("");
  const [mesSel, setMesSel] = useState(agora.getMonth() + 1);
  const [anoSel, setAnoSel] = useState(agora.getFullYear() + 1);

  const valorNum = parseMoeda(valorAlvo);
  const aporteNum = parseMoeda(aporteInicial);
  const canSave = valorNum >= 200 && aporteNum > 0 && calcMeses(anoSel, mesSel) >= 1;
  const valorInvalido = valorAlvo !== "" && valorNum < 200;

  function limpar() {
    setValorAlvo(""); setAporteInicial("");
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
    const valor = parseMoeda(valorAlvo);
    const aporte = parseMoeda(aporteInicial);
    if (!valor || valor < 200) { Alert.alert("Atenção", "O valor alvo deve ser de no mínimo R$ 200,00."); return; }
    if (!aporte || aporte <= 0) { Alert.alert("Atenção", "Informe um aporte inicial válido."); return; }
    const meses = calcMeses(anoSel, mesSel);
    if (meses < 1) { Alert.alert("Atenção", "A data alvo deve ser no futuro."); return; }
    onSalvar({ descricao: "Patrimônio", valor_alvo: valor, aporte_inicial: aporte, prazo: meses, pontos_total: meses * 40 });
  }

  function handleClose() { limpar(); onClose(); }

  const prazoLabel = `${calcMeses(anoSel, mesSel)} meses`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <Text style={[s.modalTitulo, { color: colors.textPrimary }]}>Novo Objetivo</Text>

          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Descrição</Text>
          <View style={[s.input, s.inputFixo, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
            <Text style={{ fontSize: 15, color: colors.textPrimary }}>Patrimônio</Text>
          </View>

          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Valor alvo (R$)</Text>
          <TextInput
            style={[s.input, { borderColor: valorInvalido ? "#FF3B30" : colors.border, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary, marginBottom: 4 }]}
            placeholder="R$ 5.000"
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
            value={valorAlvo}
            onChangeText={(t) => setValorAlvo(formatarMoeda(t))}
          />
          <Text style={[s.inputHint, { color: valorInvalido ? "#FF3B30" : colors.textTertiary }]}>
            Mínimo R$ 200,00
          </Text>

          <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Aporte Inicial (R$)</Text>
          <TextInput
            style={[s.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }]}
            placeholder="R$ 1.000"
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
            value={aporteInicial}
            onChangeText={(t) => setAporteInicial(formatarMoeda(t))}
          />

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

          {(() => {
            const valor = parseMoeda(valorAlvo);
            const aporte = parseMoeda(aporteInicial);
            const meses = calcMeses(anoSel, mesSel);
            const restante = valor - aporte;
            const parcela = restante > 0 && meses > 0 ? restante / meses : null;
            return (
              <>
                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Parcela mensal prevista</Text>
                <View style={[s.input, s.inputFixo, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={{ fontSize: 15, color: parcela !== null ? colors.textPrimary : colors.textTertiary }}>
                    {parcela !== null ? moeda(parcela) : "—"}
                  </Text>
                </View>
              </>
            );
          })()}

          <View style={s.modalBtns}>
            <TouchableOpacity style={[s.btnCancelar, { borderColor: colors.border }]} onPress={handleClose}>
              <Text style={[s.btnCancelarText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnSalvar, { backgroundColor: colors.primary }, (!canSave || loading) && { opacity: 0.4 }]} onPress={handleSalvar} disabled={!canSave || loading}>
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
  const [metasDetalhe, setMetasDetalhe] = useState<Record<number, MetaDetalhe[]>>({});
  const [pontos, setPontos] = useState<PontosInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tooltipNovoVisible, setTooltipNovoVisible] = useState(false);
  const [ligas, setLigas] = useState<LigaItem[]>([]);
  const [projecaoPatrimonio, setProjecaoPatrimonio] = useState<ProjecaoItem[]>([]);
  const [projecaoRendimento, setProjecaoRendimento] = useState<ProjecaoItem[]>([]);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [res, ligasRes] = await Promise.allSettled([
        getObjetivos(user.id),
        getLigas(),
      ]);
      if (res.status === "fulfilled") {
        const lista = Array.isArray(res.value?.objetivos) ? res.value.objetivos : [];
        setObjetivos(lista);
        setPontos(res.value?.pontos ?? null);
        const detalhes = await Promise.allSettled(
          lista.map((o) => getObjetivoDetalhe(user.id, o.objetivo_id))
        );
        const mapaDetalhe: Record<number, MetaDetalhe[]> = {};
        lista.forEach((o, i) => {
          const d = detalhes[i];
          if (d.status === "fulfilled") mapaDetalhe[o.objetivo_id] = d.value.metas;
        });
        setMetasDetalhe(mapaDetalhe);
      }

      if (ligasRes.status === "fulfilled") {
        setLigas(ligasRes.value);
      }

      const [projPatRes, projRendRes] = await Promise.allSettled([
        getProjecaoPatrimonio(user.id),
        getProjecaoRendimento(user.id),
      ]);
      if (projPatRes.status === "fulfilled") setProjecaoPatrimonio(projPatRes.value);
      if (projRendRes.status === "fulfilled") setProjecaoRendimento(projRendRes.value);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os objetivos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);


  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  async function handleCriar(dados: { descricao: string; valor_alvo: number; aporte_inicial: number; prazo: number; pontos_total: number }) {
    if (!user?.id) return;
    try {
      setSalvando(true);
      await criarObjetivo(user.id, dados);
      setModalVisible(false);
      await carregar();
      Alert.alert("Sucesso", "Objetivo criado com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível criar o objetivo.");
    } finally { setSalvando(false); }
  }

  function handleCancelar(objetivoId: number, descricao: string) {
    Alert.alert("Cancelar objetivo", `Deseja cancelar "${descricao}"? O saldo alocado será zerado.`, [
      { text: "Não", style: "cancel" },
      { text: "Sim, cancelar", style: "destructive", onPress: async () => {
        try { await cancelarObjetivo(user!.id, objetivoId); carregar(); Alert.alert("Sucesso", "Objetivo cancelado com sucesso."); }
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
        <View style={[s.secaoHeader, { marginBottom: 12, marginTop: 8 }]}>
          <Text style={[s.secaoTitulo, { color: colors.textPrimary }]}>Liga</Text>
        </View>

        {pontos && (() => {
          const total = pontos.total;
          const ligasDesc = ligas;
          const idxAtual = ligasDesc.findIndex((l) => total >= l.pontuacao_minima);
          const ligaAtual = idxAtual >= 0 ? ligasDesc[idxAtual] : null;
          const proximaLiga = idxAtual > 0 ? ligasDesc[idxAtual - 1] : null;
          const pctLiga = ligaAtual && proximaLiga
            ? Math.min(100, ((total - ligaAtual.pontuacao_minima) / (proximaLiga.pontuacao_minima - ligaAtual.pontuacao_minima)) * 100)
            : 100;
          const faltam = proximaLiga ? proximaLiga.pontuacao_minima - total : 0;
          const ligaCores = getLigaCores(ligaAtual?.nome ?? null);
          const proxCores = getLigaCores(proximaLiga?.nome ?? null);
          return (
            <MolduraLiga ligaNome={ligaAtual?.nome ?? null} bg={colors.card}>
              {/* Linha superior: "faltam X pts" à esquerda, tag próxima liga à direita */}

              {/* "Faltam X pontos" à esquerda e % à direita, acima da barra */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                {proximaLiga ? (
                  <Text style={[s.metas, { color: colors.textTertiary }]}>Faltam {faltam} pontos para {proximaLiga.nome}</Text>
                ) : (
                  <Text style={[s.metas, { color: colors.textTertiary }]}>Liga máxima atingida!</Text>
                )}
                <Text style={[s.pct, { color: ligaCores?.bg ?? colors.primary, marginBottom: 0 }]}>{pctLiga.toFixed(2)}%</Text>
              </View>

              {/* Barra de progressão */}
              <View style={[s.barBg, { backgroundColor: colors.border }]}>
                <View style={[s.barFill, { width: `${pctLiga}%` as any, backgroundColor: ligaCores?.bg ?? colors.primary }]} />
              </View>

              {/* Linha inferior: Pontos | Liga Atual | Próxima Liga */}
              <View style={[s.rodapeRow, { marginTop: 8 }]}>
                <View style={s.rodapeCol}>
                  <Text style={[s.label, { color: colors.textTertiary }]}>Pontos</Text>
                  <Text style={[s.pontoValor, { color: colors.primary }]}>{total}</Text>
                </View>
                {ligaCores && ligaAtual && (
                  <>
                    <View style={[s.rodapeDivisor, { backgroundColor: colors.border }]} />
                    <View style={s.rodapeCol}>
                      <Text style={[s.label, { color: colors.textTertiary }]}>Liga Atual</Text>
                      <View style={{ backgroundColor: ligaCores.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: ligaCores.text }}>{ligaAtual.nome}</Text>
                      </View>
                    </View>
                  </>
                )}
                {proxCores && proximaLiga && (
                  <>
                    <View style={[s.rodapeDivisor, { backgroundColor: colors.border }]} />
                    <View style={s.rodapeCol}>
                      <Text style={[s.label, { color: colors.textTertiary }]}>Próxima</Text>
                      <View style={{ backgroundColor: proxCores.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: proxCores.text }}>{proximaLiga.nome}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </MolduraLiga>
          );
        })()}

        <View style={s.secaoHeader}>
          <Text style={[s.secaoTitulo, { color: colors.textPrimary }]}>Meus Objetivos</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[s.novoBtn, { backgroundColor: colors.primary }, objetivos.some((o) => !o.objetivo_completo) && { opacity: 0.4 }]}
              onPress={() => setModalVisible(true)}
              disabled={objetivos.some((o) => !o.objetivo_completo)}
            >
              <Text style={s.novoBtnText}>Novo Objetivo</Text>
            </TouchableOpacity>
            {objetivos.some((o) => !o.objetivo_completo) && (
              <TouchableOpacity
                onPress={() => setTooltipNovoVisible((v) => !v)}
                style={[s.tooltipBtn, { borderColor: colors.textTertiary }]}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={[s.tooltipBtnText, { color: colors.textTertiary }]}>?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {tooltipNovoVisible && objetivos.some((o) => !o.objetivo_completo) && (
          <View style={[s.tooltip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginBottom: 12 }]}>
            <Text style={[s.tooltipText, { color: colors.textSecondary }]}>
              Atualmente só é permitido ter 1 meta ativa por usuário.
            </Text>
          </View>
        )}

        {objetivos.length === 0 ? (
          <Text style={[s.vazio, { color: colors.textTertiary }]}>Nenhum objetivo cadastrado ainda.</Text>
        ) : (
          objetivos.map((item) => (
            <CardObjetivo key={item.objetivo_id} item={item} metas={metasDetalhe[item.objetivo_id]} onCancelar={handleCancelar} colors={colors} />
          ))
        )}

        {(projecaoPatrimonio.length >= 2 || projecaoRendimento.length >= 2) && (
          <>
            <View style={[s.secaoHeader, { marginTop: 8 }]}>
              <Text style={[s.secaoTitulo, { color: colors.textPrimary }]}>Projeção</Text>
            </View>

            {projecaoPatrimonio.length >= 2 && (
              <View style={[s.card, { backgroundColor: colors.card }]}>
                <GraficoLinha
                  titulo="PATRIMÔNIO PROJETADO"
                  pontos={projecaoPatrimonio.map((p) => ({ data: p.mes + "-01", valor: p.valor }))}
                  cor="#4BC0C0"
                  altura={160}
                  mostrarPontos
                  suavizar={false}
                  formatarValor={(v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              </View>
            )}

            {projecaoRendimento.length >= 2 && (
              <View style={[s.card, { backgroundColor: colors.card }]}>
                <GraficoLinha
                  titulo="RENDIMENTO MENSAL PROJETADO"
                  pontos={projecaoRendimento.map((p) => ({ data: p.mes + "-01", valor: p.valor }))}
                  cor="#A0D47C"
                  altura={160}
                  mostrarPontos
                  suavizar={false}
                  formatarValor={(v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
                />
              </View>
            )}
          </>
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
  pontosCard: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16 },
  pontosTitle: { color: "#aaa", fontSize: 11, fontWeight: "600", marginBottom: 2, letterSpacing: 1 },
  pontoValor: { fontSize: 18, fontWeight: "700" },
  secaoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  secaoTitulo: { fontSize: 16, fontWeight: "700" },
  novoBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  novoBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  cardTitulo: { flex: 1, fontSize: 14, fontWeight: "700" },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#155724" },
  rodapeRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 0 },
  rodapeCol: { alignItems: "center", flex: 1 },
  rodapeDivisor: { width: 1, height: 28, backgroundColor: "#e0e0e0" },
  secaoBloco: { marginTop: 14 },
  secaoBlocoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  separador: { height: 1, backgroundColor: "#e8e8e8", marginTop: 14 },
  barLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  barBg: { height: 8, backgroundColor: "#e0e0e0", borderRadius: 4, marginBottom: 6 },
  barFill: { height: 8, borderRadius: 4 },
  segRow: { flexDirection: "row", gap: 3, marginBottom: 6 },
  segItem: { width: "100%", height: 8 },
  segData: { fontSize: 8, marginTop: 2, color: "#999", textAlign: "center" },
  segFirst: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  segLast: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  pct: { fontSize: 12, fontWeight: "700", marginBottom: 2, textAlign: "right" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  col: { flex: 1 },
  label: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
  valor: { fontSize: 13, fontWeight: "700" },
  metas: { fontSize: 11 },
  cancelar: { fontSize: 12, color: "#FF3B30", fontWeight: "600" },
  tooltip: { marginTop: 10, borderWidth: 1, borderRadius: 10, padding: 10 },
  tooltipText: { fontSize: 12, lineHeight: 17 },
  tooltipBtn: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tooltipBtnText: { fontSize: 9, fontWeight: "700", lineHeight: 11 },
  vazio: { textAlign: "center", marginTop: 40, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitulo: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14 },
  inputFixo: { justifyContent: "center" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  btnCancelar: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnCancelarText: { fontWeight: "600" },
  btnSalvar: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  inputHint: { fontSize: 11, marginBottom: 10 },
});
