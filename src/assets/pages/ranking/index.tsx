import React from "react";
import { View, Text, Image } from "react-native";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";

const EmConstrucao = require("../../purg_contrucao.png");

export default function Ranking() {
  return (
    <SwipeTabsWrapper currentTab="Ranking">
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 24 }}>
        <Image source={EmConstrucao} style={{ width: 280, height: 280, resizeMode: "contain" }} />
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111", marginTop: 8 }}>Em construção</Text>
        <Text style={{ fontSize: 14, color: "#888", marginTop: 6, textAlign: "center" }}>
          A tela de Ranking está sendo desenvolvida. Em breve!
        </Text>
      </View>
    </SwipeTabsWrapper>
  );
}
