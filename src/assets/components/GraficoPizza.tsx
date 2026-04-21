import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";

export interface FatiaPizza {
  label: string;
  valor: number;
  cor: string;
}

interface Props {
  fatias: FatiaPizza[];
  tamanho?: number;
}

export default function GraficoPizza({ fatias, tamanho = 160 }: Props) {
  const slices = useMemo(() => {
    const total = fatias.reduce((s, f) => s + f.valor, 0);
    if (total === 0) return [];
    let angle = -Math.PI / 2;
    return fatias.map((f) => {
      const pct = f.valor / total;
      const startAngle = angle;
      angle += pct * 2 * Math.PI;
      const midAngle = (startAngle + angle) / 2;
      return { ...f, startAngle, endAngle: angle, midAngle, pct };
    });
  }, [fatias]);

  const r = tamanho / 2 - 4;
  const cx = tamanho / 2;
  const cy = tamanho / 2;

  const describeArc = (startAngle: number, endAngle: number) => {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  if (slices.length === 0) return null;

  return (
    <View>
      <Text style={s.titulo}>DIVERSIFICAÇÃO DOS RISCOS</Text>
      <View style={s.row}>
        <Svg width={tamanho} height={tamanho}>
          {slices.length === 1 ? (
            <>
              <Circle cx={cx} cy={cy} r={r} fill={slices[0].cor} />
              <SvgText x={cx} y={cy + 5} fontSize={13} fontWeight="700" fill="#fff" textAnchor="middle">
                100%
              </SvgText>
            </>
          ) : (
            slices.map((sl, i) => (
              <React.Fragment key={i}>
                <Path d={describeArc(sl.startAngle, sl.endAngle)} fill={sl.cor} />
                {sl.pct >= 0.08 && (
                  <SvgText
                    x={cx + r * 0.62 * Math.cos(sl.midAngle)}
                    y={cy + r * 0.62 * Math.sin(sl.midAngle) + 4}
                    fontSize={11} fontWeight="700" fill="#fff" textAnchor="middle"
                  >
                    {(sl.pct * 100).toFixed(0)}%
                  </SvgText>
                )}
              </React.Fragment>
            ))
          )}
        </Svg>

        <View style={s.tabela}>
          <View style={s.tabelaHeader}>
            <Text style={s.tabelaHeaderTexto}>RISCOS</Text>
            <Text style={s.tabelaHeaderPct}>%</Text>
          </View>
          <View style={s.tabelaSeparador} />
          {slices.map((sl, i) => (
            <View key={i} style={s.tabelaLinha}>
              <View style={[s.dot, { backgroundColor: sl.cor }]} />
              <Text style={s.tabelaLabel}>{sl.label}</Text>
              <Text style={[s.tabelaPct, { color: sl.cor }]}>
                {(sl.pct * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  tabela: { paddingLeft: 16 },
  tabelaHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 4 },
  tabelaHeaderTexto: { fontSize: 11, fontWeight: "700", color: "#aaa", marginRight: 10, letterSpacing: 0.6 },
  tabelaHeaderPct: { fontSize: 11, fontWeight: "700", color: "#aaa", width: 36, textAlign: "right", letterSpacing: 0.6 },
  tabelaSeparador: { height: 1, backgroundColor: "#e0e0e0", marginBottom: 6 },
  tabelaLinha: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  tabelaLabel: { fontSize: 13, color: "#666", marginRight: 10 },
  tabelaPct: { fontSize: 13, fontWeight: "700", width: 36, textAlign: "right" },
});
