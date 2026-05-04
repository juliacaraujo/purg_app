import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  mensagem?: string;
};

export function BloqueioTela({ mensagem }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icone}>🔒</Text>
      <Text style={styles.titulo}>Funcionalidade bloqueada</Text>
      <Text style={styles.mensagem}>
        {mensagem ?? "Esta funcionalidade está bloqueada. Solicite ao seu responsável que habilite o acesso."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
    gap: 12,
  },
  icone: {
    fontSize: 48,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  mensagem: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
