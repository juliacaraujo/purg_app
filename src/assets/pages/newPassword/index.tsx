import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { style } from "./styles";
import { changePassword } from "../../../services/api";

export default function NewPassword({ route, navigation }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const email = route?.params?.email || "";

  const criterios = {
    tamanho: newPassword.length >= 8,
    maiuscula: /[A-Z]/.test(newPassword),
    especial: /[!@#$&*]/.test(newPassword),
    especialInvalido: newPassword.length > 0 && /[^a-zA-Z0-9!@#$&*]/.test(newPassword),
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Atenção", "Preencha os dois campos de senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (criterios.especialInvalido) {
      Alert.alert(
        "Caractere não permitido",
        "Sua senha contém caracteres especiais não permitidos. Use apenas: ! @ # $ & *"
      );
      return;
    }

    if (!criterios.tamanho || !criterios.maiuscula || !criterios.especial) {
      Alert.alert(
        "Senha inválida",
        "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial (! @ # $ & *)."
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

      <View style={style.criteriosContainer}>
        <Text style={style.criteriosTitulo}>A senha deve conter:</Text>
        <View style={style.criterioRow}>
          <Text style={[style.criterioIcon, criterios.tamanho && style.criterioOk]}>●</Text>
          <Text style={[style.criterioTexto, criterios.tamanho && style.criterioOk]}>No mínimo 8 caracteres</Text>
        </View>
        <View style={style.criterioRow}>
          <Text style={[style.criterioIcon, criterios.maiuscula && style.criterioOk]}>●</Text>
          <Text style={[style.criterioTexto, criterios.maiuscula && style.criterioOk]}>No mínimo 1 letra maiúscula</Text>
        </View>
        <View style={style.criterioRow}>
          <Text style={[style.criterioIcon, criterios.especial && style.criterioOk]}>●</Text>
          <Text style={[style.criterioTexto, criterios.especial && style.criterioOk]}>No mínimo 1 caractere especial (! @ # $ & *)</Text>
        </View>
        {criterios.especialInvalido && (
          <View style={style.criterioRow}>
            <Text style={[style.criterioIcon, style.criterioErro]}>●</Text>
            <Text style={[style.criterioTexto, style.criterioErro]}>Contém caractere(s) não permitido(s). Use apenas: ! @ # $ & *</Text>
          </View>
        )}
      </View>

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
