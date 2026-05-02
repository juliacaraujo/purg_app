/**
 * Purg — Page Meta
 * @page Login — Senha
 * @version 1.1.0
 * @status active
 * @lastUpdate 2026-04-20
 * @changes
 * - 1.1.0: Modal de cadastro de biometria para primeiro acesso (tipo === null)
 * - 1.0.0: Versão inicial
 */

import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
} from "react-native";
import { makeLoginStyle } from "../login/styles";
import { lightColors } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { loginUser, atualizarPreferenciaLogin } from "../../../services/api";
import { cadastrarBiometria } from "../../../services/biometria";

import imgOlhoAberto from "../../../../assets/olho_aberto.png";
import imgOlhoFechado from "../../../../assets/olho_fechado.png";

export default function LoginPassword({ navigation, route }: any) {
  const { email, primeiroAcesso } = route?.params ?? {};
  const { login } = useAuth();
  const loginStyle = useMemo(() => makeLoginStyle(lightColors), []);

  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [modalBio, setModalBio] = useState(false);
  const [cadastrandoBio, setCadastrandoBio] = useState(false);
  const [erroBio, setErroBio] = useState("");
  const [dadosLogin, setDadosLogin] = useState<{ id: number; email: string } | null>(null);

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

  const handleEntrar = async () => {
    if (!senha.trim()) { mostrarErro("Informe sua senha."); return; }
    try {
      setLoading(true);
      setErro("");
      const result = await loginUser(email, senha);
      if (!result.success || !result.userId) {
        mostrarErro(result.message || "E-mail ou senha incorretos.");
        return;
      }
      const dados = { id: Number(result.userId), email, avatarId: result.avatarId };
      if (primeiroAcesso) {
        setDadosLogin(dados);
        setModalBio(true);
      } else {
        login(dados);
      }
    } catch (e: any) {
      mostrarErro(e?.message || "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCadastrarBiometria = async () => {
    if (!dadosLogin) return;
    try {
      setCadastrandoBio(true);
      setErroBio("");
      await cadastrarBiometria();
      await atualizarPreferenciaLogin(dadosLogin.id, "biometria").catch(() => {});
      login(dadosLogin);
    } catch (e: any) {
      setErroBio(e?.message || "Não foi possível cadastrar a biometria.");
      setCadastrandoBio(false);
    }
  };

  const handlePularBiometria = () => {
    if (!dadosLogin) return;
    atualizarPreferenciaLogin(dadosLogin.id, "senha").catch(() => {});
    login(dadosLogin);
  };

  const temErro = erro.length > 0;

  return (
    <View style={loginStyle.container}>
      <View style={loginStyle.boxTop}>
        <Image source={require("../../../assets/logo.png")} style={loginStyle.logo} />
      </View>

      <View style={loginStyle.boxMid}>
        <Text style={{ fontSize: 13, color: lightColors.textSecondary, marginBottom: 12 }}>
          {email}
        </Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={{ position: "relative", marginBottom: 0 }}>
            <TextInput
              style={[loginStyle.input, { marginBottom: 0, paddingRight: 44 }, temErro && { borderColor: "#FF3B30" }]}
              placeholder="Senha"
              placeholderTextColor={lightColors.textTertiary}
              secureTextEntry={!showSenha}
              value={senha}
              onChangeText={(v) => { setSenha(v); setErro(""); }}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => setShowSenha((v) => !v)}
              style={styles.olhoBtn}
            >
              <Image
                source={showSenha ? imgOlhoFechado : imgOlhoAberto}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {temErro && (
            <Text style={{ color: "#FF3B30", fontSize: 13, marginTop: 8, marginBottom: 4, textAlign: "center", fontWeight: "500" }}>
              {erro}
            </Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[loginStyle.loginButton, { marginTop: 16 }, loading && { opacity: 0.6 }]}
          onPress={handleEntrar}
          disabled={loading}
        >
          <Text style={loginStyle.loginButtonText}>{loading ? "Entrando..." : "Entrar"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate("RecoverAccount")}
        >
          <Text style={styles.forgotBtnText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={[loginStyle.forgotPasswordText, { textAlign: "center" }]}>Usar outro e-mail</Text>
        </TouchableOpacity>
      </View>

      {/* Modal — cadastro de biometria (primeiro acesso) */}
      <Modal visible={modalBio} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Ativar biometria</Text>
            <Text style={styles.cardTexto}>
              Deseja cadastrar sua biometria para acessar o app mais rápido nas próximas vezes?
            </Text>

            {erroBio ? (
              <Text style={styles.cardErro}>{erroBio}</Text>
            ) : null}

            {cadastrandoBio ? (
              <ActivityIndicator color={lightColors.primary} style={{ marginTop: 16 }} />
            ) : (
              <>
                <TouchableOpacity style={[loginStyle.loginButton, { marginTop: 20 }]} onPress={handleCadastrarBiometria}>
                  <Text style={loginStyle.loginButtonText}>Sim, cadastrar biometria</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.forgotBtn, { marginTop: 10 }]} onPress={handlePularBiometria}>
                  <Text style={styles.forgotBtnText}>Agora não</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  olhoBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  forgotBtn: {
    backgroundColor: "#4a4a4a",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  forgotBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: lightColors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  cardTexto: {
    fontSize: 14,
    color: lightColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  cardErro: {
    fontSize: 13,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "500",
  },
});
