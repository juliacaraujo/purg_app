import React from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { isWeb } from "../global/responsive";

const imgHome = require("../../../assets/home.png");
const imgPatrimonio = require("../../../assets/patrimonio.png");
const imgObjetivos = require("../../../assets/objetivos.png");
const imgRanking = require("../../../assets/ranking.png");

const TABS = [
  { img: imgHome, screen: "Home" },
  { img: imgPatrimonio, screen: "Patrimônio" },
  { img: imgObjetivos, screen: "Objetivos" },
  { img: imgRanking, screen: "Ranking" },
] as const;

export function AppBottomBar() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const paddingBottom = isWeb ? Math.max(insets.bottom, 10) : insets.bottom;

  return (
    <View
      style={[
        s.bar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom,
        },
      ]}
    >
      {TABS.map(({ img, screen }) => (
        <TouchableOpacity
          key={screen}
          style={s.tab}
          onPress={() => navigation.navigate("AppTabs", { screen })}
          activeOpacity={0.7}
        >
          <Image
            source={img}
            style={{ width: 26, height: 26, tintColor: colors.textTertiary }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
});
