import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { makeLoginStyle } from "../login/styles";
import { validateRecoveryCode, requestRecoveryCode } from "../../../services/api";

export default function CodeValidation({ route, navigation }: any) {
  const { colors } = useTheme();
  const style = makeLoginStyle(colors);

  const email: string = route?.params?.email || "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputs = useRef<Array<TextInput | null>>([]);

  const code = digits.join("");

  const handleChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length > 1) {
      const newDigits = [...digits];
      cleaned.slice(0, 6).split("").forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      inputs.current[Math.min(cleaned.length - 1, 5)]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned.length === 1 && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && digits[index] === "" && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    const cleaned = text.replace(/\D/g, "").slice(0, 6);
    if (!cleaned) return;
    const newDigits = ["", "", "", "", "", ""];
    cleaned.split("").forEach((d, i) => { newDigits[i] = d; });
    setDigits(newDigits);
    inputs.current[Math.min(cleaned.length - 1, 5)]?.focus();
  };

  const handleResend = async () => {
    if (!email) return;
    setResendMsg(null);
    try {
      setLoading(true);
      await requestRecoveryCode(email);
      setResendMsg({ text: "Novo código enviado para o seu e-mail.", ok: true });
    } catch (error: any) {
      setResendMsg({ text: error?.message || "Não foi possível reenviar o código.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setErrorMsg("");
    if (code.length < 6) {
      setErrorMsg("Digite o código de 6 dígitos.");
      return;
    }
    if (!email) {
      setErrorMsg("Não foi possível identificar o e-mail. Volte e inicie a recuperação novamente.");
      return;
    }
    try {
      setLoading(true);
      const result = await validateRecoveryCode(email, code);
      if (!result.success) {
        setErrorMsg(result.message || "Verifique o código e tente novamente.");
        return;
      }
      navigation.navigate("NewPassword", { email, codigo: code });
    } catch (error: any) {
      setErrorMsg(error?.message || "Não foi possível validar o código. Tente novamente.");
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
        {email ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 28, lineHeight: 20 }}>
            Enviamos um código para{"\n"}
            <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>{email}</Text>
          </Text>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 28 }}>
            Digite o código de validação enviado para o seu e-mail.
          </Text>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 28 }}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={{
                width: 44,
                height: 52,
                borderWidth: 1.5,
                borderColor: digit ? colors.primary : colors.inputBorder,
                borderRadius: 8,
                textAlign: "center",
                fontSize: 22,
                fontWeight: "600",
                color: colors.textPrimary,
                backgroundColor: colors.background,
              }}
              keyboardType="number-pad"
              maxLength={6}
              value={digit}
              onChangeText={(v) => handleChange(v, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handlePaste}
          style={{ flexDirection: "row", alignItems: "center", alignSelf: "center", marginBottom: 20, gap: 6 }}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.textSecondary} />
          <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: "500" }}>Colar código</Text>
        </TouchableOpacity>

        {errorMsg ? (
          <Text style={{ color: "#FF3B30", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
            {errorMsg}
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginBottom: 20 }} />
        ) : (
          <>
            <TouchableOpacity style={style.loginButton} onPress={handleValidate}>
              <Text style={style.loginButtonText}>Validar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend}>
              <Text style={[style.forgotPasswordText, { textAlign: "center", marginTop: 8 }]}>
                Enviar novo código
              </Text>
            </TouchableOpacity>

            {resendMsg && (
              <Text style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: resendMsg.ok ? colors.primary : "#FF3B30" }}>
                {resendMsg.text}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}
