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
import { getDadosCadastro } from "../../../services/api";

const WEBHOOK_URL = "https://n8n-n8n.rqkx8g.easypanel.host/webhook/purg-chat";
const MAX_HISTORICO = 20; // 10 pares usuário/bot

const SUGESTOES = [
  "Como a Purg funciona?",
  "A Purg é confiável?",
  "O que são Objetivos?",
];

function chatStorageGet(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage)
      return window.localStorage.getItem(key);
  } catch {}
  return null;
}

function chatStorageSet(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage)
      window.localStorage.setItem(key, value);
  } catch {}
}

function persistirHistorico(msgs: Mensagem[], uid: number | undefined) {
  if (!uid) return;
  const toSave = msgs.filter((m) => m.id !== "intro" && m.id !== "aviso_historico" && m.id !== "sugestoes");
  if (toSave.length === 0) return;
  chatStorageSet(`purg_chat_${uid}`, JSON.stringify(toSave.slice(-MAX_HISTORICO)));
}

interface Mensagem {
  id: string;
  texto: string;
  doUsuario: boolean;
  sistema?: boolean;
  sugestoes?: boolean;
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

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setMensagens([
        { id: "intro", texto: "Como posso te ajudar?", doUsuario: false },
        { id: "sugestoes", texto: "Se não souber por onde começar, segue algumas dicas!", doUsuario: false, sugestoes: true },
      ]);
      return;
    }

    const key = `purg_chat_${user.id}`;
    const salvo = chatStorageGet(key);
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo) as Mensagem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMensagens([
            { id: "aviso_historico", texto: "Mensagens anteriores não estão mais disponíveis.", doUsuario: false, sistema: true },
            ...parsed,
          ]);
          return;
        }
      } catch {}
    }

    getDadosCadastro(user.id)
      .then((d) => {
        const apelido = d?.apelido?.trim();
        const texto = apelido ? `Como posso te ajudar, ${apelido}?` : "Como posso te ajudar?";
        setMensagens([
          { id: "intro", texto, doUsuario: false },
          { id: "sugestoes", texto: "Se não souber por onde começar, segue algumas dicas!", doUsuario: false, sugestoes: true },
        ]);
      })
      .catch(() => {
        setMensagens([
          { id: "intro", texto: "Como posso te ajudar?", doUsuario: false },
          { id: "sugestoes", texto: "Se não souber por onde começar, segue algumas dicas!", doUsuario: false, sugestoes: true },
        ]);
      });
  }, [user?.id]);

  const listRef = useRef<FlatList<Mensagem>>(null);
  const mensagensRef = useRef<Mensagem[]>([]);
  mensagensRef.current = mensagens;

  const enviarMsg = useCallback(async (msg: string) => {
    if (!msg || carregando) return;

    setMensagens((prev) => [...prev, { id: `msg_${Date.now()}_u`, texto: msg, doUsuario: true }]);
    setTexto("");
    setCarregando(true);

    const timeoutId = setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        { id: `msg_${Date.now()}_wait`, texto: "Espera aí, que eu já te respondo!", doUsuario: false },
      ]);
    }, 30000);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          sessionId: `purg_id_${user?.id ?? "anonimo"}`,
        }),
      });

      clearTimeout(timeoutId);
      const text = await res.text();
      const data = text.trim() ? JSON.parse(text) : {};
      const resposta = data?.response ?? "Não recebi uma resposta. Tente novamente em instantes.";

      const next = [...mensagensRef.current, { id: `msg_${Date.now()}_b`, texto: resposta, doUsuario: false }];
      persistirHistorico(next, user?.id);
      setMensagens(next);
    } catch {
      clearTimeout(timeoutId);
      const next = [...mensagensRef.current, { id: `msg_${Date.now()}_err`, texto: "Erro ao conectar. Verifique sua conexão e tente novamente.", doUsuario: false }];
      persistirHistorico(next, user?.id);
      setMensagens(next);
    } finally {
      setCarregando(false);
    }
  }, [carregando, user?.id]);

  const enviar = useCallback(() => enviarMsg(texto.trim()), [texto, enviarMsg]);

  function renderMensagem({ item }: { item: Mensagem }) {
    if (item.sistema) {
      return (
        <View style={s.avisoSistema}>
          <Text style={s.avisoSistemaTexto}>{item.texto}</Text>
        </View>
      );
    }
    if (item.sugestoes) {
      if (mensagens.some(m => m.doUsuario)) return null;
      return (
        <View style={[s.bolha, s.bolhaBot]}>
          <Text style={s.nomeBot}>Purg</Text>
          <Text style={[s.bolhaTexto, s.textoBot]}>{item.texto}</Text>
          <View style={s.sugestoesChips}>
            {SUGESTOES.map((sugestao) => (
              <TouchableOpacity
                key={sugestao}
                style={[s.sugestaoChip, { borderColor: colors.primary }]}
                onPress={() => enviarMsg(sugestao)}
              >
                <Text style={[s.sugestaoTexto, { color: colors.primary }]}>{sugestao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
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
    <SafeAreaView edges={["bottom", "left", "right"]} style={[s.safe, { backgroundColor: colors.backgroundSecondary }]}>
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
      maxHeight: 60,
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
    avisoSistema: { alignSelf: "center", marginBottom: 10, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.backgroundSecondary, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    avisoSistemaTexto: { fontSize: 11, color: colors.textTertiary, fontStyle: "italic", textAlign: "center" },
    sugestoesChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    sugestaoChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
    sugestaoTexto: { fontSize: 13, fontWeight: "600" },
  });
}
