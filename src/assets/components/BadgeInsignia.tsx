import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import insigniaMap from "../insigniaMap";

type Props = {
  ligaNome: string | null | undefined;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function BadgeInsignia({ ligaNome, size = 28, style }: Props) {
  if (!ligaNome) return null;
  const source = insigniaMap[ligaNome];
  if (!source) return null;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
