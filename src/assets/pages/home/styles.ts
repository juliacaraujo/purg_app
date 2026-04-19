import { StyleSheet } from "react-native";
import { theme } from "../../global/themes";

export const style = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingBottom: 36,
  },

  containerCenter: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  /* ── Header ── */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 24,
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  greetingBlock: {
    flex: 1,
  },

  greeting: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },

  welcomeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginTop: 1,
  },

  eyeBtn: {
    backgroundColor: "#e4e4e4",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },

  eyeText: {
    fontWeight: "600",
    color: theme.colors.textPrimary,
    fontSize: 12,
  },

  /* legacy — mantido para não quebrar refs */
  pageTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.textPrimary, marginTop: 20 },
  pageSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  welcome: { fontSize: 12, color: theme.colors.textSecondary },
  welcomeSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },

  /* ── Grid ── */
  grid: {
    gap: 12,
  },

  /* ── Hero card (Saldo) ── */
  heroCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },

  /* círculos decorativos internos (absolute) */
  heroDecor1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -50,
    right: -30,
  },

  heroDecor2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(52,199,89,0.08)",
    bottom: -30,
    right: 24,
  },

  heroLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 12,
  },

  heroValue: {
    color: theme.colors.primary,
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },

  /* ── Linha 2 colunas ── */
  row: {
    flexDirection: "row",
    gap: 12,
  },

  cardHalf: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  /* ── Card padrão ── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  cardFull: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  cardLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  cardValue: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "bold",
  },

  cardValueGreen: {
    color: theme.colors.primary,
    fontSize: 17,
    fontWeight: "bold",
  },

  hint: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: theme.colors.textSecondary,
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  /* ── Botões ── */
  btn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  btnPrimary: {
    backgroundColor: theme.colors.primary,
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },

  btnPrimaryText: {
    color: theme.colors.buttonText,
    fontWeight: "bold",
    fontSize: 16,
  },

  btnGhost: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },

  btnGhostText: {
    fontWeight: "600",
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
});
