import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

const WEBHOOK_URL = "https://n8n-n8n.rqkx8g.easypanel.host/webhook/purg-chat";

interface Mensagem {
  id: string;
  texto: string;
  doUsuario: boolean;
}

function DigitandoIndicador({ cor, cardBg }: { cor: string; cardBg: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function animar(dot: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 220, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.delay(660 - delay),
        ])
      );
    }
    const a1 = animar(dot1, 0);
    const a2 = animar(dot2, 180);
    const a3 = animar(dot3, 360);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={[ds.bolhaBot, { backgroundColor: cardBg }]}>
      <Text style={[ds.nomeBot, { color: cor }]}>Purg</Text>
      <View style={ds.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[ds.dot, { backgroundColor: cor, transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  bolhaBot: {
    alignSelf: "flex-start",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    marginHorizontal: 14,
  },
  nomeBot: { fontSize: 10, fontWeight: "700", marginBottom: 6 },
  dotsRow: { flexDirection: "row", gap: 6, alignItems: "center", height: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.85 },
});

export default function Chat() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const s = makeStyle(colors);

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    { id: "intro", texto: "Olá! Sou a Purg, sua assistente financeira. Como posso te ajudar?", doUsuario: false },
  ]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const listRef = useRef<FlatList<Mensagem>>(null);

  const enviar = useCallback(async () => {
    const msg = texto.trim();
    if (!msg || carregando) return;

    setMensagens((prev) => [...prev, { id: `msg_${Date.now()}_u`, texto: msg, doUsuario: true }]);
    setTexto("");
    setCarregando(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          sessionId: `purg_id_${user?.id ?? "anonimo"}`,
        }),
      });

      const text = await res.text();
      const data = text.trim() ? JSON.parse(text) : {};
      const resposta = data?.response ?? "Não recebi uma resposta. Tente novamente em instantes.";

      setMensagens((prev) => [
        ...prev,
        { id: `msg_${Date.now()}_b`, texto: resposta, doUsuario: false },
      ]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        { id: `msg_${Date.now()}_err`, texto: "Erro ao conectar. Verifique sua conexão e tente novamente.", doUsuario: false },
      ]);
    } finally {
      setCarregando(false);
    }
  }, [texto, carregando, user?.id]);

  function renderMensagem({ item }: { item: Mensagem }) {
    return (
      <View style={[s.bolha, item.doUsuario ? s.bolhaUsuario : s.bolhaBot]}>
        {!item.doUsuario && <Text style={s.nomeBot}>Purg</Text>}
        <Text style={[s.bolhaTexto, item.doUsuario ? s.textoUsuario : s.textoBot]}>
          {item.texto}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[s.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Text style={[s.headerTitulo, { color: colors.textPrimary }]}>Purg</Text>
        <Text style={[s.headerSub, { color: colors.textTertiary }]}>Assistente financeira</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={renderMensagem}
          contentContainerStyle={s.lista}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            carregando
              ? <DigitandoIndicador cor={colors.primary} cardBg={colors.card} />
              : null
          }
        />

        <View style={[s.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[s.input, { color: colors.textPrimary, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textTertiary}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
            onSubmitEditing={enviar}
            submitBehavior="newline"
          />
          <TouchableOpacity
            style={[s.enviarBtn, { backgroundColor: colors.primary }, (!texto.trim() || carregando) && s.enviarBtnDisabled]}
            onPress={enviar}
            disabled={!texto.trim() || carregando}
          >
            <Text style={s.enviarTexto}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyle(colors: ReturnType<typeof import("../../../context/ThemeContext").useTheme>["colors"]) {
  return StyleSheet.create({
    safe: { flex: 1 },
    header: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
    },
    headerTitulo: { fontSize: 16, fontWeight: "700" },
    headerSub: { fontSize: 12, marginTop: 1 },
    lista: { padding: 14, paddingBottom: 8 },
    bolha: {
      maxWidth: "78%",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 10,
    },
    bolhaBot: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
    },
    bolhaUsuario: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    nomeBot: { fontSize: 10, fontWeight: "700", color: colors.primary, marginBottom: 3 },
    bolhaTexto: { fontSize: 14, lineHeight: 20 },
    textoBot: { color: colors.textPrimary },
    textoUsuario: { color: "#fff" },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      padding: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      maxHeight: 100,
    },
    enviarBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    enviarBtnDisabled: { opacity: 0.4 },
    enviarTexto: { color: "#fff", fontSize: 16 },
  });
}
