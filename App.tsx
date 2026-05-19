import React, { useState, useEffect, useRef, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import type { LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import imgHome from "./assets/home.png";
import imgPatrimonio from "./assets/patrimonio.png";
import imgObjetivos from "./assets/objetivos.png";
import imgRanking from "./assets/ranking.png";
import imgChat from "./assets/chat.png";
import imgPerfil from "./assets/perfil.png";
import imgFamilia from "./assets/familia.png";
import imgIndicar from "./assets/indicar.png";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { isWeb, MAX_WIDTH } from "./src/assets/global/responsive";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme, lightColors } from "./src/context/ThemeContext";
import { FamiliaProvider, useFamilia } from "./src/context/FamiliaContext";
import { EventosProvider, useEventos, type Evento } from "./src/context/EventosContext";
import { RestricaoProvider } from "./src/context/RestricaoContext";
import { RefreshProvider } from "./src/context/RefreshContext";

// Captura tokens de convite da URL antes de qualquer render (resolve timing com FamiliaContext)
if (typeof window !== "undefined") {
  try {
    const _p = new URLSearchParams(window.location.search);
    const _cg = _p.get("convite_guardiao");
    if (_cg) window.localStorage.setItem("purg_pending_convite_guardiao", _cg);
    const _ct = _p.get("convite");
    if (_ct) window.localStorage.setItem("purg_pending_invite", _ct);
    const _ref = _p.get("ref");
    if (_ref) window.localStorage.setItem("purg_pending_ref", _ref);
  } catch {}
}

const navigationRef = createNavigationContainerRef<any>();

// Fix tela branca no web ao pressionar botão de voltar do celular/browser.
// React Navigation reconstrói o estado a partir da URL quando popstate dispara,
// o que falha em navegadores com histórico complexo. Interceptamos o evento em
// modo captura (antes do React Navigation), restauramos a URL e delegamos o
// "voltar" ao navigationRef para que a transição ocorra corretamente.
if (isWeb && typeof window !== "undefined") {
  let _navUrl = window.location.href;

  const _origPush = window.history.pushState.bind(window.history);
  const _origReplace = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args: Parameters<typeof window.history.pushState>) => {
    _origPush(...args);
    _navUrl = window.location.href;
  };
  window.history.replaceState = (...args: Parameters<typeof window.history.replaceState>) => {
    _origReplace(...args);
    _navUrl = window.location.href;
  };

  window.addEventListener("popstate", (e) => {
    if (!navigationRef.isReady() || !navigationRef.canGoBack()) return;
    e.stopImmediatePropagation();
    window.history.pushState(null, document.title, _navUrl);
    navigationRef.goBack();
  }, { capture: true });
}
import { BannerAtuandoComo } from "./src/assets/components/BannerAtuandoComo";
import { SeletorPerfilModal } from "./src/assets/components/SeletorPerfilModal";
import AceitarConviteFamilia from "./src/assets/pages/familia/aceitarConvite";
import { makeLoginStyle } from "./src/assets/pages/login/styles";
import { getTema } from "./src/services/api";

// Telas — autenticação
import Signup from "./src/assets/pages/signup";
import RecoverAccount from "./src/assets/pages/recoverAccount";
import Terms from "./src/assets/pages/terms";
import CodeValidation from "./src/assets/pages/codeValidation";
import NewPassword from "./src/assets/pages/newPassword";
import LoginPassword from "./src/assets/pages/loginPassword";
import LoginBiometria from "./src/assets/pages/loginBiometria";

// Telas — app logado (tabs)
import Home from "./src/assets/pages/home";
import Account from "./src/assets/pages/account";
import Objetivos from "./src/assets/pages/objetivos";
import Ranking from "./src/assets/pages/ranking";

// Telas — app logado (modais / stack)
import Withdraw from "./src/assets/pages/withdraw";
import Deposit from "./src/assets/pages/deposit";
import PixInfo from "./src/assets/pages/pixInfo";
import Profile from "./src/assets/pages/profile";

import Logo from "./src/assets/logo.png";
import { tipoAcesso, getDadosCadastro, getPinNegociacaoStatus } from "./src/services/api";
import ChatScreen from "./src/assets/pages/chat";
import Indicacao from "./src/assets/pages/indicacao";
import SetupApelido from "./src/assets/pages/setupApelido";
import MolduraPreview from "./src/assets/pages/moldura-preview";
import RankingPerfil from "./src/assets/pages/ranking-perfil";
import SetupPinCadastro from "./src/assets/pages/setupPinCadastro";
import VideoAbertura from "./src/assets/pages/videoAbertura";
import PinRecuperacao from "./src/assets/pages/pinRecuperacao";


const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ──────────────────────────────────────────────
   Tela de Login
────────────────────────────────────────────── */
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const loginStyle = useMemo(() => makeLoginStyle(lightColors), []);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const mostrarErro = (msg: string) => { setErro(msg); shake(); };

  const handleVerificarEmail = async () => {
    if (!email.trim()) { mostrarErro("Informe seu e-mail."); return; }
    try {
      setLoading(true);
      setErro("");
      const { tipo } = await tipoAcesso(email.trim());
      if (tipo === "biometria") {
        navigation.navigate("LoginBiometria", { email: email.trim() });
      } else {
        navigation.navigate("LoginPassword", { email: email.trim(), primeiroAcesso: tipo === null });
      }
    } catch (e: any) {
      mostrarErro(e?.message || "Não foi possível verificar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const temErro = erro.length > 0;

  return (
    <View style={loginStyle.container}>
      <View style={loginStyle.boxTop}>
        <Image source={Logo} style={loginStyle.logo} />
      </View>

      <View style={loginStyle.boxMid}>
        <Text style={{ fontSize: 12, fontWeight: "500", color: lightColors.textTertiary, marginBottom: 6 }}>Login:</Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TextInput
            style={[loginStyle.input, temErro && { borderColor: "#FF3B30" }]}
            placeholder="e-mail@exemplo.com"
            placeholderTextColor={lightColors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => { setEmail(v); setErro(""); }}
          />

          {temErro && (
            <Text style={{ color: "#FF3B30", fontSize: 13, marginTop: 4, marginBottom: 4, textAlign: "center", fontWeight: "500" }}>
              {erro}
            </Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[loginStyle.loginButton, { marginTop: 4 }, loading && { opacity: 0.6 }]}
          onPress={handleVerificarEmail}
          disabled={loading}
        >
          <Text style={loginStyle.loginButtonText}>{loading ? "Verificando..." : "Continuar"}</Text>
        </TouchableOpacity>

        <View style={loginStyle.separatorBox}>
          <View style={loginStyle.line} />
          <Text style={loginStyle.separatorText}>ou</Text>
          <View style={loginStyle.line} />
        </View>

        <TouchableOpacity style={loginStyle.signupButton} onPress={() => navigation.navigate("Signup")}>
          <Text style={loginStyle.signupButtonText}>Criar uma conta</Text>
        </TouchableOpacity>

        <Text style={loginStyle.footerText}>
          Ao clicar em <Text style={loginStyle.link}>Criar uma conta</Text>, você
          concorda com os nossos{" "}
          <Text style={loginStyle.link}>Termos de Serviço</Text> e com a{" "}
          <Text style={loginStyle.link}>Política de Privacidade</Text>.
        </Text>
      </View>
    </View>
  );
}


/* Exibe Alert após auto-aceite de convite pendente (pós-login) */
function ConvitePendenteAlerta() {
  const { convitePendenteResultado, limparConvitePendenteResultado } = useFamilia();
  const { freshLogin } = useAuth();

  useEffect(() => {
    if (!convitePendenteResultado || freshLogin) return;
    if (convitePendenteResultado === "aceito") {
      Alert.alert("Convite aceito!", "Você agora tem um responsável vinculado à sua conta.");
    } else {
      Alert.alert("Convite pendente", "Não foi possível processar o convite automaticamente. Verifique o link e tente novamente.");
    }
    limparConvitePendenteResultado();
  }, [convitePendenteResultado]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/* Alert para fallback de link de e-mail: convite de guardião aceito automaticamente */
function ConviteGuardiaoPendenteAlerta() {
  const { conviteGuardiaoPendenteResultado, limparConviteGuardiaoPendenteResultado } = useFamilia();
  const { freshLogin } = useAuth();
  useEffect(() => {
    if (!conviteGuardiaoPendenteResultado || freshLogin) return;
    if (conviteGuardiaoPendenteResultado === "aceito") {
      Alert.alert("Vínculo ativado!", "Você agora é responsável por este dependente.");
    } else {
      Alert.alert("Convite não processado", "Não foi possível aceitar o convite automaticamente. Tente pelo app.");
    }
    limparConviteGuardiaoPendenteResultado();
  }, [conviteGuardiaoPendenteResultado]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/* Modal de eventos pendentes (informativos e interativos) */
function ModalEventos() {
  const { eventos, dispensarEvento, aceitarEvento, rejeitarEvento } = useEventos();
  const { freshLogin } = useAuth();
  const { colors } = useTheme();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const evento: Evento | undefined = eventos[0];
  if (!evento || freshLogin) return null;

  const isInterativo = evento.tipo === "interativo";

  const handleAceitar = async () => {
    try {
      setProcessando(true);
      setErro(null);
      await aceitarEvento(evento);
      Alert.alert("Vínculo ativado!", "O convite foi aceito com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Não foi possível processar o convite.");
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitar = async () => {
    try {
      setProcessando(true);
      setErro(null);
      await rejeitarEvento(evento);
      Alert.alert("Convite recusado", "O convite foi recusado com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Não foi possível recusar o convite.");
    } finally {
      setProcessando(false);
    }
  };

  const handleDispensar = async () => {
    await dispensarEvento(evento);
    setErro(null);
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginBottom: 10 }}>
            {evento.titulo}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: erro ? 8 : 20 }}>
            {evento.mensagem}
          </Text>
          {erro && (
            <Text style={{ fontSize: 13, color: "#FF3B30", textAlign: "center", marginBottom: 12 }}>{erro}</Text>
          )}
          {isInterativo ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: processando ? 0.5 : 1 }}
                onPress={handleRejeitar}
                disabled={processando}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: processando ? 0.6 : 1 }}
                onPress={handleAceitar}
                disabled={processando}
              >
                {processando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: "#fff", fontWeight: "700" }}>Aceitar</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              onPress={handleDispensar}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Entendido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ──────────────────────────────────────────────
   Ícones do header (Perfil + Chat)
────────────────────────────────────────────── */

function HeaderRight({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { atuandoComo } = useFamilia();
  const [seletorVisivel, setSeletorVisivel] = useState(false);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 16 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Indicacao")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image source={imgIndicar} style={{ width: 26, height: 26, tintColor: colors.textTertiary }} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setSeletorVisivel(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image
          source={imgFamilia}
          style={{ width: 26, height: 26, tintColor: atuandoComo ? "#E07000" : colors.textTertiary }}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Chat")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image source={imgChat} style={{ width: 26, height: 26, tintColor: colors.textTertiary }} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Image source={imgPerfil} style={{ width: 28, height: 28, tintColor: colors.textTertiary }} resizeMode="contain" />
      </TouchableOpacity>
      <SeletorPerfilModal visible={seletorVisivel} onClose={() => setSeletorVisivel(false)} />
    </View>
  );
}

function AnimatedTabIconImage({ source, size, focused, color }: { source: any; size: number; focused: boolean; color?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, friction: 4, tension: 130 }),
        Animated.sequence([
          Animated.timing(rotate, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    }
  }, [focused]);

  const rotateInterp = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-20deg", "20deg"] });

  return (
    <Animated.View style={{ transform: [{ scale }, { rotate: rotateInterp }] }}>
      <Image source={source} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />
    </Animated.View>
  );
}

/* ──────────────────────────────────────────────
   Stack de autenticação
────────────────────────────────────────────── */
function AuthStack() {
  const { colors } = useTheme();

  const backOptions = ({ navigation }: { navigation: any }) => ({
    headerShown: true,
    title: "",
    headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
    headerShadowVisible: false,
    headerTintColor: colors.textPrimary,
    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    ),
  });

  return (
    <AuthStackNav.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="LoginPassword" component={LoginPassword} options={backOptions} />
      <AuthStackNav.Screen name="LoginBiometria" component={LoginBiometria} options={({ navigation }) => ({ ...backOptions({ navigation }), headerLeft: () => null })} />
      <AuthStackNav.Screen name="Signup" component={Signup} options={backOptions} />
      <AuthStackNav.Screen name="RecoverAccount" component={RecoverAccount} options={{ headerShown: false }} />
      <AuthStackNav.Screen name="CodeValidation" component={CodeValidation} options={{ headerShown: false }} />
      <AuthStackNav.Screen name="NewPassword" component={NewPassword} options={{ headerShown: false }} />
      <AuthStackNav.Screen name="Terms" component={Terms} options={backOptions} />
      <AuthStackNav.Screen
        name="SetupPinCadastro"
        component={SetupPinCadastro}
        options={{ gestureEnabled: false }}
      />
    </AuthStackNav.Navigator>
  );
}

/* ──────────────────────────────────────────────
   Tab bar customizada
────────────────────────────────────────────── */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const paddingBottom = isWeb ? Math.max(insets.bottom, 10) : insets.bottom;

  // No iOS PWA (Safari standalone), o state prop pode não re-renderizar quando
  // o usuário troca de aba — o Safari interfere no ciclo de URL do React Navigation
  // e state.index fica travado em 0. Assinamos o navigationRef diretamente como
  // fonte de verdade para garantir o índice correto em todas as plataformas.
  const [activeIndex, setActiveIndex] = useState(state.index);

  useEffect(() => {
    if (!isWeb) return;
    const unsubscribe = navigationRef.addListener("state", () => {
      if (!navigationRef.isReady()) return;
      const rootState = navigationRef.getState();
      const appTabsRoute = rootState?.routes?.find((r: any) => r.name === "AppTabs");
      const tabIdx = appTabsRoute?.state?.index;
      if (typeof tabIdx === "number") setActiveIndex(tabIdx);
    });
    return unsubscribe;
  }, []);

  // Sincroniza com o prop (nativo e render inicial)
  useEffect(() => { setActiveIndex(state.index); }, [state.index]);

  return (
    <View style={[
      tabBarStyles.bar,
      {
        paddingBottom,
        backgroundColor: colors.tabBar,
        borderTopColor: colors.border,
      },
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (!options.tabBarIcon) return null;

        const isFocused = activeIndex === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tabBarStyles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? colors.primary : colors.textTertiary,
              size: 26,
            })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
});

/* ──────────────────────────────────────────────
   Tabs do app logado
────────────────────────────────────────────── */
function AppTabs() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { display: "none" },
        headerLeft: () => (
          <Image source={Logo} style={{ width: 80, height: 36, resizeMode: "contain", marginLeft: 14, tintColor: isDark ? "#ffffff" : undefined }} />
        ),
        headerRight: () => <HeaderRight navigation={navigation} />,
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{
        tabBarIcon: ({ size, focused, color }) => <AnimatedTabIconImage source={imgHome} size={size} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="Patrimônio" component={Account} options={{
        tabBarIcon: ({ size, focused, color }) => <AnimatedTabIconImage source={imgPatrimonio} size={size} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="Objetivos" component={Objetivos} options={{
        tabBarIcon: ({ size, focused, color }) => <AnimatedTabIconImage source={imgObjetivos} size={size} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="Ranking" component={Ranking} options={{
        tabBarIcon: ({ size, focused, color }) => <AnimatedTabIconImage source={imgRanking} size={size} focused={focused} color={color} />,
      }} />
      <Tab.Screen name="RankingPerfil" component={RankingPerfil} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Indicacao" component={Indicacao} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

/* ──────────────────────────────────────────────
   RootNavigator
────────────────────────────────────────────── */
function ThemeSync() {
  const { user } = useAuth();
  const { setDark } = useTheme();
  useEffect(() => {
    if (!user?.id) return;
    getTema(user.id).then((data) => setDark(data.tema === "escuro")).catch(() => {});
  }, [user?.id]);
  return null;
}

function RootNavigator() {
  const { user, isLoading, freshLogin, clearFreshLogin } = useAuth();
  const { colors, isDark } = useTheme();
  const [verificando, setVerificando] = useState(true);
  const [precisaApelido, setPrecisaApelido] = useState(false);
  const [precisaPin, setPrecisaPin] = useState(false);
  const prevUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    const prevId = prevUserIdRef.current;
    prevUserIdRef.current = user?.id ?? null;

    if (!user?.id) { setVerificando(false); return; }
    // Troca de perfil familiar (guardião ↔ tutelado): não revalida setup
    if (prevId !== null) return;

    setVerificando(true);
    Promise.all([
      getDadosCadastro(user.id),
      getPinNegociacaoStatus(user.id),
    ])
      .then(([d, pinStatus]) => {
        setPrecisaApelido(!d?.apelido);
        setPrecisaPin(!pinStatus.senha_cadastrada);
      })
      .catch(() => {
        setPrecisaApelido(false);
        setPrecisaPin(false);
      })
      .finally(() => setVerificando(false));
  }, [user?.id]);

  let content: React.ReactNode;
  if (isLoading || (user && verificando)) {
    content = (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Image source={Logo} style={{ width: 120, height: 120, resizeMode: "contain" }} />
      </View>
    );
  } else if (user && precisaApelido) {
    content = <SetupApelido onConcluido={() => setPrecisaApelido(false)} />;
  } else if (user && precisaPin) {
    content = <SetupPinCadastro onConcluido={() => setPrecisaPin(false)} />;
  } else {
    content = (
      <>
        <ThemeSync />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
        <>
          <RootStack.Screen name="AppTabs" component={AppTabs} />
          <RootStack.Screen
            name="MolduraPreview"
            component={MolduraPreview}
            options={({ navigation }) => ({
              headerShown: true,
              title: "",
              headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              ),
            })}
          />
          <RootStack.Screen
            name="Withdraw"
            component={Withdraw}
            options={({ navigation }) => ({
              animation: "slide_from_bottom",
              headerShown: true,
              headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.backgroundSecondary },
              headerTitle: () => (
                <Image source={Logo} style={{ width: 80, height: 36, resizeMode: "contain", tintColor: isDark ? "#ffffff" : undefined }} />
              ),
              headerLeft: () => null,
              headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 16 }}>
                  <TouchableOpacity onPress={() => navigation.navigate("AppTabs", { screen: "Chat" })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Image source={imgChat} style={{ width: 26, height: 26, tintColor: colors.textTertiary }} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Image source={imgPerfil} style={{ width: 28, height: 28, tintColor: colors.textTertiary }} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              ),
            })}
          />
          <RootStack.Screen
            name="Deposit"
            component={Deposit}
            options={({ navigation }) => ({
              animation: "slide_from_bottom",
              headerShown: true,
              headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.backgroundSecondary },
              headerTitle: () => (
                <Image source={Logo} style={{ width: 80, height: 36, resizeMode: "contain", tintColor: isDark ? "#ffffff" : undefined }} />
              ),
              headerLeft: () => null,
              headerRight: () => (
                <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 16 }}>
                  <TouchableOpacity onPress={() => navigation.navigate("AppTabs", { screen: "Chat" })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Image source={imgChat} style={{ width: 26, height: 26, tintColor: colors.textTertiary }} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate("AppTabs", { screen: "Profile" })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Image source={imgPerfil} style={{ width: 28, height: 28, tintColor: colors.textTertiary }} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              ),
            })}
          />
          <RootStack.Screen
            name="PixInfo"
            component={PixInfo}
            options={{
              animation: "slide_from_bottom",
              headerShown: true,
              title: "Informações Pix",
              headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              contentStyle: { backgroundColor: colors.backgroundSecondary },
              headerLeft: () => null,
            }}
          />
        </>
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthStack} />
      )}
          <RootStack.Screen
            name="PinRecuperacao"
            component={PinRecuperacao}
            options={({ navigation }) => ({
              headerShown: true,
              title: "",
              headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              ),
            })}
          />
          <RootStack.Screen
            name="AceitarConviteFamilia"
            component={AceitarConviteFamilia}
            options={({ navigation }) => ({
              headerShown: true,
              title: "",
              headerStyle: { backgroundColor: colors.header, elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary,
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              ),
            })}
          />
      </RootStack.Navigator>
      </>
    );
  }

  return (
    <>
      {content}
      {user && freshLogin && <VideoAbertura onConcluido={clearFreshLogin} />}
    </>
  );
}

const appStyles = StyleSheet.create({
  webOuter: { flex: 1, backgroundColor: "#e8e8e8", alignItems: "center" },
  webInner: { flex: 1, width: "100%", maxWidth: MAX_WIDTH, backgroundColor: "#fff", overflow: "hidden" },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: LinkingOptions<any> = {
  prefixes: ["https://purg.com.br", "purg://"],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: "login", LoginPassword: "login/password", LoginBiometria: "login/biometria", Signup: "cadastro",
          RecoverAccount: "recuperar-conta", CodeValidation: "validar-codigo",
          NewPassword: "nova-senha", Terms: "termos",
        },
      },
      AppTabs: {
        screens: {
          Home: "home", "Patrimônio": "patrimonio", Objetivos: "objetivos",
          Ranking: "ranking", RankingPerfil: "ranking/perfil/:usuario_id",
          Profile: "perfil", Chat: "chat", Indicacao: "indicacao",
        },
      },
      Withdraw: "sacar", Deposit: "depositar", PixInfo: "pix",
      MolduraPreview: "preview-molduras",
      PinRecuperacao: "pin-recuperacao",
      AceitarConviteFamilia: "familia/aceitar-convite",
    },
  },
};

function VersionGuard() {
  useEffect(() => {
    if (!isWeb) return;
    const current = (window as any).__BUILD_TS;
    if (!current) return;
    fetch(`/version.json?_=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => { if (data.ts !== current) window.location.reload(); })
      .catch(() => {});
  }, []);
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <FamiliaProvider>
            <EventosProvider>
            <RestricaoProvider>
            <RefreshProvider>
            <VersionGuard />
            <ConvitePendenteAlerta />
            <ConviteGuardiaoPendenteAlerta />
            <ModalEventos />
            <NavigationContainer ref={navigationRef} linking={linking} documentTitle={{ formatter: () => "Purg" }}>
              <StatusBar style="auto" />
              {isWeb ? (
                <View style={appStyles.webOuter}>
                  <View style={appStyles.webInner}>
                    <BannerAtuandoComo />
                    <RootNavigator />
                  </View>
                </View>
              ) : (
                <>
                  <BannerAtuandoComo />
                  <RootNavigator />
                </>
              )}
            </NavigationContainer>
            </RefreshProvider>
            </RestricaoProvider>
            </EventosProvider>
          </FamiliaProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
