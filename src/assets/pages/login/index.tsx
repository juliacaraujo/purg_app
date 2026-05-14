/**
 * Purg — Page Meta
 * @page Login
 * @version 2.0.0
 * @status active
 * @lastUpdate 2026-04-20
 * @changes
 * - 2.0.0: Fluxo em dois passos — email → tipo-acesso → senha ou biometria
 * - 1.x.x: Login direto com email + senha / biometria
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { makeLoginStyle } from "./styles";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { tipoAcesso, loginUser, biometriaLoginIniciar, biometriaLoginConcluir } from "../../../services/api";

type Etapa = "email" | "senha" | "biometria";

export default function Login({ navigation }: any) {
  const { colors } = useTheme();
  const style = makeLoginStyle(colors);
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [loading, setLoading] = useState(false);

  const handleVerificarEmail = async () => {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe seu e-mail.");
      return;
    }
    try {
      setLoading(true);
      const { tipo } = await tipoAcesso(email.trim());
      if (tipo !== "senha" && tipo !== "biometria") {
        Alert.alert("Erro", "Tipo de acesso não reconhecido. Entre em contato com o suporte.");
        return;
      }
      setEtapa(tipo);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível verificar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSenha = async () => {
    if (!senha.trim()) {
      Alert.alert("Atenção", "Informe sua senha.");
      return;
    }
    try {
      setLoading(true);
      const result = await loginUser(email.trim(), senha);
      if (!result.success || !result.userId) {
        Alert.alert("Erro", result.message || "Falha no login.");
        return;
      }
      login({ id: Number(result.userId), email: email.trim() });
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginBiometria = async () => {
    try {
      setLoading(true);
      const options = await biometriaLoginIniciar(email.trim());

      const { startAuthentication } = await import(
        "@simplewebauthn/browser" as any
      );
      const assertion = await startAuthentication(options);
      const result = await biometriaLoginConcluir(assertion);

      if (!result.success || !result.usuario_id) {
        Alert.alert("Erro", "Falha na autenticação biométrica.");
        return;
      }
      login({ id: Number(result.usuario_id), email: email.trim() });
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha na autenticação biométrica.");
    } finally {
      setLoading(false);
    }
  };

  const voltarParaEmail = () => {
    setEtapa("email");
    setSenha("");
  };

  return (
    <View style={style.container}>
      <View style={style.boxTop}>
        <Image
          source={require("../../../assets/logo.png")}
          style={style.logo}
        />
      </View>

      <View style={style.boxMid}>
        {/* Etapa 1 — E-mail */}
        {etapa === "email" && (
          <>
            <TextInput
              style={style.input}
              placeholder="e-mail@exemplo.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginBottom: 20 }} />
            ) : (
              <TouchableOpacity style={style.loginButton} onPress={handleVerificarEmail}>
                <Text style={style.loginButtonText}>Continuar</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Etapa 2a — Senha */}
        {etapa === "senha" && (
          <>
            <Text style={[style.text, { fontSize: 14, marginBottom: 12 }]}>{email}</Text>

            <TextInput
              style={style.input}
              placeholder="Senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginBottom: 20 }} />
            ) : (
              <TouchableOpacity style={style.loginButton} onPress={handleLoginSenha}>
                <Text style={style.loginButtonText}>Entrar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={style.forgotPasswordButton}
              onPress={() => navigation.navigate("RecoverAccount", { email: email.trim() })}
            >
              <Text style={style.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={voltarParaEmail}>
              <Text style={[style.forgotPasswordText, { textAlign: "center", marginTop: 8 }]}>
                Usar outro e-mail
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Etapa 2b — Biometria */}
        {etapa === "biometria" && (
          <>
            <Text style={[style.text, { fontSize: 14, marginBottom: 16 }]}>{email}</Text>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginBottom: 20 }} />
            ) : (
              <>
                {Platform.OS === "web" && (
                  <TouchableOpacity style={style.loginButton} onPress={handleLoginBiometria}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Image
                        source={require("../../../assets/biometria.png")}
                        style={{ width: 22, height: 22, resizeMode: "contain" }}
                      />
                      <Text style={style.loginButtonText}>Entrar com biometria</Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[style.signupButton, { marginTop: Platform.OS === "web" ? 12 : 0 }]}
                  onPress={() => setEtapa("senha")}
                >
                  <Text style={style.signupButtonText}>Usar senha</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={style.forgotPasswordButton}
              onPress={() => navigation.navigate("RecoverAccount", { email: email.trim() })}
            >
              <Text style={[style.forgotPasswordText, { fontSize: 15, textAlign: "center", marginTop: 12 }]}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={voltarParaEmail}>
              <Text style={[style.forgotPasswordText, { textAlign: "center", marginTop: 8 }]}>
                Usar outro e-mail
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Separador + Criar conta — sempre visível */}
        <View style={style.separatorBox}>
          <View style={style.line} />
          <Text style={style.separatorText}>ou</Text>
          <View style={style.line} />
        </View>

        <TouchableOpacity
          style={style.signupButton}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={style.signupButtonText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
