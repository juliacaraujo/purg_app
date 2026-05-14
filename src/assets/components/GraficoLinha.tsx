import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Svg, {
  Path, Defs, LinearGradient, Stop, Line,
  Text as SvgText, Circle, Rect, G,
} from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

interface Ponto {
  data: string;
  valor: number;
}

interface Legendas {
  solido: string;
  tracejado: string;
}

interface Props {
  pontos?: Ponto[];
  cor?: string;
  altura?: number;
  formatarValor?: (v: number) => string;
  titulo?: string;
  mostrarPontos?: boolean;
  suavizar?: boolean;
  // segundo dataset tracejado (opcional)
  pontosTracejados?: Ponto[];
  corTracejada?: string;
  legendas?: Legendas;
}

function abrevia(iso: string): string {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const d = new Date(iso + "T00:00:00");
  return meses[d.getMonth()] ?? iso.slice(5, 7);
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function abreviaEixo(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$${(v / 1_000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

function buildPath(
  valores: number[],
  toX: (i: number) => number,
  toY: (v: number) => number,
  suavizar: boolean,
): string {
  let d = `M ${toX(0)} ${toY(valores[0])}`;
  for (let i = 0; i < valores.length - 1; i++) {
    const x0 = toX(i), y0 = toY(valores[i]);
    const x1 = toX(i + 1), y1 = toY(valores[i + 1]);
    if (suavizar) {
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    } else {
      d += ` L ${x1} ${y1}`;
    }
  }
  return d;
}

export default function GraficoLinha({
  pontos = [],
  cor = "#34C759",
  altura = 160,
  formatarValor,
  titulo,
  mostrarPontos,
  suavizar = true,
  pontosTracejados,
  corTracejada,
  legendas,
}: Props) {
  const { colors } = useTheme();

  const largura = 320;
  const padLeft = 52;
  const padRight = 8;
  const padV = 20;
  const areaW = largura - padLeft - padRight;
  const areaH = altura - padV * 2;

  const corDash = corTracejada ?? colors.textSecondary;

  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null);

  const computedRef = useRef<{
    toX: ((i: number) => number) | null;
    toY: ((v: number) => number) | null;
    valores: number[];
    vMin: number;
    vMax: number;
    nTotal: number;
  }>({ toX: null, toY: null, valores: [], vMin: 0, vMax: 0, nTotal: 0 });

  const { path, fillPath, dashSegments, labelX, yLabels, dots, singleDot } = useMemo(() => {
    const nDash = pontosTracejados?.length ?? 0;
    const empty = { path: "", fillPath: "", dashSegments: [] as { x1: number; y1: number; x2: number; y2: number }[], labelX: [] as { x: number; label: string }[], yLabels: [] as { v: number; y: number }[], dots: [] as { cx: number; cy: number }[], singleDot: null as { cx: number; cy: number } | null };

    if (pontos.length < 1 && nDash < 2) {
      computedRef.current = { toX: null, toY: null, valores: [], vMin: 0, vMax: 0, nTotal: 0 };
      return empty;
    }

    const valores = pontos.map((p) => p.valor);
    const todosValores = [...valores, ...(pontosTracejados ?? []).map((p) => p.valor)];
    const vMin = Math.min(...todosValores);
    const vMax = Math.max(...todosValores);
    const range = vMax - vMin || 1;

    const nTotal = Math.max(pontos.length, nDash);
    const toX = (i: number) => padLeft + (nTotal <= 1 ? 0 : i / (nTotal - 1)) * areaW;
    const toY = (v: number) => padV + areaH - ((v - vMin) / range) * areaH;

    computedRef.current = { toX, toY, valores, vMin, vMax, nTotal };

    // Linha sólida só se tiver >= 2 pontos; caso contrário um único dot
    let path = "";
    let fillPath = "";
    let singleDot: { cx: number; cy: number } | null = null;
    if (pontos.length >= 2) {
      path = buildPath(valores, toX, toY, suavizar);
      fillPath = path + ` L ${toX(pontos.length - 1)} ${padV + areaH} L ${toX(0)} ${padV + areaH} Z`;
    } else if (pontos.length === 1) {
      singleDot = { cx: toX(0), cy: toY(valores[0]) };
    }

    // 1 traço por ponto: centrado em cada ponto, metade do segmento para cada lado
    let dashSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    if (nDash >= 2) {
      const vd = pontosTracejados!.map((p) => p.valor);
      for (let i = 0; i < nDash; i++) {
        const cx = toX(i), cy = toY(vd[i]);
        const f = 2 / 3; // 1.5x menor
        const mx1 = i === 0 ? cx : (toX(i - 1) + cx) / 2;
        const my1 = i === 0 ? cy : (toY(vd[i - 1]) + cy) / 2;
        const mx2 = i === nDash - 1 ? cx : (cx + toX(i + 1)) / 2;
        const my2 = i === nDash - 1 ? cy : (cy + toY(vd[i + 1])) / 2;
        dashSegments.push({
          x1: cx + (mx1 - cx) * f, y1: cy + (my1 - cy) * f,
          x2: cx + (mx2 - cx) * f, y2: cy + (my2 - cy) * f,
        });
      }
    }

    // Labels do eixo X vêm do dataset mais longo (tracejado se disponível)
    const labelSource = nDash >= pontos.length && pontosTracejados ? pontosTracejados : (pontos.length > 0 ? pontos : pontosTracejados!);
    const maxLabels = 5;
    const step = Math.max(1, Math.floor((labelSource.length - 1) / (maxLabels - 1)));
    const indices: number[] = [];
    for (let i = 0; i < labelSource.length; i += step) indices.push(i);
    if (indices[indices.length - 1] !== labelSource.length - 1) indices.push(labelSource.length - 1);
    const labelX = indices.map((i) => ({ x: toX(i), label: abrevia(labelSource[i].data) }));

    const vMid = (vMin + vMax) / 2;
    const yLabels = [
      { v: vMax, y: toY(vMax) },
      { v: vMid, y: toY(vMid) },
      { v: vMin, y: toY(vMin) },
    ];

    const dots = pontos.length >= 2 ? pontos.map((_, i) => ({ cx: toX(i), cy: toY(valores[i]) })) : [];

    return { path, fillPath, dashSegments, labelX, yLabels, dots, singleDot };
  }, [pontos, pontosTracejados, areaW, areaH, suavizar]);

  function getIdxFromX(px: number): number {
    const { toX, nTotal } = computedRef.current;
    if (!toX || nTotal < 2) return 0;
    const relX = px - padLeft;
    const idx = Math.round((relX / areaW) * (nTotal - 1));
    return Math.max(0, Math.min(nTotal - 1, idx));
  }

  function showTooltip(px: number) {
    const { toX, toY, valores, nTotal } = computedRef.current;
    if (!toX || !toY || nTotal < 2) return;
    const idx = getIdxFromX(px);
    const yPos = idx < valores.length
      ? toY(valores[idx])
      : (pontosTracejados && idx < pontosTracejados.length ? toY(pontosTracejados[idx].valor) : padV);
    setTooltip({ idx, x: toX(idx), y: yPos });
  }

  const webHandlers = Platform.OS === "web" ? {
    onMouseMove: (e: any) => {
      const rect = e.currentTarget.getBoundingClientRect();
      showTooltip(e.clientX - rect.left);
    },
    onMouseLeave: () => setTooltip(null),
  } : {};

  const nativeHandlers = Platform.OS !== "web" ? {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: any) => showTooltip(e.nativeEvent.locationX),
    onResponderMove: (e: any) => showTooltip(e.nativeEvent.locationX),
    onResponderRelease: () => setTooltip(null),
    onResponderTerminate: () => setTooltip(null),
  } : {};

  const renderTooltip = () => {
    if (!tooltip || !formatarValor) return null;
    const { idx, x } = tooltip;
    const { toY, valores } = computedRef.current;
    if (!toY) return null;

    const pontoReal = idx < pontos.length ? pontos[idx] : null;
    const pontoProjeto = pontosTracejados && idx < pontosTracejados.length ? pontosTracejados[idx] : null;
    if (!pontoReal && !pontoProjeto) return null;

    const ponto = pontoProjeto ?? pontoReal!;
    const dateLabel = formatDate(ponto.data);

    const linhas: { label: string; valor: string; fill: string }[] = [];
    if (pontoReal) linhas.push({ label: "Realizado", valor: formatarValor(pontoReal.valor), fill: cor });
    if (pontoProjeto) linhas.push({ label: "Projetado", valor: formatarValor(pontoProjeto.valor), fill: "#fff" });

    const yReal = pontoReal ? toY(valores[idx]) : null;
    const yProj = pontoProjeto ? toY(pontoProjeto.valor) : null;
    const yLine = yReal ?? yProj!;

    const TW = 155, TH = 18 + linhas.length * 17;
    const tx = x > largura / 2 ? x - TW - 10 : x + 10;
    const ty = Math.max(padV, Math.min(yLine - TH / 2, padV + areaH - TH));
    return (
      <G>
        <Line x1={x} y1={padV} x2={x} y2={padV + areaH} stroke="#aaa" strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
        {yReal !== null && <><Circle cx={x} cy={yReal} r={6} fill={cor} opacity={0.2} /><Circle cx={x} cy={yReal} r={3.5} fill={cor} /></>}
        {yProj !== null && yProj !== yReal && <><Circle cx={x} cy={yProj} r={5} fill={corDash} opacity={0.2} /><Circle cx={x} cy={yProj} r={3} fill={corDash} /></>}
        <Rect x={tx} y={ty} width={TW} height={TH} rx={7} ry={7} fill="#111" opacity={0.88} />
        <SvgText x={tx + 9} y={ty + 13} fontSize={10} fill="#aaa">{dateLabel}</SvgText>
        {linhas.map(({ label, valor, fill }, i) => (
          <SvgText key={i} x={tx + 9} y={ty + 13 + (i + 1) * 17} fontSize={10} fill={fill} fontWeight="700">{label}: {valor}</SvgText>
        ))}
      </G>
    );
  };

  const axisColor = colors.textTertiary;
  const gridColor = colors.borderLight;

  if (pontos.length < 1 && (!pontosTracejados || pontosTracejados.length < 2)) {
    return (
      <View style={[s.container, { height: altura }]}>
        {titulo ? <Text style={[s.titulo, { color: colors.textPrimary }]}>{titulo}</Text> : null}
        <Text style={[s.vazio, { color: colors.textTertiary }]}>Dados insuficientes para o gráfico.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {titulo ? <Text style={[s.titulo, { color: colors.textPrimary }]}>{titulo}</Text> : null}
      <View {...nativeHandlers} style={{ alignSelf: "center" }}>
        <Svg width={largura} height={altura + 20} {...webHandlers}>
          <Defs>
            <LinearGradient id={`grad${cor.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={cor} stopOpacity="0.25" />
              <Stop offset="1" stopColor={cor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Linhas de grade horizontais */}
          {yLabels.map(({ y }, i) => (
            <Line key={i} x1={padLeft} y1={y} x2={largura - padRight} y2={y}
              stroke={gridColor} strokeWidth={1} strokeDasharray="3,4" />
          ))}

          {/* Fill e linha sólida (realizado) */}
          <Path d={fillPath} fill={`url(#grad${cor.replace("#","")})`} />
          <Path d={path} stroke={cor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Segmentos tracejados (projetado) — 1 traço por intervalo entre pontos */}
          {dashSegments.map(({ x1, y1, x2, y2 }, i) => {
            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            return (
              <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={corDash} strokeWidth={2} strokeLinecap="round"
                strokeDasharray={`${Math.max(1, len - 6)} 999`}
                opacity={0.75}
              />
            );
          })}

          {/* Pontos permanentes (só no dataset sólido) */}
          {mostrarPontos && dots.map(({ cx, cy }, i) => (
            <Circle key={i} cx={cx} cy={cy} r={3.5} fill={cor} />
          ))}

          {/* Dot único quando realizado tem apenas 1 ponto */}
          {singleDot && (
            <>
              <Circle cx={singleDot.cx} cy={singleDot.cy} r={6} fill={cor} opacity={0.2} />
              <Circle cx={singleDot.cx} cy={singleDot.cy} r={3.5} fill={cor} />
            </>
          )}

          {/* Eixo Y */}
          {yLabels.map(({ v, y }, i) => (
            <SvgText key={i} x={padLeft - 4} y={y + 4} fontSize={9} fill={axisColor} textAnchor="end">
              {abreviaEixo(v)}
            </SvgText>
          ))}

          {/* Eixo X */}
          {labelX.map(({ x, label }, i) => (
            <SvgText key={i} x={x} y={altura + 14} fontSize={10} fill={axisColor} textAnchor="middle">
              {label}
            </SvgText>
          ))}

          {renderTooltip()}
        </Svg>
      </View>

      {/* Legenda */}
      {legendas && (
        <View style={s.legendaRow}>
          <View style={s.legendaItem}>
            <View style={[s.legendaLinhaSolida, { backgroundColor: cor }]} />
            <Text style={[s.legendaLabel, { color: colors.textTertiary }]}>{legendas.solido}</Text>
          </View>
          <View style={s.legendaItem}>
            <Svg width={20} height={4} style={{ marginRight: 5 }}>
              <Line x1={0} y1={2} x2={20} y2={2} stroke={corDash} strokeWidth={2} strokeDasharray="5,3" opacity={0.75} />
            </Svg>
            <Text style={[s.legendaLabel, { color: colors.textTertiary }]}>{legendas.tracejado}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingVertical: 8 },
  titulo: { fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  vazio: { fontSize: 12, textAlign: "center", marginTop: 16 },
  legendaRow: { flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 6 },
  legendaItem: { flexDirection: "row", alignItems: "center" },
  legendaLinhaSolida: { width: 18, height: 2.5, borderRadius: 2, marginRight: 5 },
  legendaLabel: { fontSize: 10 },
});
