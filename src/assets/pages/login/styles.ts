import { Dimensions, Platform, StyleSheet } from "react-native";
import type { ThemeColors } from "../../../context/ThemeContext";

const H = Dimensions.get("window").height;

export const makeLoginStyle = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  boxTop: {
    ...Platform.select({
      web: { flex: 2 },
      default: { height: H / 3 },
    }),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  boxMid: {
    ...Platform.select({
      web: { flex: 3 },
      default: { height: H / 3 },
    }),
    width: "100%",
    paddingHorizontal: 37,
    justifyContent: "center",
    paddingBottom: 24,
  },
  logo: { width: 400, height: 200, resizeMode: "contain" },
  text: { fontWeight: "bold", marginTop: 20, fontSize: 28, color: c.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: c.textPrimary,
    backgroundColor: c.background,
  },
  forgotPasswordButton: { alignItems: "center", marginBottom: 10 },
  forgotPasswordText: { color: c.textSecondary, fontSize: 13, fontWeight: "500" },
  loginButton: {
    backgroundColor: c.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  separatorBox: { flexDirection: "row", alignItems: "center", marginVertical: 15 },
  line: { flex: 1, height: 1, backgroundColor: c.border },
  separatorText: { marginHorizontal: 10, color: c.textSecondary },
  signupButton: {
    backgroundColor: c.textPrimary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  signupButtonText: { color: c.background, fontSize: 16, fontWeight: "600" },
  footerText: { fontSize: 12, color: c.textSecondary, textAlign: "center", lineHeight: 18, marginTop: 12 },
  link: { fontWeight: "bold", color: c.textPrimary },
});
