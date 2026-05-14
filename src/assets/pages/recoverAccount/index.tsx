import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { makeLoginStyle } from "../login/styles";
import { requestRecoveryCode } from "../../../services/api";

export default function RecoverAccount({ navigation, route }: any) {
  const { colors } = useTheme();
  const style = makeLoginStyle(colors);

  const emailParam: string = route?.params?.email ?? "";
  const email = emailParam;
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe o e-mail.");
      return;
    }
    if (!/@.+\..+/.test(email.trim())) {
      Alert.alert("Atenção", "Informe um e-mail válido (ex: nome@email.com).");
      return;
    }

    try {
      setLoading(true);
      const result = await requestRecoveryCode(email);

      if (!result.success) {
        Alert.alert("Erro", result.message || "Não foi possível iniciar a recuperação.");
        return;
      }

      Alert.alert(
        "Código enviado",
        result.message || "Se os dados estiverem corretos, você receberá um código no e-mail."
      );

      navigation.navigate("CodeValidation", { email });
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível iniciar a recuperação.");
    } finally {
      setLoading(false);
    }
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
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
          Enviaremos um código de verificação para o e-mail abaixo. Use-o na próxima etapa para criar uma nova senha.
        </Text>

        <TextInput
          style={[style.input, { color: colors.textPrimary, opacity: 0.7 }]}
          value={email}
          editable={false}
          selectTextOnFocus={false}
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginBottom: 20 }} />
        ) : (
          <TouchableOpacity style={style.loginButton} onPress={handleRecover}>
            <Text style={style.loginButtonText}>Recuperar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[style.forgotPasswordText, { textAlign: "center", marginTop: 8 }]}>
            Voltar para o login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
