import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  // Cabeçalho
  header: {
    backgroundColor: theme.colors.background,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarLetra: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  nome: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeAssinatura: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeAssinaturaTexto: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  idTexto: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Seções
  secao: {
    backgroundColor: theme.colors.background,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Linhas de dado
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  linhaLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  linhaValor: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  semDados: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: 8,
  },

  // Botão sair
  botaoSair: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
    alignItems: "center",
  },
  botaoSairTexto: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "600",
  },
});
