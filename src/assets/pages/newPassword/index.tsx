import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { style } from "./styles";
import { changePassword } from "../../../services/api";

export default function NewPassword({ route, navigation }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const email = route?.params?.email || "";

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Atenção", "Preencha os dois campos de senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[!@#$%^&*()\-_=+.]/.test(newPassword)
    ) {
      Alert.alert(
        "Senha inválida",
        "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial (! @ # $ % ^ & * - _ = + .)."
      );
      return;
    }

    if (!email) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar o e-mail. Volte e inicie a recuperação novamente."
      );
      return;
    }

    try {
      setLoading(true);

      const result = await changePassword(email, newPassword);

      if (!result.success) {
        Alert.alert(
          "Erro",
          result.message || "Não foi possível alterar a senha."
        );
        return;
      }

      Alert.alert(
        "Sucesso",
        result.message || "Senha alterada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error: any) {
      const msg =
        error?.message || "Não foi possível alterar a senha. Tente novamente.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Criar Nova Senha</Text>

      {email ? (
        <Text style={style.subtitle}>
          Defina uma nova senha para o e-mail:{"\n"}
          <Text style={style.email}>{email}</Text>
        </Text>
      ) : (
        <Text style={style.subtitle}>
          Defina a sua nova senha de acesso.
        </Text>
      )}

      <TextInput
        style={style.input}
        placeholder="Nova senha"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TextInput
        style={style.input}
        placeholder="Confirmar nova senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={style.button}
        onPress={handleChangePassword}
        disabled={loading}
      >
        <Text style={style.buttonText}>
          {loading ? "Alterando..." : "Alterar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={style.linkText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}
