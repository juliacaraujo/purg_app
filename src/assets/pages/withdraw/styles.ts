import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../../context/ThemeContext";

export const makeWithdrawStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: c.backgroundSecondary,
    padding: 20,
    paddingBottom: 36,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: c.textPrimary,
    marginTop: 20,
    marginBottom: 20,
  },

  infoBox: {
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: c.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: c.textPrimary,
  },

  input: {
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: c.textPrimary,
    borderWidth: 1,
    borderColor: c.inputBorder,
  },

  pixBox: {
    marginBottom: 16,
  },
  pixLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: c.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pixOption: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: c.card,
  },
  pixOptionActive: {
    borderColor: c.primary,
    backgroundColor: c.primary + "22",
  },
  pixText: {
    fontWeight: "bold",
    color: c.textPrimary,
  },

  sacarBtn: {
    backgroundColor: c.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  sacarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: c.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  historicoItem: {
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  historicoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  historicoValor: {
    fontSize: 15,
    fontWeight: "bold",
    color: c.textPrimary,
  },

  historicoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  historicoBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  historicoData: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },

  cancelarBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  cancelarText: {
    fontWeight: "900",
    color: "#ef4444",
    fontSize: 12,
  },
});
