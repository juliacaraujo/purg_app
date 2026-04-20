import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  instrucao: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  // Área de aceite (aparece após scroll)
  acceptanceContainer: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 12,
  },
  acceptanceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    fontSize: 18,
    marginRight: 6,
  },
  plainText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  termLink: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },

  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  modalScroll: {
    flex: 1,
    marginBottom: 16,
  },

  feedbackBox: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedbackSucesso: {
    backgroundColor: "#f0fdf4",
    borderColor: "#166534",
  },
  feedbackErro: {
    backgroundColor: "#fef2f2",
    borderColor: "#c0392b",
  },
  feedbackTexto: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#111",
  },
});
