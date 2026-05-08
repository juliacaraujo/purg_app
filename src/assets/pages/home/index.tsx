import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import imgOlhoAberto from "../../../../assets/olho_aberto.png";
import imgIndicar from "../../../../assets/indicar.png";
import imgOlhoFechado from "../../../../assets/olho_fechado.png";
import imgChat from "../../../../assets/chat.png";
import imgPerfil from "../../../../assets/perfil.png";
import imgFamilia from "../../../../assets/familia.png";
import { makeHomeStyle } from "./styles";
import avatarMap from "../../avatarMap";
import { BadgeInsignia } from "../../components/BadgeInsignia";
import { ModalSelecionarAvatar } from "../../components/ModalSelecionarAvatar";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useFamilia } from "../../../context/FamiliaContext";
import { useRestricao } from "../../../context/RestricaoContext";
import { useFocusEffect } from "@react-navigation/native";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { SeletorPerfilModal } from "../../components/SeletorPerfilModal";
import {
  ApiError,
  getCarteira,
  getDadosCadastro,
  getRendimentosUsuario,
  getHistoricoPatrimonio,
  getHistoricoRendimentos,
  getPinsUsuario,
  putAvatar,
  getVisualizacaoValores,
  putVisualizacaoValores,
} from "../../../services/api";
import GraficoLinha from "../../components/GraficoLinha";
import type { GraficoPoint } from "../../../types";

const LIGA_CORES: Record<string, { bg: string; text: string }> = {
  "Cobre":     { bg: "#B87333", text: "#fff" },
  "Bronze":    { bg: "#CD7F32", text: "#fff" },
  "Prata":     { bg: "#9E9E9E", text: "#fff" },
  "Ouro":      { bg: "#F0C040", text: "#333" },
  "Platina":   { bg: "#78909C", text: "#fff" },
  "Ametista":  { bg: "#8E44AD", text: "#fff" },
  "Safira":    { bg: "#1565C0", text: "#fff" },
  "Esmeralda": { bg: "#2E7D32", text: "#fff" },
  "Rubi":      { bg: "#C0392B", text: "#fff" },
  "Diamante":  { bg: "#29B6F6", text: "#fff" },
};

function getLigaCores(liga: string | null): { bg: string; text: string } | null {
  if (!liga) return null;
  const metal = liga.split(" ")[0];
  return LIGA_CORES[metal] ?? null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function moneyTrunc(value: number | string | null | undefined) {
  const v = Math.trunc((Number(value) || 0) * 100) / 100;
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function Home({ navigation }: { navigation: { navigate: (route: string) => void; setOptions: (opts: any) => void } }) {
  const { user, logout, updateUser } = useAuth();
  const { colors } = useTheme();
  const { atuandoComo } = useFamilia();
  const { menorDeIdade, permissoes } = useRestricao();
  const style = useMemo(() => makeHomeStyle(colors), [colors]);
  const [seletorVisivel, setSeletorVisivel] = useState(false);
  const [modalAvatar, setModalAvatar] = useState(false);
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);

  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const [nome, setNome] = useState("");

  const [saldo, setSaldo] = useState(0);
  const [investido, setInvestido] = useState(0);
  const [liga, setLiga] = useState<string | null>(null);

  const [rendimentoTotal, setRendimentoTotal] = useState(0);
  const [rendimentoDiario, setRendimentoDiario] = useState(0);
  const [pins, setPins] = useState<import("../../../types").PinUsuario[]>([]);
  const [historicoPatrimonio, setHistoricoPatrimonio] = useState<GraficoPoint[]>([]);
  const [historicoRendimentos, setHistoricoRendimentos] = useState<GraficoPoint[]>([]);

  const primeiroNome = useMemo(() => nome?.split(" ")[0] ?? "", [nome]);

  const patrimonio = useMemo(() => saldo + investido, [saldo, investido]);

  const { rendimentoMensal, taxaAa } = useMemo(() => {
    const pinsAtivos = pins.filter((p) => Number(p.quantidade_tokens_total_usuario) > 0);
    if (pinsAtivos.length === 0 || investido <= 0) return { rendimentoMensal: null, taxaAa: null };
    const totalQtd = pinsAtivos.reduce((acc, p) => acc + Number(p.quantidade_tokens_total_usuario), 0);
    const taxaAaPonderada = pinsAtivos.reduce((acc, p) => acc + Number(p.juros_a_a) * Number(p.quantidade_tokens_total_usuario), 0) / totalQtd;
    const taxaMensal = Math.pow(1 + taxaAaPonderada / 100, 1 / 12) - 1;
    const mensal = investido * taxaMensal;
    return { rendimentoMensal: mensal, taxaAa: taxaAaPonderada };
  }, [pins, investido]);


  const carregar = useCallback(async () => {
    if (!user?.id) return;
    // Evita requests paralelos em caso de refreshes rápidos
    if (loadingRef.current) return;
    loadingRef.current = true;
    const capturedUserId = user.id;
    try {
      setLoading(true);
      const [cad, cart, rend, hist, histRend, viz, pinsRes] = await Promise.allSettled([
        getDadosCadastro(capturedUserId),
        getCarteira(capturedUserId),
        getRendimentosUsuario(capturedUserId),
        getHistoricoPatrimonio(capturedUserId),
        getHistoricoRendimentos(capturedUserId),
        getVisualizacaoValores(capturedUserId),
        getPinsUsuario(capturedUserId),
      ]);
      // Se o usuário mudou durante o fetch (logout/troca), descarta resultado
      if (user?.id !== capturedUserId) return;
      if (cad.status === "fulfilled") {
        setNome(cad.value?.apelido ?? "");
      }
      if (cart.status === "fulfilled") {
        setSaldo(Number(cart.value?.saldo || 0));
        setInvestido(Number(cart.value?.investido || 0));
        setLiga(cart.value?.liga ?? null);
      }
      if (rend.status === "fulfilled") {
        setRendimentoTotal(rend.value?.rendimento_total ?? 0);
        setRendimentoDiario(rend.value?.ultimo_rendimento ?? 0);
      }
      if (hist.status === "fulfilled") {
        const items = Array.isArray(hist.value?.historico) ? hist.value.historico : [];
        setHistoricoPatrimonio(
          items.map((item) => ({ data: item.data, valor: Number(item.carteira_dia) || 0 }))
        );
      }
      if (histRend.status === "fulfilled") {
        const items = Array.isArray(histRend.value?.historico) ? histRend.value.historico : [];
        setHistoricoRendimentos(
          items.map((item) => ({ data: item.data, valor: Number(item.rendimento_dia) || 0 }))
        );
      }
      if (viz.status === "fulfilled") {
        setHidden(!viz.value);
      }
      if (pinsRes.status === "fulfilled") {
        setPins(Array.isArray(pinsRes.value?.data) ? pinsRes.value.data : []);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        Alert.alert("Erro", err.message || "Falha ao carregar dados.");
      } else {
        Alert.alert("Erro", "Não foi possível carregar a Home.");
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate("Indicacao")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={imgIndicar} style={{ width: 26, height: 26, tintColor: colors.textTertiary }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSeletorVisivel(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image
              source={imgFamilia}
              style={{ width: 26, height: 26, tintColor: atuandoComo ? "#E07000" : colors.textTertiary }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Chat")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={imgChat} style={{ width: 26, height: 26, tintColor: colors.textTertiary }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image source={imgPerfil} style={{ width: 28, height: 28, tintColor: colors.textTertiary }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [colors, atuandoComo]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  function handleToggleHidden() {
    const anterior = hidden;
    const novoHidden = !hidden;
    setHidden(novoHidden);
    if (user?.id) {
      putVisualizacaoValores(user.id, !novoHidden).catch(() => {
        setHidden(anterior);
        Alert.alert("Erro", "Não foi possível salvar a preferência de exibição.");
      });
    }
  }

  async function handleSalvarAvatar(avatarId: number) {
    if (!user?.id) return;
    try {
      setSalvandoAvatar(true);
      await putAvatar(user.id, avatarId);
      updateUser({ ...user, avatarId });
      setModalAvatar(false);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível atualizar o avatar.");
    } finally {
      setSalvandoAvatar(false);
    }
  }

  const handleDepositar = () => { navigation.navigate("Deposit"); };

  if (!user?.id) {
    return (
      <View style={style.containerCenter}>
        <Text style={style.pageTitle}>Home</Text>
        <Text style={style.pageSubtitle}>Faça login para visualizar seus dados</Text>
        <TouchableOpacity style={[style.btn, style.btnPrimary]} onPress={logout}>
          <Text style={style.btnPrimaryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <SwipeTabsWrapper currentTab="Home">
      <SeletorPerfilModal visible={seletorVisivel} onClose={() => setSeletorVisivel(false)} />
      <ScrollView
        contentContainerStyle={style.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Topo */}
        <View style={style.topRow}>
          <TouchableOpacity onPress={() => setModalAvatar(true)}>
            {user?.avatarId && avatarMap[user.avatarId] ? (
              <Image source={avatarMap[user.avatarId]} style={[style.avatar, { resizeMode: "cover" }]} />
            ) : (
              <View style={style.avatar}>
                <Text style={style.avatarText}>{primeiroNome?.[0]?.toUpperCase() || "P"}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={style.greetingBlock}>
            <Text style={style.greeting}>{getGreeting()},</Text>
            <Text style={style.welcomeName}>{primeiroNome || "…"}</Text>
          </View>

          {(() => {
            const ligaCores = getLigaCores(liga);
            return liga ? (
              <View style={{ alignItems: "center", gap: 4 }}>
                <BadgeInsignia ligaNome={liga} size={64} />
                {ligaCores && (
                  <View style={[style.badgeLiga, { backgroundColor: ligaCores.bg, alignSelf: "center" }]}>
                    <Text style={[style.badgeLigaText, { color: ligaCores.text }]}>{liga}</Text>
                  </View>
                )}
              </View>
            ) : null;
          })()}
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

        {/* Cards */}
        <View style={style.grid}>
          <View style={style.heroCard}>
            <View style={style.heroDecor1} />
            <View style={style.heroDecor2} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[style.heroLabel, { marginBottom: 0 }]}>Patrimônio</Text>
              <TouchableOpacity onPress={handleToggleHidden} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Image
                  source={hidden ? imgOlhoFechado : imgOlhoAberto}
                  style={{ width: 22, height: 22, tintColor: "rgba(255,255,255,0.6)" }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <Text style={style.heroValue}>
              {hidden ? "••••••" : moneyTrunc(patrimonio)}
            </Text>
          </View>

          <View style={style.card}>
            <Text style={style.cardLabel}>Rendimento Total</Text>
            <Text style={style.cardValueGreen}>
              {hidden ? "••••••" : moneyTrunc(rendimentoTotal)}
            </Text>
          </View>

          <View style={style.card}>
            <Text style={style.cardLabel}>Rendimento Diário</Text>
            <Text style={style.cardValueGreen}>
              {hidden ? "••••••" : moneyTrunc(rendimentoDiario)}
            </Text>
            {rendimentoMensal !== null && (
              <Text style={{ fontSize: 11, color: style.cardLabel.color, marginTop: 10 }}>
                {hidden ? "••••••" : `~${moneyTrunc(rendimentoMensal)}/mês`}
              </Text>
            )}
          </View>

          {taxaAa !== null && (
            <View style={style.card}>
              <Text style={style.cardLabel}>Rendimento Estimado ao Ano</Text>
              <Text style={style.cardValueGreen}>
                {hidden ? "••••••" : `${taxaAa.toFixed(2).replace(".", ",")}%`}
              </Text>
              <Text style={{ fontSize: 10, color: style.cardLabel.color, marginTop: 10, lineHeight: 14 }}>
                Já considera o IR cobrado sobre cada rendimento.
              </Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <TouchableOpacity
          style={[style.btn, style.btnPrimary, menorDeIdade && !permissoes.podeDepositar && { opacity: 0.4 }]}
          onPress={menorDeIdade && !permissoes.podeDepositar ? undefined : handleDepositar}
          disabled={menorDeIdade && !permissoes.podeDepositar}
        >
          <Text style={style.btnPrimaryText}>
            {menorDeIdade && !permissoes.podeDepositar ? "🔒 Depositar" : "Depositar"}
          </Text>
        </TouchableOpacity>

        {/* Gráficos de crescimento */}
        {(historicoPatrimonio.length >= 2 || historicoRendimentos.length >= 2) && (
          <View style={style.chartCard}>
            {historicoPatrimonio.length >= 2 && (
              <GraficoLinha
                pontos={historicoPatrimonio}
                cor="#4BC0C0"
                titulo="CRESCIMENTO DE PATRIMÔNIO"
                altura={140}
                formatarValor={moneyTrunc}
              />
            )}
            {historicoRendimentos.length >= 2 && (
              <View style={historicoPatrimonio.length >= 2 ? { marginTop: 20 } : undefined}>
                <GraficoLinha
                  pontos={historicoRendimentos}
                  cor="#A0D47C"
                  titulo="CRESCIMENTO DOS RENDIMENTOS"
                  altura={140}
                  formatarValor={(v) => `R$ ${v.toFixed(8).replace(".", ",")}`}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SwipeTabsWrapper>
    <ModalSelecionarAvatar
      visible={modalAvatar}
      onClose={() => setModalAvatar(false)}
      avatarAtual={user?.avatarId ?? null}
      onSalvar={handleSalvarAvatar}
      loading={salvandoAvatar}
      colors={colors}
      nomeInicial={primeiroNome?.[0]?.toUpperCase() || "P"}
    />
    </>
  );
}
