import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import imgIndicar from "../../../../assets/indicar.png";
import imgPerfil from "../../../../assets/perfil.png";
import imgRanking from "../../../../assets/ranking.png";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { makeProfileStyle } from "../profile/styles";
import { getIndicacoes } from "../../../services/api";
import ScrollViewRefresh from "../../components/ScrollViewRefresh";
import { isWeb } from "../../global/responsive";

type DadosIndicacao = {
  codigo_indicacao: string;
  pontos_indicacao: number;
  indicados: { indicado_id: number; nome_completo: string }[];
};

const PREP = new Set(["da", "de", "do", "das", "dos", "e", "a", "o"]);
function titleCase(str: string) {
  return str.toLowerCase().split(" ").filter(Boolean).map((w, i) =>
    i > 0 && PREP.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
  ).join(" ");
}

const passos = [
  { img: imgIndicar, texto: "Compartilhe seu link exclusivo com amigos e familiares." },
  { img: imgPerfil,  texto: "Seu amigo se cadastra pelo link e é vinculado a você." },
  { img: imgRanking, texto: "A cada meta concluída pelo seu indicado, você ganha 10% dos pontos que ele também recebeu." },
];

export default function Indicacao() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const style = useMemo(() => makeProfileStyle(colors), [colors]);
  const s = useMemo(() => makeIndicacaoStyle(), []);

  const [dados, setDados] = useState<DadosIndicacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);

  const link = dados ? `https://purg.com.br/cadastro?ref=${dados.codigo_indicacao}` : "";

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setErro(null);
      const res = await getIndicacoes(user.id);
      setDados(res);
    } catch {
      setErro("Não foi possível carregar seus dados de indicação.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar();
  }, [carregar]);

  const handleCopiar = useCallback(async () => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }, [link]);

  const handleCompartilhar = useCallback(async () => {
    if (!link || compartilhando) return;
    setCompartilhando(true);
    const mensagem = `Venha conhecer a *Purg*!\n\nAqui vou te ajudar a criar o seu patrimônio. conquistando os seus objetivos.\n\n${link}`;
    try {
      if (isWeb && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: mensagem });
      } else {
        await Share.share({ message: mensagem });
      }
    } catch {}
    setCompartilhando(false);
  }, [link, compartilhando]);

  if (loading) {
    return (
      <View style={[style.center, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalIndicados = dados?.indicados?.length ?? 0;

  return (
    <ScrollViewRefresh
      style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
    >
      {/* Como funciona */}
      <View style={style.secao}>
        <Text style={[style.secaoTitulo, { marginBottom: 12 }]}>Como funciona</Text>
        {passos.map((item, i) => (
          <View key={i} style={[s.passoRow, i > 0 && { marginTop: 12 }]}>
            <View style={[s.passoIcone, { backgroundColor: colors.primary + "22" }]}>
              <Image source={item.img} style={{ width: 18, height: 18, tintColor: colors.primary }} resizeMode="contain" />
            </View>
            <Text style={[s.passoTexto, { color: colors.textSecondary }]}>{item.texto}</Text>
          </View>
        ))}
      </View>

      {/* Link */}
      <View style={style.secao}>
        <Text style={[style.secaoTitulo, { marginBottom: 8 }]}>Seu link de convite</Text>
        <Text style={[s.desc, { color: colors.textSecondary }]}>
          Quem se cadastrar por esse link será vinculado a você automaticamente.
        </Text>

        {erro ? (
          <View style={s.erroBox}>
            <Text style={s.erroTexto}>{erro}</Text>
            <TouchableOpacity onPress={carregar} style={{ marginTop: 8 }}>
              <Text style={[s.erroTexto, { textDecorationLine: "underline" }]}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[s.linkBox, { backgroundColor: colors.backgroundSecondary, borderColor: copiado ? colors.primary : colors.border }]}
              onPress={handleCopiar}
              activeOpacity={0.7}
            >
              <Text style={[s.linkTexto, { color: colors.primary }]} numberOfLines={1}>{link}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.btnCompartilhar,
                { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary },
                compartilhando && { opacity: 0.6 },
              ]}
              onPress={handleCompartilhar}
              disabled={compartilhando}
            >
              {compartilhando
                ? <ActivityIndicator color={isDark ? colors.textPrimary : "#fff"} size="small" />
                : (
                  <Text style={[s.btnTexto, { color: isDark ? colors.textPrimary : "#fff" }]}>Compartilhar</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={[s.btnCopiar, { borderColor: colors.border }]} onPress={handleCopiar}>
              <Text style={[s.btnTexto, { color: colors.textSecondary }]}>
                {copiado ? "✓ Link copiado!" : "Copiar link"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats */}
      <View style={style.secao}>
        <Text style={[style.secaoTitulo, { marginBottom: 12 }]}>Indicação</Text>

        <View style={[s.statCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Image source={imgIndicar} style={{ width: 22, height: 22, tintColor: colors.primary }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Total de indicados</Text>
            <Text style={[s.statValor, { color: colors.textSecondary }]}>
              {totalIndicados} {totalIndicados === 1 ? "pessoa" : "pessoas"}
            </Text>
          </View>
        </View>

        <View style={[s.statCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginBottom: 0 }]}>
          <Image source={imgRanking} style={{ width: 22, height: 22, tintColor: colors.primary }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Pontos ganhos por metas atingidas dos indicados</Text>
            <Text style={[s.statValor, { color: colors.textSecondary }]}>
              {dados?.pontos_indicacao ?? 0} pts
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de indicados */}
      {!erro && totalIndicados > 0 && (
        <View style={style.secao}>
          <Text style={[style.secaoTitulo, { marginBottom: 12 }]}>
            Seus indicados ({totalIndicados})
          </Text>
          {dados!.indicados.map((ind) => (
            <View
              key={ind.indicado_id}
              style={[s.indicadoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            >
              <View style={[s.indicadoAvatar, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[s.indicadoLetra, { color: colors.primary }]}>
                  {ind.nome_completo?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <Text style={[s.indicadoNome, { color: colors.textPrimary }]}>
                {titleCase(ind.nome_completo)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollViewRefresh>
  );
}

const makeIndicacaoStyle = () =>
  StyleSheet.create({
    desc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    statCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      gap: 12,
      marginBottom: 10,
    },
    statLabel: { fontSize: 12 },
    statValor: { fontSize: 18, fontWeight: "700", marginTop: 2 },
    linkBox: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
      gap: 10,
    },
    linkTexto: { flex: 1, fontSize: 14, fontWeight: "500" },
    copiarLabel: { fontSize: 12, fontWeight: "700" },
    btnCompartilhar: {
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 8,
    },
    btnCopiar: {
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1,
    },
    btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    btnTexto: { fontSize: 14, fontWeight: "600" },
    erroBox: {
      backgroundColor: "#c0392b22",
      borderWidth: 1,
      borderColor: "#c0392b",
      borderRadius: 10,
      padding: 14,
      alignItems: "center",
    },
    erroTexto: { color: "#c0392b", fontSize: 13, fontWeight: "600", textAlign: "center" },
    indicadoCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      gap: 12,
    },
    indicadoAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    indicadoLetra: { fontSize: 15, fontWeight: "700" },
    indicadoNome: { fontSize: 14, fontWeight: "500", flex: 1 },
    passoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    passoIcone: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    passoTexto: { flex: 1, fontSize: 13, lineHeight: 18, paddingTop: 7 },
  });
