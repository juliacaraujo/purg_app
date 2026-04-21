/**
 * Purg — Page Meta
 * @page Setup Apelido
 * @version 1.0.0
 * @status active
 * @lastUpdate 2026-04-20
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { editarPerfil } from "../../../services/api";

type Props = {
  onConcluido: () => void;
};

export default function SetupApelido({ onConcluido }: Props) {
  const { user } = useAuth();
  const [apelido, setApelido] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const mostrarErro = (msg: string) => { setErro(msg); shake(); };

  const handleSalvar = async () => {
    const valor = apelido.trim();
    if (!valor) { mostrarErro("Informe um apelido."); return; }
    if (valor.length < 3) { mostrarErro("O apelido deve ter pelo menos 3 caracteres."); return; }

    try {
      setLoading(true);
      setErro("");
      await editarPerfil(user!.id, { apelido: valor });
      onConcluido();
    } catch (e: any) {
      mostrarErro(e?.message || "Não foi possível salvar o apelido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Escolha seu apelido</Text>
      <Text style={styles.descricao}>
        Seu apelido é como você aparece no ranking e para outros usuários. Escolha um único.
      </Text>

      <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: "100%" }}>
        <TextInput
          style={[styles.input, erro ? styles.inputErro : null]}
          placeholder="Ex: joao123"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          value={apelido}
          onChangeText={(v) => { setApelido(v); setErro(""); }}
        />
        {erro ? (
          <Text style={styles.erroTexto}>{erro}</Text>
        ) : null}
      </Animated.View>

      <TouchableOpacity
        style={[styles.btn, (!apelido.trim() || loading) && styles.btnDisabled]}
        onPress={handleSalvar}
        disabled={!apelido.trim() || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnTexto}>Confirmar</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  descricao: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
    marginBottom: 4,
  },
  inputErro: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  erroTexto: {
    color: "#FF3B30",
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  btn: {
    marginTop: 20,
    backgroundColor: "#34C759",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
