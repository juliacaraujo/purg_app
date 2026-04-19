import { Dimensions, Platform, StyleSheet } from "react-native";
import { theme } from "../../global/themes";

const H = Dimensions.get("window").height;

export const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  logo: {
    width: 400,
    height: 200,
    resizeMode: "contain",
  },
  text: {
    fontWeight: "bold",
    marginTop: 20,
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: theme.colors.textPrimary,
  },
  forgotPasswordButton: {
    alignItems: "center", // centralizado
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: theme.colors.primary, // verde do tema
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: "600",
  },
  separatorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  separatorText: {
    marginHorizontal: 10,
    color: theme.colors.textSecondary,
  },
  signupButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  signupButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 12, // 🔹 espaço entre o botão e os termos
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.textPrimary,
  },
});
