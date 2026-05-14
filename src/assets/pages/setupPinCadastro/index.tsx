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
  Image,
} from "react-native";
import imgOlhoAberto from "../../../../assets/olho_aberto.png";
import imgOlhoFechado from "../../../../assets/olho_fechado.png";
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
  const [mostrarPin, setMostrarPin] = useState(false);
  const [mostrarPinConf, setMostrarPinConf] = useState(false);

  async function handleCriar() {
    if (!userId) {
      setErro("Não foi possível identificar o usuário. Tente fazer login novamente.");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setErro("A senha deve ter exatamente 4 dígitos numéricos.");
      return;
    }
    if (/^(\d)\1{3}$/.test(pin)) {
      setErro("A senha não pode ter todos os dígitos iguais (ex: 1111).");
      return;
    }
    if (/(.)\1{2}/.test(pin)) {
      setErro("A senha não pode ter o mesmo dígito repetido 3 vezes seguidas (ex: 1333, 2229).");
      return;
    }
    if (pin !== pinConf) {
      setErro("As senhas não coincidem.");
      return;
    }
    try {
      setCriando(true);
      setErro(null);
      await criarPinNegociacao(userId, { senha: pin, senha_confirmacao: pinConf });
      if (onConcluido) {
        onConcluido();
      } else {
        navigation?.navigate("Login");
      }
    } catch (e: any) {
      setErro(e?.message || "Não foi possível criar a senha. Tente novamente.");
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

        <Text style={s.titulo}>Criar Senha de Negociação</Text>
        <Text style={s.descricao}>
          Sua senha de 4 dígitos protege todos os seus saques. Você precisará
          dela sempre que quiser transferir dinheiro.
        </Text>

        <View style={s.regrasBox}>
          <Text style={s.regraItem}>• Exatamente 4 dígitos numéricos</Text>
          <Text style={s.regraItem}>• Não pode ter todos os dígitos iguais (ex: 1111)</Text>
          <Text style={s.regraItem}>• Guarde-o em local seguro</Text>
        </View>

        <Text style={s.inputLabel}>Senha</Text>
        <View style={[s.pinInputWrap, erro ? s.pinInputErro : undefined]}>
          <TextInput
            style={s.pinInput}
            placeholder="••••"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            secureTextEntry={!mostrarPin}
            maxLength={4}
            value={pin}
            onChangeText={(v) => { setPin(v); setErro(null); }}
          />
          <TouchableOpacity onPress={() => setMostrarPin((v) => !v)} style={s.olhoBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={mostrarPin ? imgOlhoAberto : imgOlhoFechado} style={s.olhoIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <Text style={s.inputLabel}>Confirmar Senha</Text>
        <View style={[s.pinInputWrap, erro ? s.pinInputErro : undefined]}>
          <TextInput
            style={s.pinInput}
            placeholder="••••"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            secureTextEntry={!mostrarPinConf}
            maxLength={4}
            value={pinConf}
            onChangeText={(v) => { setPinConf(v); setErro(null); }}
          />
          <TouchableOpacity onPress={() => setMostrarPinConf((v) => !v)} style={s.olhoBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={mostrarPinConf ? imgOlhoAberto : imgOlhoFechado} style={s.olhoIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>

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
            : <Text style={s.btnText}>Criar Senha e continuar</Text>
          }
        </TouchableOpacity>

        <Text style={s.aviso}>
          Esta etapa é obrigatória. A senha de negociação será necessária para realizar saques na plataforma.
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
  pinInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    marginBottom: 18,
  },
  pinInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    fontSize: 28,
    letterSpacing: 14,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  pinInputErro: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  olhoBtn: {
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  olhoIcon: {
    width: 22,
    height: 22,
    tintColor: "#94a3b8",
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
