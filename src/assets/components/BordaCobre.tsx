import React from "react";
import { View, Image } from "react-native";
import Svg, { Path, Polygon, G } from "react-native-svg";

const BADGE = 44;
const SZ    = 44;   // tamanho do canto SVG

function CornerBasico({ cor, flipH, flipV }: { cor: string; flipH?: boolean; flipV?: boolean }) {
  const transform = flipH && flipV
    ? `scale(-1,-1) translate(-${SZ},-${SZ})`
    : flipH  ? `scale(-1,1) translate(-${SZ},0)`
    : flipV  ? `scale(1,-1) translate(0,-${SZ})`
    : undefined;

  const shape = (
    <>
      <Path
        d={`M 3,${SZ - 2} L 3,3 L ${SZ - 2},3`}
        stroke={cor} strokeWidth={2.5} fill="none" strokeLinecap="square"
      />
      <Polygon points="3,0 7,3 3,7 0,3" fill={cor} />
    </>
  );

  return (
    <Svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
      {transform ? <G transform={transform}>{shape}</G> : shape}
    </Svg>
  );
}

const defaultInsignia = require("../../../assets/bordas/borda_insignia_cobre.png");

export function BordaCobre({
  children,
  bg,
  color    = "#CC7347",
  insignia = defaultInsignia,
}: {
  children: React.ReactNode;
  bg: string;
  color?: string;
  insignia?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      {/* Cartão com borda de linha */}
      <View style={{
        backgroundColor: bg,
        borderRadius: 10,
        marginTop: BADGE / 2,
        paddingTop: BADGE / 2 + 8,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderWidth: 4,
        borderColor: color,
        shadowColor: color,
        shadowOpacity: 0.30,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
        elevation: 3,
      }}>
        <View style={{ position: "absolute", top: 0, left: 0  }} pointerEvents="none"><CornerBasico cor={color} /></View>
        <View style={{ position: "absolute", top: 0, right: 0 }} pointerEvents="none"><CornerBasico cor={color} flipH /></View>
        <View style={{ position: "absolute", bottom: 0, left:  0 }} pointerEvents="none"><CornerBasico cor={color} flipV /></View>
        <View style={{ position: "absolute", bottom: 0, right: 0 }} pointerEvents="none"><CornerBasico cor={color} flipH flipV /></View>
        {children}
      </View>

      {/* Insígnia centralizada sobre a borda superior */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, alignItems: "center" }}
      >
        <Image source={insignia} style={{ width: BADGE, height: BADGE }} resizeMode="contain" />
      </View>
    </View>
  );
}
