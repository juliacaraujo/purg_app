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
    fontSize: 26,
    fontWeight: "900",
    color: c.textPrimary,
    marginBottom: 20,
    marginTop: 4,
  },

  infoBox: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    backgroundColor: c.card,
  },
  infoLabel: {
    fontWeight: "800",
    color: c.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
    color: c.textPrimary,
  },

  input: {
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    fontWeight: "800",
    color: c.textPrimary,
    backgroundColor: c.card,
    fontSize: 16,
  },

  pixBox: {
    marginTop: 6,
    marginBottom: 16,
  },
  pixLabel: {
    fontWeight: "900",
    marginBottom: 8,
    color: c.textPrimary,
    fontSize: 14,
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
    fontWeight: "800",
    color: c.textPrimary,
  },

  sacarBtn: {
    backgroundColor: c.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  sacarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  pendenteBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: c.card,
  },
  pendenteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pendenteText: {
    fontWeight: "900",
    color: c.textPrimary,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
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
    color: c.textPrimary,
    marginTop: 32,
    marginBottom: 12,
  },
  historicoBox: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: c.card,
  },
  historicoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  historicoLabel: {
    color: c.textSecondary,
    fontWeight: "700",
  },
  historicoValor: {
    fontWeight: "900",
    color: c.textPrimary,
  },
  historicoStatus: {
    fontWeight: "800",
    color: c.textSecondary,
  },
  historicoObs: {
    fontSize: 12,
    color: "#991b1b",
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 18,
  },
});
