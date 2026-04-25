import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { criarPinNegociacao } from "../../../services/api";

type Props = {
  // Usado quando renderizado diretamente no RootNavigator (pós-login)
  onConcluido?: () => void;
  // Usado quando navegado via AuthStack (pós-cadastro)
  route?: any;
  navigation?: any;
};

export default function SetupPinCadastro({ onConcluido, route, navigation }: Props) {
  const { user } = useAuth();
  // Aceita userId via route.params (cadastro) ou via contexto de auth (login)
  const userId: number = route?.params?.userId ?? user?.id;

  const [pin, setPin] = useState("");
  const [pinConf, setPinConf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  async function handleCriar() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setErro("O PIN deve ter exatamente 4 dígitos numéricos.");
      return;
    }
    if (pin !== pinConf) {
      setErro("Os PINs não coincidem.");
      return;
    }
    try {
      setCriando(true);
      setErro(null);
      await criarPinNegociacao(userId, { pin, pin_confirmacao: pinConf });
      if (onConcluido) {
        onConcluido();
      } else {
        navigation?.navigate("Login");
      }
    } catch (e: any) {
      setErro(e?.message || "Não foi possível criar o PIN. Tente novamente.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.iconBox}>
          <Text style={s.iconText}>🔐</Text>
        </View>

        <Text style={s.titulo}>Criar PIN de Negociação</Text>
        <Text style={s.descricao}>
          Seu PIN de 4 dígitos protege todos os seus saques. Você precisará
          dele sempre que quiser transferir dinheiro.
        </Text>

        <View style={s.regrasBox}>
          <Text style={s.regraItem}>• Exatamente 4 dígitos numéricos</Text>
          <Text style={s.regraItem}>• Não pode ter todos os dígitos iguais (ex: 1111)</Text>
          <Text style={s.regraItem}>• Guarde-o em local seguro</Text>
        </View>

        <Text style={s.inputLabel}>PIN</Text>
        <TextInput
          style={[s.pinInput, erro ? s.pinInputErro : undefined]}
          placeholder="••••"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={(v) => { setPin(v); setErro(null); }}
        />

        <Text style={s.inputLabel}>Confirmar PIN</Text>
        <TextInput
          style={[s.pinInput, erro ? s.pinInputErro : undefined]}
          placeholder="••••"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          value={pinConf}
          onChangeText={(v) => { setPinConf(v); setErro(null); }}
        />

        {erro && (
          <View style={s.erroBox}>
            <Text style={s.erroTexto}>{erro}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, criando && { opacity: 0.6 }]}
          onPress={handleCriar}
          disabled={criando}
        >
          {criando
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Criar PIN e continuar</Text>
          }
        </TouchableOpacity>

        <Text style={s.aviso}>
          Esta etapa é obrigatória. O PIN será necessário para realizar saques na plataforma.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: "stretch",
  },
  iconBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 56,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 10,
  },
  descricao: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  regrasBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
    gap: 6,
  },
  regraItem: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  pinInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 16,
    fontSize: 28,
    letterSpacing: 14,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 18,
    backgroundColor: "#f8fafc",
  },
  pinInputErro: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  erroBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  erroTexto: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#14532d",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  aviso: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 17,
  },
});
