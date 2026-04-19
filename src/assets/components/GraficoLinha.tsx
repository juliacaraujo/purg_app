import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Line, Text as SvgText } from "react-native-svg";

interface Ponto {
  data: string;    // "2026-01-01"
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
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                  "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const d = new Date(iso + "T00:00:00");
  return meses[d.getMonth()] ?? iso.slice(5, 7);
}

export default function GraficoLinha({
  pontos,
  cor = "#34C759",
  altura = 160,
  formatarValor,
  titulo,
}: Props) {
  const largura = 320;
  const padH = 8;   // horizontal padding
  const padV = 20;  // vertical padding
  const areaW = largura - padH * 2;
  const areaH = altura - padV * 2;

  const { path, fillPath, labelX } = useMemo(() => {
    if (!pontos || pontos.length < 2) return { path: "", fillPath: "", labelX: [] };

    const valores = pontos.map((p) => p.valor);
    const vMin = Math.min(...valores);
    const vMax = Math.max(...valores);
    const range = vMax - vMin || 1;

    const toX = (i: number) => padH + (i / (pontos.length - 1)) * areaW;
    const toY = (v: number) => padV + areaH - ((v - vMin) / range) * areaH;

    // Bezier suavizado (Catmull–Rom simplificado via pontos de controle)
    let d = `M ${toX(0)} ${toY(valores[0])}`;
    for (let i = 0; i < valores.length - 1; i++) {
      const x0 = toX(i), y0 = toY(valores[i]);
      const x1 = toX(i + 1), y1 = toY(valores[i + 1]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }

    const fill =
      d +
      ` L ${toX(pontos.length - 1)} ${padV + areaH}` +
      ` L ${toX(0)} ${padV + areaH} Z`;

    // Rótulos do eixo X: até 5 labels igualmente espaçados
    const maxLabels = 5;
    const step = Math.max(1, Math.floor((pontos.length - 1) / (maxLabels - 1)));
    const indices = [];
    for (let i = 0; i < pontos.length; i += step) indices.push(i);
    if (indices[indices.length - 1] !== pontos.length - 1) indices.push(pontos.length - 1);

    const labelX = indices.map((i) => ({ x: toX(i), label: abrevia(pontos[i].data) }));

    return { path: d, fillPath: fill, labelX };
  }, [pontos, areaW, areaH]);

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
      <Svg width={largura} height={altura + 20} style={{ alignSelf: "center" }}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={cor} stopOpacity="0.25" />
            <Stop offset="1" stopColor={cor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Área preenchida */}
        <Path d={fillPath} fill="url(#grad)" />

        {/* Linha principal */}
        <Path d={path} stroke={cor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Labels do eixo X */}
        {labelX.map(({ x, label }, i) => (
          <SvgText
            key={i}
            x={x}
            y={altura + 14}
            fontSize={10}
            fill="#888"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>

      {/* Valor máximo e mínimo */}
      {formatarValor && pontos.length > 0 && (
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
  container: {
    paddingVertical: 8,
  },
  titulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  vazio: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    marginTop: 16,
  },
  extremos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 8,
  },
  extremoTexto: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
  },
});
