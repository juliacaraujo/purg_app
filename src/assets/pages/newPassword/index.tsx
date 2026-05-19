import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { lightColors } from "../../../context/ThemeContext";
import { makeLoginStyle } from "../login/styles";
import { changePassword } from "../../../services/api";

export default function NewPassword({ route, navigation }: any) {
  const colors = lightColors;
  const style = makeLoginStyle(colors);

  const email: string = route?.params?.email || "";
  const codigo: string = route?.params?.codigo || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const criterios = {
    tamanho: newPassword.length >= 8,
    maiuscula: /[A-Z]/.test(newPassword),
    especial: /[!@#$&*]/.test(newPassword),
    especialInvalido: newPassword.length > 0 && /[^a-zA-Z0-9!@#$&*]/.test(newPassword),
  };

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    criterios.tamanho &&
    criterios.maiuscula &&
    criterios.especial &&
    !criterios.especialInvalido &&
    passwordsMatch;

  const handleChangePassword = async () => {
    if (!email) {
      Alert.alert("Erro", "Não foi possível identificar o e-mail. Volte e inicie a recuperação novamente.");
      return;
    }
    try {
      setLoading(true);
      const result = await changePassword(email, codigo, newPassword);
      if (!result.success) {
        Alert.alert("Erro", result.message || "Não foi possível alterar a senha.");
        return;
      }
      setSucesso(true);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const criterioColor = (ok: boolean) => ok ? colors.primary : "#aaa";

  return (
    <View style={style.container}>
      <View style={style.boxTop}>
        <Image
          source={require("../../../assets/logo.png")}
          style={style.logo}
        />
      </View>

      <View style={[style.boxMid, { justifyContent: "flex-start", paddingTop: 40 }]}>
        {sucesso ? (
          <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.textPrimary, textAlign: "center", marginBottom: 16 }}>
              Senha alterada com sucesso!
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 32, lineHeight: 20 }}>
              Sua senha foi atualizada. Faça o login com a nova senha.
            </Text>
            <TouchableOpacity style={style.loginButton} onPress={() => navigation.navigate("Login")}>
              <Text style={style.loginButtonText}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {email ? (
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
              Defina uma nova senha para o e-mail:{"\n"}
              <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>{email}</Text>
            </Text>
          ) : (
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24 }}>
              Defina a sua nova senha de acesso.
            </Text>
          )}

          <TextInput
            style={style.input}
            placeholder="Nova senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TextInput
            style={[style.input, confirmPassword.length > 0 && { borderColor: passwordsMatch ? colors.primary : "#FF3B30" }]}
            placeholder="Confirmar nova senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={{ color: "#FF3B30", fontSize: 12, marginTop: -10, marginBottom: 12 }}>
              As senhas não coincidem.
            </Text>
          )}

          <View style={{ marginTop: 4, marginBottom: 20, gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: 4 }}>
              A senha deve conter:
            </Text>
            {[
              { ok: criterios.tamanho, label: "No mínimo 8 caracteres" },
              { ok: criterios.maiuscula, label: "No mínimo 1 letra maiúscula" },
              { ok: criterios.especial, label: "No mínimo 1 caractere especial (! @ # $ & *)" },
            ].map(({ ok, label }) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 8, color: criterioColor(ok) }}>●</Text>
                <Text style={{ fontSize: 13, color: criterioColor(ok) }}>{label}</Text>
              </View>
            ))}
            {criterios.especialInvalido && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 8, color: "#FF3B30" }}>●</Text>
                <Text style={{ fontSize: 13, color: "#FF3B30" }}>Contém caractere(s) não permitido(s). Use apenas: ! @ # $ & *</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginBottom: 20 }} />
          ) : (
            <TouchableOpacity
              style={[style.loginButton, !canSubmit && { opacity: 0.4 }]}
              onPress={handleChangePassword}
              disabled={!canSubmit}
            >
              <Text style={style.loginButtonText}>Alterar</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        )}
      </View>
    </View>
  );
}
