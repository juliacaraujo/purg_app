import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

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
  agrupamento?: "ultimo" | "soma";
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function abreviaMes(iso: string): string {
  const idx = parseInt(iso.slice(5, 7), 10) - 1;
  return MESES[idx] ?? iso.slice(5, 7);
}

function abreviaEixo(v: number, vMax: number): string {
  if (v === 0) return "R$0";
  if (Math.abs(vMax) >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(vMax) >= 1_000) return `R$${(v / 1_000).toFixed(1)}k`;
  if (Math.abs(vMax) >= 1)  return `R$${v.toFixed(2)}`;
  if (Math.abs(vMax) >= 0.01) return `R$${v.toFixed(4)}`;
  return `R$${v.toFixed(6)}`;
}

function agruparPorMes(
  pontos: Ponto[],
  modo: "ultimo" | "soma",
): { mes: string; label: string; valor: number }[] {
  const grupos: Record<string, number[]> = {};
  for (const p of pontos) {
    const chave = p.data.slice(0, 7);
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(p.valor);
  }
  return Object.entries(grupos)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vals]) => ({
      mes,
      label: abreviaMes(mes),
      valor: modo === "soma" ? vals.reduce((s, v) => s + v, 0) : vals[vals.length - 1],
    }));
}

export default function GraficoBarras({
  pontos,
  cor = "#34C759",
  altura = 160,
  formatarValor,
  titulo,
  agrupamento = "ultimo",
}: Props) {
  const { colors } = useTheme();
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  const largura = 320;
  const padLeft = 52;
  const padRight = 8;
  const padTop = 20;
  const padBottomLabel = 20;
  const areaW = largura - padLeft - padRight;
  const areaH = altura - padTop;
  const svgH = altura + padBottomLabel;

  const dados = useMemo(
    () => agruparPorMes(pontos ?? [], agrupamento),
    [pontos, agrupamento],
  );

  const { barras, yLabels, slotW, vMax } = useMemo(() => {
    if (dados.length === 0) return { barras: [], yLabels: [], slotW: 0, vMax: 0 };

    const valores = dados.map(d => d.valor);
    const vMax = Math.max(...valores) || 1;
    const toBarY = (v: number) => padTop + areaH - (v / vMax) * areaH;
    const toBarH = (v: number) => (v / vMax) * areaH;

    const sw = areaW / dados.length;
    const barW = Math.min(sw * 0.65, 32);

    const barras = dados.map((d, i) => ({
      x: padLeft + i * sw + (sw - barW) / 2,
      y: toBarY(d.valor),
      h: Math.max(toBarH(d.valor), 2),
      w: barW,
      label: d.label,
      valor: d.valor,
      cx: padLeft + i * sw + sw / 2,
    }));

    const yLabels = [
      { v: vMax,     y: toBarY(vMax) },
      { v: vMax / 2, y: toBarY(vMax / 2) },
      { v: 0,        y: toBarY(0) },
    ];

    return { barras, yLabels, slotW: sw, vMax };
  }, [dados, areaW, areaH]);

  const axisColor = colors.textTertiary;
  const gridColor = colors.borderLight;

  const hitTest = (px: number): number | null => {
    if (!barras.length || slotW === 0) return null;
    if (px < padLeft || px > largura - padRight) return null;
    const idx = Math.floor((px - padLeft) / slotW);
    return Math.max(0, Math.min(barras.length - 1, idx));
  };

  const webHandlers = Platform.OS === "web" ? {
    onMouseMove: (e: any) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipIdx(hitTest(e.clientX - rect.left));
    },
    onMouseLeave: () => setTooltipIdx(null),
  } : {};

  const nativeHandlers = Platform.OS !== "web" ? {
    onStartShouldSetResponder: () => true,
    onResponderGrant: (e: any) => setTooltipIdx(hitTest(e.nativeEvent.locationX)),
    onResponderMove: (e: any) => setTooltipIdx(hitTest(e.nativeEvent.locationX)),
    onResponderRelease: () => setTooltipIdx(null),
    onResponderTerminate: () => setTooltipIdx(null),
  } : {};

  const renderTooltip = () => {
    if (tooltipIdx === null || !formatarValor) return null;
    const b = barras[tooltipIdx];
    if (!b) return null;
    const TW = 130, TH = 38;
    const tx = b.cx > largura / 2 ? b.cx - TW - 8 : b.cx + 8;
    const ty = Math.max(padTop, b.y - TH - 6);
    return (
      <G>
        <Rect x={tx} y={ty} width={TW} height={TH} rx={7} ry={7} fill="#111" opacity={0.88} />
        <SvgText x={tx + 9} y={ty + 14} fontSize={10} fill="#aaa">{b.label}</SvgText>
        <SvgText x={tx + 9} y={ty + 29} fontSize={11} fill="#fff" fontWeight="700">
          {formatarValor(b.valor)}
        </SvgText>
      </G>
    );
  };

  if (!pontos || pontos.length === 0) {
    return (
      <View style={[s.container, { minHeight: altura }]}>
        {titulo && <Text style={[s.titulo, { color: colors.textPrimary }]}>{titulo}</Text>}
        <Text style={[s.vazio, { color: colors.textTertiary }]}>Dados insuficientes para o gráfico.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {titulo && <Text style={[s.titulo, { color: colors.textPrimary }]}>{titulo}</Text>}
      <View style={{ alignSelf: "center" }} {...nativeHandlers}>
        <Svg width={largura} height={svgH} {...webHandlers}>
          {/* Grade horizontal */}
          {yLabels.map(({ y }, i) => (
            <Line key={i} x1={padLeft} y1={y} x2={largura - padRight} y2={y}
              stroke={gridColor} strokeWidth={1} strokeDasharray="3,4" />
          ))}

          {/* Labels eixo Y */}
          {yLabels.map(({ v, y }, i) => (
            <SvgText key={i} x={padLeft - 4} y={y + 4} fontSize={9} fill={axisColor} textAnchor="end">
              {abreviaEixo(v, vMax)}
            </SvgText>
          ))}

          {/* Barras + labels eixo X */}
          {barras.map((b, i) => (
            <G key={i}>
              <Rect
                x={b.x} y={b.y} width={b.w} height={b.h}
                rx={3} ry={3}
                fill={cor}
                opacity={tooltipIdx === i ? 1 : 0.75}
              />
              <SvgText x={b.cx} y={svgH - 4} fontSize={9} fill={axisColor} textAnchor="middle">
                {b.label}
              </SvgText>
            </G>
          ))}

          {renderTooltip()}
        </Svg>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingVertical: 8 },
  titulo: { fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  vazio: { fontSize: 12, textAlign: "center", marginTop: 16 },
});
