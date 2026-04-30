import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useFamilia } from "../../context/FamiliaContext";

export function BannerAtuandoComo() {
  const { atuandoComo, retornarAoGuardiao } = useFamilia();
  const [voltando, setVoltando] = useState(false);
  const [erro, setErro] = useState("");

  if (!atuandoComo) return null;

  const handleVoltar = async () => {
    try {
      setVoltando(true);
      setErro("");
      await retornarAoGuardiao();
    } catch {
      setErro("Não foi possível voltar. Tente novamente.");
      setVoltando(false);
    }
  };

  return (
    <View>
      <View style={styles.banner}>
        <Text style={styles.texto} numberOfLines={1}>
          Visualizando como {atuandoComo.nome}
        </Text>
        <TouchableOpacity
          onPress={handleVoltar}
          disabled={voltando}
          style={styles.botao}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {voltando
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.botaoTexto}>Voltar</Text>
          }
        </TouchableOpacity>
      </View>
      {!!erro && (
        <View style={styles.erroBar}>
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#E07700",
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 999,
  },
  texto: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  botao: {
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  erroBar: {
    backgroundColor: "#cc0000",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  erroTexto: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
});
