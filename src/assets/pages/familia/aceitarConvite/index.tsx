import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useAuth } from "../../../../context/AuthContext";
import { useFamilia } from "../../../../context/FamiliaContext";
import { familiaAceitarConvite, familiaRejeitarConvite } from "../../../../services/api";
import { useTheme } from "../../../../context/ThemeContext";
import Logo from "../../../logo.png";

export default function AceitarConviteFamilia({ route, navigation }: any) {
  const token: string = route?.params?.token ?? "";
  const { user, isLoading } = useAuth();
  const { salvarConvitePendente } = useFamilia();
  const { colors } = useTheme();
  const s = makeStyle(colors);

  const [loading, setLoading] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [rejeitado, setRejeitado] = useState(false);
  const [erro, setErro] = useState("");

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (token) salvarConvitePendente(token);
      navigation.replace("AuthStack");
    }
  }, [user, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !user) return null;

  if (sucesso) {
    return (
      <View style={s.container}>
        <Image source={Logo} style={s.logo} />
        <Text style={[s.titulo, { color: colors.textPrimary }]}>Convite aceito!</Text>
        <Text style={[s.subtitulo, { color: colors.textSecondary }]}>
          O vínculo foi criado com sucesso. Você agora tem um responsável vinculado à sua conta.
        </Text>
        <TouchableOpacity
          style={[s.botao, { backgroundColor: colors.primary }]}
          onPress={() => navigation.replace("AppTabs")}
        >
          <Text style={s.botaoTexto}>Ir para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rejeitado) {
    return (
      <View style={s.container}>
        <Image source={Logo} style={s.logo} />
        <Text style={[s.titulo, { color: colors.textPrimary }]}>Convite recusado</Text>
        <Text style={[s.subtitulo, { color: colors.textSecondary }]}>
          Você recusou o convite. Nenhum vínculo foi criado.
        </Text>
        <TouchableOpacity
          style={[s.botao, { backgroundColor: colors.primary }]}
          onPress={() => navigation.replace("AppTabs")}
        >
          <Text style={s.botaoTexto}>Ir para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAceitar = async () => {
    if (!token) { setErro("Link inválido. Verifique o e-mail e tente novamente."); return; }
    try {
      setLoading(true);
      setErro("");
      await familiaAceitarConvite(token);
      setSucesso(true);
    } catch (e: any) {
      setErro(e?.message || "Não foi possível aceitar o convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!token) { navigation.replace("AppTabs"); return; }
    try {
      setRejeitando(true);
      setErro("");
      await familiaRejeitarConvite(token);
    } catch {
      // Mesmo que o backend falhe, considera rejeitado localmente
    } finally {
      setRejeitando(false);
      setRejeitado(true);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <Image source={Logo} style={s.logo} />
      <Text style={[s.titulo, { color: colors.textPrimary }]}>Aceitar convite</Text>
      <Text style={[s.subtitulo, { color: colors.textSecondary }]}>
        Um usuário da Purg quer se tornar seu responsável. Ao aceitar, ele poderá visualizar e gerenciar permissões da sua conta.
      </Text>

      {!token && (
        <View style={s.erroBox}>
          <Text style={s.erroTexto}>Link inválido ou expirado.</Text>
        </View>
      )}
      {!!erro && (
        <View style={s.erroBox}>
          <Text style={s.erroTexto}>{erro}</Text>
        </View>
      )}

      {!!token && (
        <TouchableOpacity
          style={[s.botao, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
          onPress={handleAceitar}
          disabled={loading || rejeitando}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.botaoTexto}>Aceitar</Text>
          }
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[s.botaoSecundario, { borderColor: "#FF3B30" }, rejeitando && { opacity: 0.6 }]}
        onPress={handleRejeitar}
        disabled={loading || rejeitando}
      >
        {rejeitando
          ? <ActivityIndicator color="#FF3B30" size="small" />
          : <Text style={[s.botaoSecundarioTexto, { color: "#FF3B30" }]}>Rejeitar convite</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.botaoTerciario]}
        onPress={() => navigation.navigate("AppTabs")}
        disabled={loading || rejeitando}
      >
        <Text style={[s.botaoTerciarioTexto, { color: colors.textSecondary }]}>Decidir depois</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyle(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 28,
      paddingTop: 80,
      paddingBottom: 40,
    },
    logo: {
      width: 90,
      height: 40,
      resizeMode: "contain",
      alignSelf: "center",
      marginBottom: 40,
    },
    titulo: {
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 12,
    },
    subtitulo: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 32,
    },
    erroBox: {
      backgroundColor: "#fff0f0",
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
    },
    erroTexto: {
      color: "#cc0000",
      fontSize: 13,
      textAlign: "center",
    },
    botao: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    botaoTexto: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    botaoSecundario: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 10,
    },
    botaoSecundarioTexto: {
      fontWeight: "600",
      fontSize: 15,
    },
    botaoTerciario: {
      paddingVertical: 12,
      alignItems: "center",
    },
    botaoTerciarioTexto: {
      fontSize: 14,
    },
  });
}
