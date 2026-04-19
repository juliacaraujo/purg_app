// Implementação web — carregada pelo Metro/Webpack apenas no bundle web.
// Usa @simplewebauthn/browser (browser-only). A versão nativa está em biometria.ts.
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import {
  biometriaCadastroIniciar,
  biometriaCadastroConcluir,
  biometriaLoginIniciar,
  biometriaLoginConcluir,
} from "./api";

export type LoginBiometricoResult = { id: number; email: string; nome: string };

function traduzirErro(e: any): Error {
  const name = e?.name ?? "";
  if (name === "NotAllowedError")
    return new Error("Operação cancelada ou não autorizada.");
  if (name === "InvalidStateError")
    return new Error("Esta chave já está registrada neste dispositivo.");
  if (name === "NotSupportedError")
    return new Error("Passkeys não são suportadas neste navegador.");
  if (name === "SecurityError")
    return new Error("Erro de segurança — a aplicação precisa estar em HTTPS.");
  return new Error(e?.message || "Erro na autenticação biométrica.");
}

/** Verifica se WebAuthn / passkeys são suportados no navegador atual. */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/** Registra a biometria do usuário logado. */
export async function cadastrarBiometria(): Promise<void> {
  const options = await biometriaCadastroIniciar();
  try {
    const credential = await startRegistration({ optionsJSON: options });
    await biometriaCadastroConcluir(credential);
  } catch (e: any) {
    throw traduzirErro(e);
  }
}

/** Autentica via biometria. Retorna dados do usuário para popular o AuthContext. */
export async function loginBiometrico(email: string): Promise<LoginBiometricoResult> {
  // biometriaLoginIniciar lança ApiError com status 404 se não houver biometria cadastrada
  const options = await biometriaLoginIniciar(email);
  try {
    const assertion = await startAuthentication({ optionsJSON: options });
    const resultado = await biometriaLoginConcluir(assertion);
    return {
      id: Number(resultado.usuario_id),
      email: resultado.email,
      nome: resultado.nome,
    };
  } catch (e: any) {
    throw traduzirErro(e);
  }
}
