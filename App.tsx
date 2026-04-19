import React, { useState, useEffect, useRef, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
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
  Alert,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import imgHome from "./assets/home.png";
import imgPatrimonio from "./assets/patrimonio.png";
import imgObjetivos from "./assets/objetivos.png";
import imgRanking from "./assets/ranking.png";
import imgChat from "./assets/chat.png";
import imgPerfil from "./assets/perfil.png";
import imgOlhoAberto from "./assets/olho_aberto.png";
import imgOlhoFechado from "./assets/olho_fechado.png";
import imgBiometria from "./assets/biometria.png";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { isWeb, MAX_WIDTH } from "./src/assets/global/responsive";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme, lightColors } from "./src/context/ThemeContext";
import { makeLoginStyle } from "./src/assets/pages/login/styles";
import { getTema } from "./src/services/api";

// Telas — autenticação
import Signup from "./src/assets/pages/signup";
import RecoverAccount from "./src/assets/pages/recoverAccount";
import Terms from "./src/assets/pages/terms";
import CodeValidation from "./src/assets/pages/codeValidation";
import NewPassword from "./src/assets/pages/newPassword";

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
import { loginUser } from "./src/services/api";
import { loginBiometrico, isPasskeySupported } from "./src/services/biometria";

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ──────────────────────────────────────────────
   Tela de Login
────────────────────────────────────────────── */
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const { login } = useAuth();
  const loginStyle = useMemo(() => makeLoginStyle(lightColors), []);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const biometriaDisponivel = isPasskeySupported();

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const mostrarErro = (msg: string) => {
    setErro(msg);
    shake();
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      mostrarErro("Preencha o e-mail e a senha.");
      return;
    }
    try {
      setLoading(true);
      setErro("");
      const result = await loginUser(email, senha);
      if (!result.success || !result.userId) {
        mostrarErro(result.message || "E-mail ou senha incorretos.");
        return;
      }
      login({ id: Number(result.userId), email });
    } catch (error: any) {
      mostrarErro(error?.message || "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginBiometrico = async () => {
    if (!email.trim()) {
      mostrarErro("Informe seu e-mail antes de usar a biometria.");
      return;
    }
    try {
      setLoadingBio(true);
      setErro("");
      const resultado = await loginBiometrico(email.trim());
      login({ id: resultado.id, email: resultado.email });
    } catch (error: any) {
      mostrarErro(error?.message || "Falha na autenticação biométrica.");
    } finally {
      setLoadingBio(false);
    }
  };

  const bioStyle = useMemo(() => StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: lightColors.border,
      borderRadius: 12,
      paddingVertical: 13,
      marginTop: 10,
      backgroundColor: lightColors.background,
    },
    btnText: { fontSize: 15, fontWeight: "600", color: lightColors.textPrimary },
  }), []);

  const temErro = erro.length > 0;

  return (
    <View style={loginStyle.container}>
      <View style={loginStyle.boxTop}>
        <Image source={Logo} style={loginStyle.logo} />
      </View>

      <View style={loginStyle.boxMid}>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TextInput
            style={[loginStyle.input, temErro && { borderColor: "#FF3B30" }]}
            placeholder="e-mail@dominio.com"
            placeholderTextColor={lightColors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => { setEmail(v); setErro(""); }}
          />

          <View style={{ position: "relative", marginBottom: 0 }}>
            <TextInput
              style={[loginStyle.input, { marginBottom: 0 }, temErro && { borderColor: "#FF3B30" }]}
              placeholder="Senha"
              placeholderTextColor={lightColors.textTertiary}
              secureTextEntry={!showSenha}
              value={senha}
              onChangeText={(v) => { setSenha(v); setErro(""); }}
            />
            <TouchableOpacity
              onPress={() => setShowSenha((v) => !v)}
              style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" }}
            >
              <Image
                source={showSenha ? imgOlhoFechado : imgOlhoAberto}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {temErro && (
            <Text style={{ color: "#FF3B30", fontSize: 13, marginTop: 8, marginBottom: 4, textAlign: "center", fontWeight: "500" }}>
              {erro}
            </Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[loginStyle.loginButton, { marginTop: 12 }, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={loginStyle.loginButtonText}>
            {loading ? "Entrando..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={loginStyle.forgotPasswordButton}
          onPress={() => navigation.navigate("RecoverAccount")}
        >
          <Text style={loginStyle.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        {biometriaDisponivel && (
          <TouchableOpacity
            style={[bioStyle.btn, loadingBio && { opacity: 0.6 }]}
            onPress={handleLoginBiometrico}
            disabled={loadingBio}
          >
            <Image
              source={imgBiometria}
              style={{ width: 20, height: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text style={bioStyle.btnText}>
              {loadingBio ? "Verificando..." : "Entrar com biometria"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={loginStyle.separatorBox}>
          <View style={loginStyle.line} />
          <Text style={loginStyle.separatorText}>ou</Text>
          <View style={loginStyle.line} />
        </View>

        <TouchableOpacity
          style={loginStyle.signupButton}
          onPress={() => navigation.navigate("Signup")}
        >
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

/* ──────────────────────────────────────────────
   Tela de Chat (em construção)
────────────────────────────────────────────── */
import EmConstrucao from "./src/assets/purg_contrucao.png";

function ChatScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundSecondary, padding: 24 }}>
      <Image source={EmConstrucao} style={{ width: 280, height: 280, resizeMode: "contain" }} />
      <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginTop: 8 }}>Em construção</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: "center" }}>
        A tela de Chat está sendo desenvolvida. Em breve!
      </Text>
    </View>
  );
}

/* ──────────────────────────────────────────────
   Ícones do header (Perfil + Chat)
────────────────────────────────────────────── */
function HeaderRight({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 16 }}>
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
  return (
    <AuthStackNav.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={Signup} />
      <AuthStackNav.Screen name="RecoverAccount" component={RecoverAccount} />
      <AuthStackNav.Screen name="CodeValidation" component={CodeValidation} />
      <AuthStackNav.Screen name="NewPassword" component={NewPassword} />
      <AuthStackNav.Screen name="Terms" component={Terms} />
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

        const isFocused = state.index === index;

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
      <Tab.Screen name="Profile" component={Profile} options={{ headerShown: false, tabBarButton: () => null }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ headerShown: false, tabBarButton: () => null }} />
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
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Image source={Logo} style={{ width: 120, height: 120, resizeMode: "contain" }} />
      </View>
    );
  }

  return (
    <>
      <ThemeSync />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="AppTabs" component={AppTabs} />
          <RootStack.Screen
            name="Withdraw"
            component={Withdraw}
            options={({ navigation }) => ({
              animation: "slide_from_bottom",
              headerShown: true,
              title: "Sacar",
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
            name="Deposit"
            component={Deposit}
            options={({ navigation }) => ({
              animation: "slide_from_bottom",
              headerShown: true,
              title: "Depositar",
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
            name="PixInfo"
            component={PixInfo}
            options={({ navigation }) => ({
              animation: "slide_from_bottom",
              headerShown: true,
              title: "Informações Pix",
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
        </>
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthStack} />
      )}
      </RootStack.Navigator>
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
          Login: "login", Signup: "cadastro", RecoverAccount: "recuperar-conta",
          CodeValidation: "validar-codigo", NewPassword: "nova-senha", Terms: "termos",
        },
      },
      AppTabs: {
        screens: {
          Home: "home", "Patrimônio": "patrimonio", Objetivos: "objetivos",
          Ranking: "ranking", Profile: "perfil", Chat: "chat",
        },
      },
      Withdraw: "sacar", Deposit: "depositar", PixInfo: "pix",
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="auto" />
            {isWeb ? (
              <View style={appStyles.webOuter}>
                <View style={appStyles.webInner}>
                  <RootNavigator />
                </View>
              </View>
            ) : (
              <RootNavigator />
            )}
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
