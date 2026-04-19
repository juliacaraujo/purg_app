import React, { useRef } from "react";
import { PanResponder, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const TABS = ["Home", "Patrimônio", "Objetivos", "Ranking"];

interface Props {
  currentTab: string;
  children: React.ReactNode;
}

export function SwipeTabsWrapper({ currentTab, children }: Props) {
  const navigation = useNavigation<any>();

  const panResponder = useRef(
    PanResponder.create({
      // Captura o gesto apenas quando o movimento é claramente horizontal
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2,

      onPanResponderRelease: (_, { dx }) => {
        const i = TABS.indexOf(currentTab);
        if (dx < -60 && i < TABS.length - 1) {
          navigation.navigate(TABS[i + 1]);
        } else if (dx > 60 && i > 0) {
          navigation.navigate(TABS[i - 1]);
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
