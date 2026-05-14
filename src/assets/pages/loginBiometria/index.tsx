/**
 * Purg — Page Meta
 * @page Login — Biometria
 * @version 1.0.0
 * @status active
 * @lastUpdate 2026-04-20
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { makeLoginStyle } from "../login/styles";
import { lightColors } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { loginBiometrico } from "../../../services/biometria";

export default function LoginBiometria({ navigation, route }: any) {
  const { email } = route?.params ?? {};
  const { login } = useAuth();
  const loginStyle = useMemo(() => makeLoginStyle(lightColors), []);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleLoginBiometrico = async () => {
    try {
      setLoading(true);
      setErro("");
      const resultado = await loginBiometrico(email);
      login({ id: resultado.id, email: resultado.email, avatarId: resultado.avatarId });
    } catch (e: any) {
      setErro(e?.message || "Falha na autenticação biométrica.");
    } finally {
      setLoading(false);
    }
  };

  // Dispara automaticamente ao entrar na tela
  useEffect(() => {
    handleLoginBiometrico();
  }, []);

  return (
    <View style={loginStyle.container}>
      <View style={loginStyle.boxTop}>
        <Image source={require("../../../assets/logo.png")} style={loginStyle.logo} />
      </View>

      <View style={loginStyle.boxMid}>
        <Text style={{ fontSize: 13, color: lightColors.textSecondary, marginBottom: 24 }}>
          {email}
        </Text>

        {loading ? (
          <ActivityIndicator color={lightColors.primary} size="large" style={{ marginBottom: 24 }} />
        ) : (
          <>
            {erro ? (
              <Text style={{ color: "#FF3B30", fontSize: 13, textAlign: "center", marginBottom: 16, fontWeight: "500" }}>
                {erro}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[loginStyle.loginButton, { flexDirection: "row", justifyContent: "center", gap: 8 }]}
              onPress={handleLoginBiometrico}
            >
              <Image
                source={require("../../../../assets/biometria.png")}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
              <Text style={loginStyle.loginButtonText}>Entrar com biometria</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[loginStyle.loginButton, { backgroundColor: "#4a4a4a", marginTop: 10 }]}
              onPress={() => navigation.navigate("LoginPassword", { email })}
            >
              <Text style={loginStyle.loginButtonText}>Usar senha</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={loginStyle.forgotPasswordButton}
          onPress={() => navigation.navigate("RecoverAccount", { email })}
        >
          <Text style={[loginStyle.forgotPasswordText, { fontSize: 15, textAlign: "center", marginTop: 20 }]}>
            Esqueci minha senha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
          <Text style={[loginStyle.forgotPasswordText, { textAlign: "center" }]}>Usar outro e-mail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
