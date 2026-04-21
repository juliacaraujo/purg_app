import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";

export interface FatiaPizza {
  label: string;
  valor: number;
  cor: string;
  rendDiario?: number;
}

interface Props {
  fatias: FatiaPizza[];
  tamanho?: number;
}

const fmtRend = (v: number) => {
  if (v === 0) return "R$ 0,00";
  if (v >= 0.01) return `R$ ${v.toFixed(2).replace(".", ",")}`;
  return `R$ ${v.toFixed(8).replace(".", ",")}`;
};

export default function GraficoPizza({ fatias, tamanho = 220 }: Props) {
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

  const slicesOrdenados = useMemo(
    () => [...slices].sort((a, b) => b.pct - a.pct),
    [slices]
  );

  const temRendDiario = fatias.some((f) => f.rendDiario !== undefined);

  const r = tamanho / 2 - 6;
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

      <View style={s.pizzaContainer}>
        <Svg width={tamanho} height={tamanho}>
          {slices.length === 1 ? (
            <>
              <Circle cx={cx} cy={cy} r={r} fill={slices[0].cor} />
              <SvgText x={cx} y={cy - 6} fontSize={13} fontWeight="700" fill="#fff" textAnchor="middle">
                {slices[0].label}
              </SvgText>
              <SvgText x={cx} y={cy + 12} fontSize={15} fontWeight="700" fill="#fff" textAnchor="middle">
                100,00%
              </SvgText>
            </>
          ) : (
            slices.map((sl, i) => {
              const lx = cx + r * 0.62 * Math.cos(sl.midAngle);
              const ly = cy + r * 0.62 * Math.sin(sl.midAngle);
              return (
                <React.Fragment key={i}>
                  <Path d={describeArc(sl.startAngle, sl.endAngle)} fill={sl.cor} />
                  {sl.pct >= 0.12 && (
                    <>
                      <SvgText x={lx} y={ly - 6} fontSize={11} fontWeight="700" fill="#fff" textAnchor="middle">
                        {sl.label}
                      </SvgText>
                      <SvgText x={lx} y={ly + 9} fontSize={12} fontWeight="700" fill="#fff" textAnchor="middle">
                        {(sl.pct * 100).toFixed(2)}%
                      </SvgText>
                    </>
                  )}
                  {sl.pct >= 0.05 && sl.pct < 0.12 && (
                    <SvgText x={lx} y={ly + 5} fontSize={11} fontWeight="700" fill="#fff" textAnchor="middle">
                      {(sl.pct * 100).toFixed(2)}%
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })
          )}
        </Svg>
      </View>

      <View style={s.tabela}>
        <View style={s.tabelaHeader}>
          <View style={s.dot} />
          <Text style={s.tabelaHeaderLabel}>RISCOS</Text>
          <Text style={s.tabelaHeaderCol}>PART. (%)</Text>
          {temRendDiario && <Text style={s.tabelaHeaderCol}>REND. DIÁRIO</Text>}
        </View>
        <View style={s.tabelaSeparador} />
        {slicesOrdenados.map((sl, i) => (
          <View key={i} style={s.tabelaLinha}>
            <View style={[s.dot, { backgroundColor: sl.cor }]} />
            <Text style={s.tabelaLabel}>{sl.label}</Text>
            <Text style={[s.tabelaCol, { color: sl.cor }]}>
              {(sl.pct * 100).toFixed(2)}%
            </Text>
            {temRendDiario && (
              <Text style={[s.tabelaCol, { color: sl.cor }]}>
                {fmtRend(sl.rendDiario ?? 0)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const COL_WIDTH = 110;

const s = StyleSheet.create({
  titulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  pizzaContainer: { alignItems: "center", marginBottom: 12 },
  tabela: {},
  tabelaHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 4 },
  tabelaHeaderLabel: { flex: 1, fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 0.6 },
  tabelaHeaderCol: { width: COL_WIDTH, fontSize: 11, fontWeight: "700", color: "#aaa", textAlign: "right", letterSpacing: 0.6 },
  tabelaSeparador: { height: 1, backgroundColor: "#e0e0e0", marginBottom: 4 },
  tabelaLinha: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  tabelaLabel: { flex: 1, fontSize: 13, color: "#666" },
  tabelaCol: { width: COL_WIDTH, fontSize: 12, fontWeight: "700", textAlign: "right" },
});
