
import { loginUser } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

const handleLogin = async () => {
  if (!email.trim() || !senha.trim()) {
    Alert.alert("Atenção", "Preencha email e senha.");
    return;
  }

  try {
    setLoading(true); // 🔹 Inicia o loading

    // 🔹 Chamada usando API centralizada
    const result = await loginUser(email, senha);

    console.log("Resposta do backend:", result);

    if (!result.success || !result.userId) {
      Alert.alert("Erro", result.message || "Falha no login.");
      return;
    }

    // 🔹 Salva no contexto global AuthProvider
    login({ id: Number(result.userId), email });


    // ❌ NÃO navega manualmente pra Home.
    // O RootNavigator vai trocar pro AppTabs automaticamente.
    // navigation.navigate("Home");
  } catch (error: any) {
    console.error(error);
    Alert.alert(
      "Erro",
      error?.message || "Não foi possível conectar ao servidor. Tente novamente."
    );
  } finally {
    setLoading(false); // 🔹 Finaliza o loading SEMPRE
  }
};
