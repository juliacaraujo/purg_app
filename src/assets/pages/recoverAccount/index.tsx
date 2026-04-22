import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { style } from "./styles";
import { requestRecoveryCode } from "../../../services/api";

export default function RecoverAccount({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (!email) {
      Alert.alert("Atenção", "Informe o e-mail.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestRecoveryCode(email);

      if (!result.success) {
        Alert.alert(
          "Erro",
          result.message || "Não foi possível iniciar a recuperação."
        );
        return;
      }

      Alert.alert(
        "Código enviado",
        result.message ||
          "Se os dados estiverem corretos, você receberá um código no e-mail."
      );

      // Agora seguimos o fluxo da documentação:
      // ir para a tela de Validação do Código (2.1) levando o e-mail
      navigation.navigate("CodeValidation", { email });
    } catch (error: any) {
      const msg =
        error?.message || "Não foi possível iniciar a recuperação.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Recuperação de Conta</Text>

      <TextInput
        style={style.input}
        placeholder="E-mail"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={style.button}
        onPress={handleRecover}
        disabled={loading}
      >
        <Text style={style.buttonText}>
          {loading ? "Enviando..." : "Recuperar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={style.linkText}>Voltar para o login</Text>
      </TouchableOpacity>
    </View>
  );
}
