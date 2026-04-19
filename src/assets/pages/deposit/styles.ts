import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingBottom: 36,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginTop: 20,
    marginBottom: 20,
  },

  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },

  infoValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  depositBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  depositBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  historicoItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
    color: theme.colors.textPrimary,
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
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
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
