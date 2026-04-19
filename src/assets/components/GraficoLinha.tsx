import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Svg, {
  Path, Defs, LinearGradient, Stop, Line,
  Text as SvgText, Circle, Rect, G,
} from "react-native-svg";

interface Ponto {
  data: string;
  valor: number;
}

interface Props {
  pontos: Ponto[];
  cor?: string;
  altura?: number;
  formatarValor?: (v: number) => string;
  titulo?: string;
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

export default function GraficoLinha({ pontos, cor = "#34C759", altura = 160, formatarValor, titulo }: Props) {
  const largura = 320;
  const padH = 8;
  const padV = 20;
  const areaW = largura - padH * 2;
  const areaH = altura - padV * 2;

  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null);

  // Refs so PanResponder can read latest computed values without stale closures
  const computedRef = useRef<{
    toX: ((i: number) => number) | null;
    toY: ((v: number) => number) | null;
    valores: number[];
  }>({ toX: null, toY: null, valores: [] });

  const { path, fillPath, labelX } = useMemo(() => {
    if (!pontos || pontos.length < 2) {
      computedRef.current = { toX: null, toY: null, valores: [] };
      return { path: "", fillPath: "", labelX: [] };
    }

    const valores = pontos.map((p) => p.valor);
    const vMin = Math.min(...valores);
    const vMax = Math.max(...valores);
    const range = vMax - vMin || 1;

    const toX = (i: number) => padH + (i / (pontos.length - 1)) * areaW;
    const toY = (v: number) => padV + areaH - ((v - vMin) / range) * areaH;

    computedRef.current = { toX, toY, valores };

    let d = `M ${toX(0)} ${toY(valores[0])}`;
    for (let i = 0; i < valores.length - 1; i++) {
      const x0 = toX(i), y0 = toY(valores[i]);
      const x1 = toX(i + 1), y1 = toY(valores[i + 1]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }

    const fill = d
      + ` L ${toX(pontos.length - 1)} ${padV + areaH}`
      + ` L ${toX(0)} ${padV + areaH} Z`;

    const maxLabels = 5;
    const step = Math.max(1, Math.floor((pontos.length - 1) / (maxLabels - 1)));
    const indices: number[] = [];
    for (let i = 0; i < pontos.length; i += step) indices.push(i);
    if (indices[indices.length - 1] !== pontos.length - 1) indices.push(pontos.length - 1);
    const labelX = indices.map((i) => ({ x: toX(i), label: abrevia(pontos[i].data) }));

    return { path: d, fillPath: fill, labelX };
  }, [pontos, areaW, areaH]);

  function getIdxFromX(px: number): number {
    const { toX, valores } = computedRef.current;
    if (!toX || valores.length < 2) return 0;
    const relX = px - padH;
    const idx = Math.round((relX / areaW) * (valores.length - 1));
    return Math.max(0, Math.min(valores.length - 1, idx));
  }

  function showTooltip(px: number) {
    const { toX, toY, valores } = computedRef.current;
    if (!toX || !toY || valores.length < 2) return;
    const idx = getIdxFromX(px);
    setTooltip({ idx, x: toX(idx), y: toY(valores[idx]) });
  }

  // Web mouse handlers applied to SVG element
  const webHandlers = Platform.OS === "web" ? {
    onMouseMove: (e: any) => {
      const rect = e.currentTarget.getBoundingClientRect();
      showTooltip(e.clientX - rect.left);
    },
    onMouseLeave: () => setTooltip(null),
  } : {};

  // Native touch handlers on the wrapping View
  const nativeHandlers = Platform.OS !== "web" ? {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: any) => showTooltip(e.nativeEvent.locationX),
    onResponderMove: (e: any) => showTooltip(e.nativeEvent.locationX),
    onResponderRelease: () => setTooltip(null),
    onResponderTerminate: () => setTooltip(null),
  } : {};

  const renderTooltip = () => {
    if (!tooltip || !formatarValor || !pontos[tooltip.idx]) return null;
    const { idx, x, y } = tooltip;
    const ponto = pontos[idx];
    const dateLabel = formatDate(ponto.data);
    const valLabel = formatarValor(ponto.valor);
    const TW = 130, TH = 38;
    const tx = x > largura / 2 ? x - TW - 10 : x + 10;
    const ty = Math.max(padV, Math.min(y - TH / 2, padV + areaH - TH));

    return (
      <G>
        <Line x1={x} y1={padV} x2={x} y2={padV + areaH} stroke={cor} strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
        <Circle cx={x} cy={y} r={6} fill={cor} opacity={0.2} />
        <Circle cx={x} cy={y} r={3.5} fill={cor} />
        <Rect x={tx} y={ty} width={TW} height={TH} rx={7} ry={7} fill="#111" opacity={0.88} />
        <SvgText x={tx + 9} y={ty + 14} fontSize={10} fill="#aaa">{dateLabel}</SvgText>
        <SvgText x={tx + 9} y={ty + 29} fontSize={11} fill="#fff" fontWeight="700">{valLabel}</SvgText>
      </G>
    );
  };

  if (!pontos || pontos.length < 2) {
    return (
      <View style={[s.container, { height: altura }]}>
        {titulo ? <Text style={s.titulo}>{titulo}</Text> : null}
        <Text style={s.vazio}>Dados insuficientes para o gráfico.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {titulo ? <Text style={s.titulo}>{titulo}</Text> : null}
      <View {...nativeHandlers} style={{ alignSelf: "center" }}>
        <Svg width={largura} height={altura + 20} {...webHandlers}>
          <Defs>
            <LinearGradient id={`grad${cor.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={cor} stopOpacity="0.25" />
              <Stop offset="1" stopColor={cor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Path d={fillPath} fill={`url(#grad${cor.replace("#","")})`} />
          <Path d={path} stroke={cor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {labelX.map(({ x, label }, i) => (
            <SvgText key={i} x={x} y={altura + 14} fontSize={10} fill="#888" textAnchor="middle">
              {label}
            </SvgText>
          ))}

          {renderTooltip()}
        </Svg>
      </View>

      {!tooltip && formatarValor && pontos.length > 0 && (
        <View style={s.extremos}>
          <Text style={[s.extremoTexto, { color: cor }]}>
            ▲ {formatarValor(Math.max(...pontos.map((p) => p.valor)))}
          </Text>
          <Text style={s.extremoTexto}>
            ▼ {formatarValor(Math.min(...pontos.map((p) => p.valor)))}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingVertical: 8 },
  titulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  vazio: { fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 16 },
  extremos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 8,
  },
  extremoTexto: { fontSize: 11, color: "#888", fontWeight: "600" },
});
