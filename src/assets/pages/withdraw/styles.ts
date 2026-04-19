import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
  },

  infoBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    fontWeight: "800",
    color: "#64748b",
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
    color: "#0f172a",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  pixBox: {
    marginTop: 6,
    marginBottom: 16,
  },
  pixLabel: {
    fontWeight: "900",
    marginBottom: 8,
    color: "#0f172a",
  },
  pixOption: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pixOptionActive: {
    borderColor: "#14532d",
    backgroundColor: "#dcfce7",
  },
  pixText: {
    fontWeight: "800",
    color: "#0f172a",
  },

  sacarBtn: {
    backgroundColor: "#14532d",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  sacarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  pendenteBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendenteText: {
    fontWeight: "900",
    color: "#0f172a",
  },

  cancelarBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  cancelarText: {
    fontWeight: "900",
    color: "#ef4444",
  },

  historicoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 32,
    marginBottom: 12,
  },
  historicoBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  historicoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historicoLabel: {
    color: "#64748b",
    fontWeight: "700",
  },
  historicoValor: {
    fontWeight: "900",
    color: "#0f172a",
  },
  historicoStatus: {
    fontWeight: "800",
    color: "#64748b",
  },
});
