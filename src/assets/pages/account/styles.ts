import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingBottom: 36,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
  },

  pageSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  menu: {
    gap: 12,
  },

  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  menuText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },

  menuValue: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "55%",
  },

  centeredButton: {
    justifyContent: "center",
  },

  sacar: {
    backgroundColor: "#FF6B6B",
    shadowColor: "transparent",
    elevation: 0,
  },

  sacarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },

  logout: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  logoutText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },

  pinsSection: {
    marginTop: 28,
  },

  pinsSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: theme.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  pinsEmpty: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },

  pinCardSmall: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  pinTitleSmall: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: theme.colors.textPrimary,
  },

  pinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  pinLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  pinValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
  },
});
