import React from "react";
import { View } from "react-native";
import Svg, { Path, Polygon, Circle, G } from "react-native-svg";

export const LIGA_CORES: Record<string, { bg: string; text: string }> = {
  Cobre:     { bg: "#B87333", text: "#fff" },
  Bronze:    { bg: "#CD7F32", text: "#fff" },
  Prata:     { bg: "#9E9E9E", text: "#fff" },
  Ouro:      { bg: "#F0C040", text: "#333" },
  Platina:   { bg: "#78909C", text: "#fff" },
  Ametista:  { bg: "#8E44AD", text: "#fff" },
  Safira:    { bg: "#1565C0", text: "#fff" },
  Esmeralda: { bg: "#2E7D32", text: "#fff" },
  Rubi:      { bg: "#C0392B", text: "#fff" },
  Diamante:  { bg: "#29B6F6", text: "#fff" },
};

export function getLigaCores(liga: string | null): { bg: string; text: string } | null {
  if (!liga) return null;
  const metal = liga.split(" ")[0];
  return LIGA_CORES[metal] ?? null;
}

export const FRAME_CFG: Record<string, {
  cor: string; borderWidth: number; shadowRadius: number;
  shadowOpacity: number; elevation: number;
  cornerTipo: "basico" | "medio" | "avancado" | "supremo";
  topOrnament: boolean;
}> = {
  Cobre:     { cor: "#B87333", borderWidth: 2, shadowRadius: 5,  shadowOpacity: 0.30, elevation: 3, cornerTipo: "basico",   topOrnament: false },
  Bronze:    { cor: "#CD7F32", borderWidth: 2, shadowRadius: 6,  shadowOpacity: 0.35, elevation: 3, cornerTipo: "basico",   topOrnament: false },
  Prata:     { cor: "#9E9E9E", borderWidth: 2, shadowRadius: 7,  shadowOpacity: 0.40, elevation: 4, cornerTipo: "medio",    topOrnament: false },
  Ouro:      { cor: "#F0C040", borderWidth: 2, shadowRadius: 10, shadowOpacity: 0.50, elevation: 5, cornerTipo: "medio",    topOrnament: true  },
  Platina:   { cor: "#78909C", borderWidth: 2, shadowRadius: 11, shadowOpacity: 0.45, elevation: 5, cornerTipo: "avancado", topOrnament: true  },
  Ametista:  { cor: "#8E44AD", borderWidth: 2, shadowRadius: 13, shadowOpacity: 0.55, elevation: 6, cornerTipo: "avancado", topOrnament: true  },
  Safira:    { cor: "#1565C0", borderWidth: 3, shadowRadius: 14, shadowOpacity: 0.60, elevation: 7, cornerTipo: "supremo",  topOrnament: true  },
  Esmeralda: { cor: "#2E7D32", borderWidth: 3, shadowRadius: 14, shadowOpacity: 0.60, elevation: 7, cornerTipo: "supremo",  topOrnament: true  },
  Rubi:      { cor: "#C0392B", borderWidth: 3, shadowRadius: 16, shadowOpacity: 0.65, elevation: 8, cornerTipo: "supremo",  topOrnament: true  },
  Diamante:  { cor: "#29B6F6", borderWidth: 3, shadowRadius: 18, shadowOpacity: 0.70, elevation: 9, cornerTipo: "supremo",  topOrnament: true  },
};

const SZ = 44;

function renderCornerPaths(tipo: string, cor: string): React.ReactNode {
  const c2 = cor + "AA";
  const c3 = cor + "55";

  if (tipo === "basico") {
    return (
      <>
        <Path d={`M 3,${SZ - 2} L 3,3 L ${SZ - 2},3`} stroke={cor} strokeWidth={2.5} fill="none" strokeLinecap="square" />
        <Polygon points="3,0 7,3 3,7 0,3" fill={cor} />
      </>
    );
  }
  if (tipo === "medio") {
    return (
      <>
        <Path d={`M 3,${SZ - 2} L 3,3 L ${SZ - 2},3`} stroke={cor} strokeWidth={2.5} fill="none" strokeLinecap="square" />
        <Path d={`M 9,${SZ - 2} L 9,9 L ${SZ - 2},9`} stroke={c2} strokeWidth={1.5} fill="none" strokeLinecap="square" />
        <Polygon points="3,0 8,3 3,8 0,3" fill={cor} />
        <Path d="M 3,22 L 8,22" stroke={cor} strokeWidth={1.5} fill="none" />
        <Path d="M 22,3 L 22,8" stroke={cor} strokeWidth={1.5} fill="none" />
      </>
    );
  }
  if (tipo === "avancado") {
    return (
      <>
        <Path d={`M 3,${SZ - 2} L 3,3 L ${SZ - 2},3`} stroke={cor} strokeWidth={3} fill="none" strokeLinecap="square" />
        <Path d={`M 9,${SZ - 2} L 9,9 L ${SZ - 2},9`} stroke={c2} strokeWidth={2} fill="none" strokeLinecap="square" />
        <Path d={`M 14,${SZ - 2} L 14,14 L ${SZ - 2},14`} stroke={c3} strokeWidth={1} fill="none" strokeLinecap="square" />
        <Polygon points="3,0 9,5 9,11 3,14 0,9" fill={cor} />
        <Polygon points="0,20 6,24 0,28" fill={cor} opacity={0.9} />
        <Polygon points="20,0 24,6 28,0" fill={cor} opacity={0.9} />
      </>
    );
  }
  const c4 = cor + "33";
  return (
    <>
      <Path d={`M 2,${SZ - 2} L 2,2 L ${SZ - 2},2`} stroke={cor} strokeWidth={3.5} fill="none" strokeLinecap="square" />
      <Path d={`M 8,${SZ - 2} L 8,8 L ${SZ - 2},8`} stroke={c2} strokeWidth={2} fill="none" strokeLinecap="square" />
      <Path d={`M 13,${SZ - 2} L 13,13 L ${SZ - 2},13`} stroke={c3} strokeWidth={1.5} fill="none" strokeLinecap="square" />
      <Path d={`M 18,${SZ - 2} L 18,18 L ${SZ - 2},18`} stroke={c4} strokeWidth={1} fill="none" strokeLinecap="square" />
      <Polygon points="2,0 9,3 12,9 9,14 2,16 0,10" fill={cor} />
      <Polygon points="0,20 7,24 0,28" fill={cor} />
      <Polygon points="0,30 6,33 0,36" fill={cor} opacity={0.75} />
      <Polygon points="20,0 24,7 28,0" fill={cor} />
      <Polygon points="30,0 33,6 36,0" fill={cor} opacity={0.75} />
      <Path d={`M 4,${SZ - 2} L 4,4 L ${SZ - 2},4`} stroke={cor} strokeWidth={0.75} fill="none" opacity={0.5} />
    </>
  );
}

function CornerSVG({ tipo, cor, flipH, flipV }: { tipo: string; cor: string; flipH?: boolean; flipV?: boolean }) {
  const transform = flipH && flipV
    ? `scale(-1,-1) translate(-${SZ},-${SZ})`
    : flipH
    ? `scale(-1,1) translate(-${SZ},0)`
    : flipV
    ? `scale(1,-1) translate(0,-${SZ})`
    : undefined;
  return (
    <Svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
      {transform ? (
        <G transform={transform}>{renderCornerPaths(tipo, cor)}</G>
      ) : (
        renderCornerPaths(tipo, cor)
      )}
    </Svg>
  );
}

export function TopCenterOrnament({ tipo, cor }: { tipo: string; cor: string }) {
  const c2 = cor + "CC";
  if (tipo === "medio") {
    return (
      <Svg width={44} height={18} viewBox="0 0 44 18">
        <Polygon points="22,2 8,17 16,13 22,16 28,13 36,17" fill={cor} opacity={0.9} />
      </Svg>
    );
  }
  if (tipo === "avancado") {
    return (
      <Svg width={52} height={22} viewBox="0 0 52 22">
        <Polygon points="26,2 8,21 16,16 22,20 26,18 30,20 36,16 44,21" fill={cor} opacity={0.9} />
        <Circle cx={26} cy={5} r={3} fill={cor} />
      </Svg>
    );
  }
  return (
    <Svg width={60} height={26} viewBox="0 0 60 26">
      <Polygon points="30,2 6,25 15,19 21,23 30,21 39,23 45,19 54,25" fill={cor} />
      <Circle cx={30} cy={6} r={4} fill={c2} />
      <Circle cx={18} cy={14} r={2} fill={c2} opacity={0.8} />
      <Circle cx={42} cy={14} r={2} fill={c2} opacity={0.8} />
    </Svg>
  );
}

export function MolduraLiga({ ligaNome, bg, children }: { ligaNome: string | null; bg: string; children: React.ReactNode }) {
  const metal = ligaNome?.split(" ")[0] ?? "";
  const cfg = FRAME_CFG[metal];

  const cardStyle: any = {
    backgroundColor: bg,
    borderRadius: 12,
    padding: 16,
    paddingTop: cfg?.topOrnament ? 8 : 16,
    marginBottom: 16,
    borderWidth: cfg?.borderWidth ?? 1,
    borderColor: cfg?.cor ?? "transparent",
    shadowColor: cfg?.cor ?? "#000",
    shadowOpacity: cfg?.shadowOpacity ?? 0.1,
    shadowRadius: cfg?.shadowRadius ?? 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: cfg?.elevation ?? 2,
    overflow: "hidden" as const,
  };

  if (!cfg) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <View style={cardStyle}>
      {cfg.topOrnament && (
        <View style={{ alignItems: "center", marginBottom: 8 }} pointerEvents="none">
          <TopCenterOrnament tipo={cfg.cornerTipo} cor={cfg.cor} />
        </View>
      )}
      <View style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
        <CornerSVG tipo={cfg.cornerTipo} cor={cfg.cor} />
      </View>
      <View style={{ position: "absolute", top: 0, right: 0 }} pointerEvents="none">
        <CornerSVG tipo={cfg.cornerTipo} cor={cfg.cor} flipH />
      </View>
      <View style={{ position: "absolute", bottom: 0, left: 0 }} pointerEvents="none">
        <CornerSVG tipo={cfg.cornerTipo} cor={cfg.cor} flipV />
      </View>
      <View style={{ position: "absolute", bottom: 0, right: 0 }} pointerEvents="none">
        <CornerSVG tipo={cfg.cornerTipo} cor={cfg.cor} flipH flipV />
      </View>
      {children}
    </View>
  );
}
