import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  email: {
    fontWeight: "bold",
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  criteriosContainer: { marginTop: -8, marginBottom: 16, gap: 6 },
  criteriosTitulo: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 4 },
  criterioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  criterioIcon: { fontSize: 8, color: "#aaa" },
  criterioTexto: { fontSize: 13, color: "#aaa" },
  criterioOk: { color: "#166534" },
  criterioErro: { color: "#FF3B30" },
});
