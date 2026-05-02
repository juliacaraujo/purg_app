// Implementação nativa (iOS / Android) — carregada pelo Metro em builds nativos.
// A versão web está em biometria.web.ts (Metro seleciona automaticamente por plataforma).
import { Passkey } from "react-native-passkey";
import {
  biometriaCadastroIniciar,
  biometriaCadastroConcluir,
  biometriaLoginIniciar,
  biometriaLoginConcluir,
} from "./api";

export type LoginBiometricoResult = { id: number; email: string; nome: string; avatarId: number | null };

// PasskeyError é uma interface { error: string; message: string } — não é classe,
// então identificamos o tipo pelo campo .error (duck-typing).
function traduzirErro(e: any): Error {
  const code: string = e?.error ?? "";
  switch (code) {
    case "UserCancelled":
      return new Error("Operação cancelada pelo usuário.");
    case "NotSupported":
      return new Error("Passkeys não são suportadas neste dispositivo.");
    case "BadConfiguration":
      return new Error("Configuração inválida. Verifique o domínio do servidor.");
    case "InvalidChallenge":
      return new Error("Desafio inválido. Tente novamente.");
    default:
      return new Error(e?.message || "Erro na autenticação biométrica.");
  }
}

/** Verifica se passkeys são suportadas no dispositivo. */
export function isPasskeySupported(): boolean {
  return Passkey.isSupported();
}

/** Registra a biometria do usuário logado. */
export async function cadastrarBiometria(): Promise<void> {
  const options = await biometriaCadastroIniciar();
  try {
    const credential = await Passkey.create(options);
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
    const assertion = await Passkey.get(options);
    const resultado = await biometriaLoginConcluir(assertion);
    return {
      id: Number(resultado.usuario_id),
      email: resultado.email,
      nome: resultado.nome,
      avatarId: resultado.avatar_id ?? null,
    };
  } catch (e: any) {
    throw traduzirErro(e);
  }
}
