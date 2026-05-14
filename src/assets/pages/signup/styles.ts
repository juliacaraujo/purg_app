import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#000",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  inputErro: {
    borderColor: "#e53e3e",
    borderWidth: 2,
  },

  erroTexto: {
    color: "#e53e3e",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#166534",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    backgroundColor: "#166534",
    opacity: 0.35,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  generoSecao: {
    marginBottom: 12,
    marginTop: 8,
  },

  generoTitulo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  generoRow: {
    flexDirection: "row",
    gap: 8,
  },

  generoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },

  generoBtnAtivo: {
    backgroundColor: "#166534",
  },

  generoBtnTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  generoBtnTextoAtivo: {
    color: "#fff",
  },

  criteriosContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },

  criteriosTitulo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },

  criterioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  criterioIcon: {
    fontSize: 8,
    color: "#aaa",
  },

  criterioTexto: {
    fontSize: 13,
    color: "#aaa",
  },

  criterioOk: {
    color: "#166534",
  },

  criterioErro: {
    color: "#FF3B30",
  },

  inputSenhaWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 4,
  },
  inputSenha: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  olhoBtn: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  olhoIcon: {
    width: 22,
    height: 22,
    tintColor: "#999",
  },
  linkText: {
    color: "#166534",
    fontSize: 14,
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  checkbox: {
    fontSize: 18,
    marginRight: 8,
  },
});
