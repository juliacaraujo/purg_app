import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isWeb, MAX_WIDTH } from "./src/assets/global/responsive";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

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

// Login (estilos + logo + api)
import { style as loginStyle } from "./src/assets/pages/login/styles";
import Logo from "./src/assets/logo.png";
import { loginUser } from "./src/services/api";
import { loginBiometrico, isPasskeySupported } from "./src/services/biometria";

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PRIMARY = "#34C759";

/* ──────────────────────────────────────────────
   Tela de Login
────────────────────────────────────────────── */
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const { login } = useAuth();

  const biometriaDisponivel = isPasskeySupported();

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }
    try {
      setLoading(true);
      const result = await loginUser(email, senha);
      if (!result.success || !result.userId) {
        Alert.alert("Erro", result.message || "Falha no login.");
        return;
      }
      login({ id: Number(result.userId), email });
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", error?.message || "Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginBiometrico = async () => {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe seu e-mail antes de usar a biometria.");
      return;
    }
    try {
      setLoadingBio(true);
      const resultado = await loginBiometrico(email.trim());
      login({ id: resultado.id, email: resultado.email });
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha na autenticação biométrica.");
    } finally {
      setLoadingBio(false);
    }
  };

  return (
    <View style={loginStyle.container}>
      <View style={loginStyle.boxTop}>
        <Image source={Logo} style={loginStyle.logo} />
      </View>

      <View style={loginStyle.boxMid}>
        <TextInput
          style={loginStyle.input}
          placeholder="email@dominio.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={{ position: "relative" }}>
          <TextInput
            style={loginStyle.input}
            placeholder="Senha"
            placeholderTextColor="#999"
            secureTextEntry={!showSenha}
            value={senha}
            onChangeText={setSenha}
          />
          <TouchableOpacity
            onPress={() => setShowSenha((v) => !v)}
            style={{ position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" }}
          >
            <MaterialCommunityIcons
              name={showSenha ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[loginStyle.loginButton, loading && { opacity: 0.6 }]}
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
            style={[bioLoginStyle.btn, loadingBio && { opacity: 0.6 }]}
            onPress={handleLoginBiometrico}
            disabled={loadingBio}
          >
            <MaterialCommunityIcons
              name="fingerprint"
              size={20}
              color="#111"
              style={{ marginRight: 8 }}
            />
            <Text style={bioLoginStyle.btnText}>
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

const bioLoginStyle = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
});

/* ──────────────────────────────────────────────
   Tela de Chat (em construção)
────────────────────────────────────────────── */
const EmConstrucao = require("./src/assets/purg_contrucao.png");

function ChatScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 24 }}>
      <Image source={EmConstrucao} style={{ width: 280, height: 280, resizeMode: "contain" }} />
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111", marginTop: 8 }}>Em construção</Text>
      <Text style={{ fontSize: 14, color: "#888", marginTop: 6, textAlign: "center" }}>
        A tela de Chat está sendo desenvolvida. Em breve!
      </Text>
    </View>
  );
}

/* ──────────────────────────────────────────────
   Ícones do header (Perfil + Chat)
────────────────────────────────────────────── */
function HeaderRight({ navigation }: { navigation: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 16 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Chat")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="message-text-outline" size={26} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="account-circle-outline" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

/* ──────────────────────────────────────────────
   Ícone animado cartoon para as tabs
────────────────────────────────────────────── */
function AnimatedTabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: true,
          friction: 4,
          tension: 130,
        }),
        Animated.sequence([
          Animated.timing(rotate, { toValue: -1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [focused]);

  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-20deg", "20deg"],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { rotate: rotateInterp }] }}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
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
   Tabs do app logado
   Home | Patrimônio | Objetivos | Ranking
   + ícones de Perfil e Chat no header
────────────────────────────────────────────── */
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: "#fff", elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { display: "none" },
        headerLeft: () => (
          <Image source={Logo} style={{ width: 80, height: 36, resizeMode: "contain", marginLeft: 14 }} />
        ),
        headerRight: () => <HeaderRight navigation={navigation} />,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { paddingTop: 6 },
      })}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="campfire" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Patrimônio"
        component={Account}
        options={{
          tabBarLabel: "Patrimônio",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="piggy-bank-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Objetivos"
        component={Objetivos}
        options={{
          tabBarLabel: "Objetivos",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="flag-variant-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={Ranking}
        options={{
          tabBarLabel: "Ranking",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="trophy-variant-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* Telas acessíveis via navegação mas sem botão no tab bar */}
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

/* ──────────────────────────────────────────────
   RootNavigator
   - Sem user → AuthStack
   - Com user → AppTabs + modais (Withdraw, Deposit, PixInfo, Profile, Chat)
────────────────────────────────────────────── */
function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <Image source={Logo} style={{ width: 120, height: 120, resizeMode: "contain" }} />
      </View>
    );
  }

  return (
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
              headerStyle: { backgroundColor: "#fff", elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
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
              headerStyle: { backgroundColor: "#fff", elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
                </TouchableOpacity>              ),
            })}
          />
          <RootStack.Screen
            name="PixInfo"
            component={PixInfo}
            options={({ navigation }) => ({
              animation: "slide_from_bottom",
              headerShown: true,
              title: "Informações Pix",
              headerStyle: { backgroundColor: "#fff", elevation: 0, shadowOpacity: 0 },
              headerShadowVisible: false,
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 14 }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
                </TouchableOpacity>
              ),
            })}
          />
        </>
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
}

const appStyles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
  },
  webInner: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_WIDTH,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
      <NavigationContainer>
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
    </SafeAreaProvider>
  );
}
