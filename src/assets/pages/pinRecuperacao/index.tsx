import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { lightColors } from "../../../context/ThemeContext";
import { recuperarPinConfirmar } from "../../../services/api";
import Logo from "../../logo.png";

export default function PinRecuperacao({ route, navigation }: any) {
  const token: string = route?.params?.token ?? "";
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConf, setSenhaConf] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = lightColors;

  const s = useMemo(() => makeStyle(colors), []);

  async function handleConfirmar() {
    setErro("");
    if (!token) { setErro("Link inválido ou expirado. Solicite uma nova recuperação."); return; }
    if (!senhaNova || !senhaConf) { setErro("Preencha os dois campos."); return; }
    if (senhaNova !== senhaConf) { setErro("As senhas não coincidem."); return; }
    try {
      setLoading(true);
      await recuperarPinConfirmar({ token, senha_nova: senhaNova, senha_confirmacao: senhaConf });
      setSucesso(true);
    } catch (e: any) {
      setErro(e?.message || "Não foi possível redefinir a senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <View style={s.container}>
        <Image source={Logo} style={s.logo} />
        <Text style={s.titulo}>Senha redefinida!</Text>
        <Text style={s.subtitulo}>
          Sua senha de negociação foi atualizada com sucesso. Já pode utilizá-la no aplicativo.
        </Text>
        <TouchableOpacity style={s.botao} onPress={() => navigation.navigate("AuthStack")}>
          <Text style={s.botaoTexto}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Image source={Logo} style={s.logo} />
      <Text style={s.titulo}>Redefinir senha de negociação</Text>
      <Text style={s.subtitulo}>
        Escolha uma nova senha de negociação para sua conta.
      </Text>

      {!token && (
        <View style={s.erroBox}>
          <Text style={s.erroTexto}>Link inválido ou expirado. Solicite uma nova recuperação no aplicativo.</Text>
        </View>
      )}

      {token && (
        <>
          <Text style={s.label}>Nova senha</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Nova senha de negociação"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!mostrarSenha}
              value={senhaNova}
              onChangeText={(v) => { setSenhaNova(v); setErro(""); }}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setMostrarSenha((v) => !v)} style={s.olho}>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{mostrarSenha ? "ocultar" : "mostrar"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Confirmar nova senha</Text>
          <TextInput
            style={s.inputSolo}
            placeholder="Confirmar nova senha"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={!mostrarSenha}
            value={senhaConf}
            onChangeText={(v) => { setSenhaConf(v); setErro(""); }}
            autoCapitalize="none"
          />

          {erro ? (
            <View style={s.erroBox}>
              <Text style={s.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.botao, loading && { opacity: 0.6 }]}
            onPress={handleConfirmar}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.botaoTexto}>Redefinir senha</Text>
            }
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function makeStyle(colors: typeof lightColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 28,
      paddingTop: 72,
      paddingBottom: 32,
    },
    logo: {
      width: 90,
      height: 40,
      resizeMode: "contain",
      alignSelf: "center",
      marginBottom: 32,
    },
    titulo: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 10,
    },
    subtitulo: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 19,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: 6,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 16,
      backgroundColor: colors.backgroundSecondary,
    },
    input: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.textPrimary,
    },
    olho: {
      paddingHorizontal: 12,
    },
    inputSolo: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: 16,
    },
    erroBox: {
      backgroundColor: "#fff0f0",
      borderRadius: 8,
      padding: 10,
      marginBottom: 14,
    },
    erroTexto: {
      color: "#cc0000",
      fontSize: 13,
      textAlign: "center",
    },
    botao: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    botaoTexto: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
    },
  });
}
