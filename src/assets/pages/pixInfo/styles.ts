import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingBottom: 36,
  },

  fullCenter: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  backBtn: {
    marginTop: 20,
    marginBottom: 16,
    alignSelf: "flex-start",
  },

  backBtnText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },

  valorBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  valorLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },

  valorText: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.primary,
  },

  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  qrImage: {
    width: 220,
    height: 220,
  },

  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },

  countdownLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  countdownValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },

  countdownUrgent: {
    color: "#dc2626",
  },

  pixCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  pixCardLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  pixChave: {
    color: "#fff",
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: 16,
    lineHeight: 20,
  },

  copyBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  copyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  copied: {
    backgroundColor: "#166534",
  },

  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },

  waitingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  confirmedIcon: {
    fontSize: 56,
    color: theme.colors.primary,
    marginBottom: 16,
  },

  confirmedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },

  confirmedSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  expiredIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  expiredTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },

  expiredSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  actionBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
