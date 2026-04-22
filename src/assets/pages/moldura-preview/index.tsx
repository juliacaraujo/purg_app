import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { MolduraLiga, LIGA_CORES } from "../../components/MolduraLiga";
import { useTheme } from "../../../context/ThemeContext";

const LIGAS = [
  "Cobre I", "Bronze I", "Prata I", "Ouro I",
  "Platina I", "Ametista I", "Safira I", "Esmeralda I", "Rubi I", "Diamante I",
];

export default function MolduraPreview({ navigation }: any) {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.backgroundSecondary }} contentContainerStyle={st.content}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Text style={[st.backText, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[st.titulo, { color: colors.textPrimary }]}>Preview das Molduras</Text>
      </View>

      {LIGAS.map((liga) => {
        const metal = liga.split(" ")[0];
        const cores = LIGA_CORES[metal];
        return (
          <MolduraLiga key={liga} ligaNome={liga} bg={colors.card}>
            <View style={st.cardContent}>
              <View style={{ backgroundColor: cores?.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "center" }}>
                <Text style={{ color: cores?.text, fontWeight: "700", fontSize: 14 }}>{liga}</Text>
              </View>
              <Text style={[st.desc, { color: colors.textTertiary }]}>Moldura tier: {metal.toLowerCase()}</Text>
            </View>
          </MolduraLiga>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 15, fontWeight: "600" },
  titulo: { fontSize: 20, fontWeight: "700" },
  cardContent: { alignItems: "center", paddingVertical: 8, gap: 8 },
  desc: { fontSize: 12, marginTop: 2 },
});
