import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { style } from "./styles";
import { validateRecoveryCode } from "../../../services/api";

export default function CodeValidation({ route, navigation }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const email = route?.params?.email || "";

  const handleValidate = async () => {
    if (!code.trim()) {
      Alert.alert("Atenção", "Digite o código de validação.");
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

      const result = await validateRecoveryCode(email, code);

      if (!result.success) {
        Alert.alert(
          "Código inválido",
          result.message || "Verifique o código e tente novamente."
        );
        return;
      }

      // Código OK → segue para criar nova senha
      navigation.navigate("NewPassword", { email });
    } catch (error: any) {
      const msg =
        error?.message ||
        "Não foi possível validar o código. Tente novamente.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Validação do Código</Text>

      {email ? (
        <Text style={style.subtitle}>
          Enviamos um código para o e-mail:{"\n"}
          <Text style={style.email}>{email}</Text>
        </Text>
      ) : (
        <Text style={style.subtitle}>
          Digite o código de validação enviado para o seu e-mail.
        </Text>
      )}

      <TextInput
        style={style.input}
        placeholder="Código de validação"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
      />

      <TouchableOpacity
        style={style.button}
        onPress={handleValidate}
        disabled={loading}
      >
        <Text style={style.buttonText}>
          {loading ? "Validando..." : "Validar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={style.linkText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}
