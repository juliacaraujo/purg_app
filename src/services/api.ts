// src/services/api.ts
import type {
  CarteiraResponse,
  RendimentosResponse,
  DadosCadastroResponse,
  PinUsuario,
  PinsResponse,
  HistoricoPatrimonioResponse,
  HistoricoRendimentosResponse,
  ObjetivosResponse,
  RankingItem,
} from "../types";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://jinx.purg.com.br";

export class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// Wrapper que garante credentials: "include" em todas as chamadas (necessário para enviar o connect.sid)
async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/* ======================================================
   TIPO DE ACESSO
   ====================================================== */
export async function tipoAcesso(email: string): Promise<{ tipo: "biometria" | "senha" | null }> {
  const response = await apiFetch("/api/v1/tipo-acesso", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 404) throw new ApiError(data?.message || "Usuário não encontrado.", 404);
  if (response.status === 400) throw new ApiError(data?.errors?.[0]?.msg || "E-mail inválido.", 400);
  if (!response.ok) throw new ApiError(data?.message || "Erro ao verificar acesso.", response.status);

  return data;
}

/* ======================================================
   LOGIN
   ====================================================== */
export async function loginUser(email: string, senha: string) {
  const response = await apiFetch("/api/v1/login", {
    method: "POST",
    body: JSON.stringify({ email, password: senha }),
  });

  const data = await response.json();

  return {
    success: !!data?.success,
    message: data?.message,
    userId: data?.usuario_id,
  };
}

/* ======================================================
   LOGOUT
   ====================================================== */
export async function logoutUser() {
  const response = await apiFetch("/api/v1/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return response.json().catch(() => ({}));
}

/* ======================================================
   CHECK SESSION
   ====================================================== */
export async function checkSession(_usuarioId: number): Promise<boolean> {
  const response = await apiFetch("/api/v1/check-session", { method: "POST" });
  if (response.status === 401) return false;
  try {
    const data = await response.json();
    return data?.authenticated === true;
  } catch {
    return false;
  }
}

/* ======================================================
   CARTEIRA
   ====================================================== */
export async function getCarteira(usuarioId: number): Promise<CarteiraResponse> {
  const response = await apiFetch(`/api/v1/carteira/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar dados da carteira", response.status);
  }

  return response.json() as Promise<CarteiraResponse>;
}

/* ======================================================
   RENDIMENTOS
   ====================================================== */
export async function getRendimentosUsuario(usuarioId: number): Promise<RendimentosResponse> {
  const response = await apiFetch(`/api/v1/rendimentos-usuario/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar rendimentos do usuário", response.status);
  }

  return response.json() as Promise<RendimentosResponse>;
}

/* ======================================================
   PINS DO USUÁRIO
   ====================================================== */
export async function getPinsUsuario(usuarioId: number): Promise<PinsResponse> {
  const response = await apiFetch(`/api/v1/pins-usuario/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar pins do usuário", response.status);
  }

  return response.json() as Promise<PinsResponse>;
}

/* ======================================================
   DADOS DA EMPRESA
   ====================================================== */
export async function getDadosEmpresa(empresaId: number) {
  const response = await apiFetch(`/api/v1/dados-empresa/${empresaId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar dados da empresa", response.status);
  }

  return response.json();
}

/* ======================================================
   SAQUE
   ====================================================== */
export async function solicitarSaque(usuarioId: number, valor: number, chavePix?: string, pin?: string) {
  const response = await apiFetch(`/api/v1/saque/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify({ amount: valor, chave_pix: chavePix, pin }),
  });

  const data = await response.json();

  if (response.status === 401) {
    throw new ApiError(data?.error || "PIN incorreto.", 401, data);
  }

  if (response.status === 423) {
    throw new ApiError(data?.error || "Conta bloqueada temporariamente.", 423, data);
  }

  if (response.status === 403) {
    const msg =
      data?.codigo === "OBJETIVOS_NAO_CONFIGURADOS"
        ? "Configure um objetivo antes do primeiro saque."
        : data?.message || "Ação não permitida.";
    throw new ApiError(msg, 403);
  }

  if (response.status === 422) {
    throw new ApiError("Cadastre seu CPF no perfil antes de sacar.", 422);
  }

  if (response.status === 429) {
    throw new ApiError(
      data?.message || "Você já possui um saque em andamento. Aguarde a confirmação antes de solicitar um novo.",
      429
    );
  }

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao solicitar saque", response.status);
  }

  return data;
}

/* ======================================================
   PIN DE NEGOCIAÇÃO
   ====================================================== */
export async function getPinNegociacaoStatus(usuarioId: number): Promise<{ pin_cadastrado: boolean }> {
  const response = await apiFetch(`/api/v1/pin-negociacao/status/${usuarioId}`);
  if (!response.ok) throw new ApiError("Erro ao verificar status do PIN", response.status);
  return response.json();
}

export async function criarPinNegociacao(
  usuarioId: number,
  dados: { pin: string; pin_confirmacao: string }
) {
  const response = await apiFetch(`/api/v1/pin-negociacao/criar/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data?.message || data?.error || "Erro ao criar PIN", response.status);
  return data;
}

export async function alterarPinNegociacao(
  usuarioId: number,
  dados: { pin_atual: string; pin_novo: string; pin_confirmacao: string }
) {
  const response = await apiFetch(`/api/v1/pin-negociacao/alterar/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  const data = await response.json();
  if (response.status === 401) throw new ApiError(data?.error || "PIN atual incorreto.", 401, data);
  if (response.status === 423) throw new ApiError(data?.error || "Conta bloqueada temporariamente.", 423, data);
  if (!response.ok) throw new ApiError(data?.message || data?.error || "Erro ao alterar PIN", response.status);
  return data;
}

export async function recuperarPinSolicitar(
  usuarioId: number,
  dados: { senha_login: string }
) {
  const response = await apiFetch(`/api/v1/pin-negociacao/recuperar/solicitar/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data?.message || data?.error || "Erro ao solicitar recuperação do PIN", response.status);
  return data;
}

export async function recuperarPinConfirmar(dados: {
  token: string;
  pin_novo: string;
  pin_confirmacao: string;
}) {
  const response = await apiFetch("/api/v1/pin-negociacao/recuperar/confirmar", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data?.message || data?.error || "Erro ao confirmar novo PIN", response.status);
  return data;
}

export async function verificarSenhaNegociacao(usuarioId: number, pin: string): Promise<void> {
  const response = await apiFetch(`/api/v1/pin-negociacao/verificar/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new ApiError(data?.error || "Senha incorreta.", 401, data);
  if (response.status === 423) throw new ApiError(data?.error || "Conta bloqueada temporariamente.", 423, data);
  if (!response.ok) throw new ApiError(data?.error || data?.message || "Erro ao verificar senha.", response.status, data);
}

/* ======================================================
   CRIAR CONTA
   ====================================================== */
export async function criarConta(dados: {
  nome_completo: string;
  nome_da_mae?: string;
  cpf: string;
  celular: string;
  email: string;
  senha: string;
  data_nascimento?: string;
  genero?: string;
  termos_de_uso: "1";
  termos_de_privacidade: "1";
  termos_de_riscos_da_plataforma: "1";
}) {
  const { senha, ...rest } = dados;
  const response = await apiFetch("/api/v1/cadastro", {
    method: "POST",
    body: JSON.stringify({ ...rest, password: senha }),
  });

  const data = await response.json();

  return {
    success: !!data?.success,
    message: data?.message,
    userId: data?.usuario_id,
  };
}

/* ======================================================
   RECUPERAÇÃO DE CONTA
   ====================================================== */
export async function requestRecoveryCode(email: string) {
  const response = await apiFetch("/api/v1/recuperar-senha", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  return {
    success: !!data?.success,
    message: data?.message,
  };
}

export async function validateRecoveryCode(email: string, code: string) {
  const response = await apiFetch("/api/v1/validar-codigo", {
    method: "POST",
    body: JSON.stringify({ email, codigo: code }),
  });

  const data = await response.json();

  return {
    success: !!data?.success,
    message: data?.message,
  };
}

export async function changePassword(email: string, novaSenha: string) {
  const response = await apiFetch("/api/v1/nova-senha", {
    method: "POST",
    body: JSON.stringify({ email, nova_senha: novaSenha }),
  });

  const data = await response.json();

  return {
    success: !!data?.success,
    message: data?.message,
  };
}

/* ======================================================
   SAQUES PENDENTES
   ====================================================== */
export async function getBuscarSaquesPendentes(usuarioId: number) {
  const response = await apiFetch(`/api/v1/buscar-saques-pendentes/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar saques pendentes", response.status);
  }

  return response.json();
}

/* ======================================================
   CANCELAR SAQUE
   ====================================================== */
export async function cancelarSaque(saqueId: number) {
  const response = await apiFetch(`/api/v1/cancelar-saque/${saqueId}`, {
    method: "POST",
    body: JSON.stringify({ motivo: "Saque cancelado pelo usuário." }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao cancelar saque", response.status);
  }

  return data;
}

/* ======================================================
   HISTÓRICO DE SAQUES
   ====================================================== */
export async function getHistoricoSaques(usuarioId: number) {
  const response = await apiFetch(`/api/v1/saque-historico/${usuarioId}`);

  const data = await response.json();

  // API retorna [] com status 404 quando não há histórico
  return Array.isArray(data) ? data : [];
}

/* ======================================================
   SOLICITAR DEPÓSITO
   ====================================================== */
export async function solicitarDeposito(usuarioId: number, amount: number) {
  const response = await apiFetch(`/api/v1/deposito/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();

  if (response.status === 403) {
    const msg =
      data?.codigo === "OBJETIVOS_NAO_CONFIGURADOS"
        ? "Configure um objetivo antes do primeiro depósito."
        : data?.message || "Ação não permitida.";
    throw new ApiError(msg, 403);
  }

  if (response.status === 422) {
    throw new ApiError("Cadastre seu CPF no perfil antes de depositar.", 422);
  }

  if (response.status === 429) {
    throw new ApiError("Depósito pendente.", 429, data);
  }

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao solicitar depósito", response.status);
  }

  return data;
}

/* ======================================================
   CANCELAR DEPÓSITO
   ====================================================== */
export async function cancelarDeposito(depositoId: number) {
  const response = await apiFetch(`/api/v1/cancelar-deposito/${depositoId}`, {
    method: "POST",
    body: JSON.stringify({ motivo: "Depósito cancelado pelo usuário." }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao cancelar depósito", response.status);
  }

  return data;
}

/* ======================================================
   DEPÓSITOS PENDENTES
   ====================================================== */
export async function getBuscarDepositosPendentes(usuarioId: number) {
  const response = await apiFetch(`/api/v1/buscar-depositos-pendentes/${usuarioId}`);

  const data = await response.json();

  return Array.isArray(data) ? data : [];
}

/* ======================================================
   HISTÓRICO DE DEPÓSITOS
   ====================================================== */
export async function getHistoricoDepositos(usuarioId: number) {
  const response = await apiFetch(`/api/v1/deposito-historico/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar histórico de depósitos", response.status);
  }

  return response.json();
}

/* ======================================================
   DADOS DE CADASTRO
   ====================================================== */
export async function getDadosCadastro(usuarioId: number): Promise<DadosCadastroResponse> {
  const response = await apiFetch(`/api/v1/dados-cadastro/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar dados cadastrais do usuário", response.status);
  }

  return response.json() as Promise<DadosCadastroResponse>;
}

/* ======================================================
   OBJETIVOS
   ====================================================== */
export async function getObjetivos(usuarioId: number): Promise<ObjetivosResponse> {
  const response = await apiFetch(`/api/v1/objetivos/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar objetivos", response.status);
  }

  return response.json() as Promise<ObjetivosResponse>;
}

export async function getLigas(): Promise<import("../types").LigaItem[]> {
  const response = await apiFetch("/api/v1/ligas");
  if (!response.ok) throw new ApiError("Erro ao buscar ligas", response.status);
  const data = await response.json();
  return data.ligas ?? [];
}

export async function getObjetivoDetalhe(usuarioId: number, objetivoId: number): Promise<{ metas: import("../types").MetaDetalhe[] }> {
  const response = await apiFetch(`/api/v1/objetivos/${usuarioId}/${objetivoId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar objetivo", response.status);
  }

  return response.json();
}

export async function criarObjetivo(
  usuarioId: number,
  dados: { descricao: string; valor_alvo: number; prazo: number; pontos_total: number }
) {
  const response = await apiFetch(`/api/v1/objetivos/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify(dados),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.error || data?.errors?.[0]?.msg || "Erro ao criar objetivo", response.status);
  }

  return data;
}

export async function configurarPatrimonio(
  usuarioId: number,
  dados: { valor_alvo: number; prazo: number; pontos_total: number }
) {
  const response = await apiFetch(`/api/v1/objetivos/${usuarioId}/patrimonio`, {
    method: "POST",
    body: JSON.stringify(dados),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.error || "Erro ao configurar patrimônio", response.status);
  }

  return data;
}

export async function cancelarObjetivo(usuarioId: number, objetivoId: number) {
  const response = await apiFetch(`/api/v1/objetivos/${usuarioId}/${objetivoId}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.error || "Erro ao cancelar objetivo", response.status);
  }

  return data;
}

/* ======================================================
   BIOMETRIA / PASSKEYS
   ====================================================== */

/** POST /api/v1/biometria/cadastro/iniciar — usuário precisa estar logado */
export async function biometriaCadastroIniciar() {
  const response = await apiFetch("/api/v1/biometria/cadastro/iniciar", {
    method: "POST",
  });
  if (!response.ok) {
    throw new ApiError("Erro ao iniciar cadastro de biometria", response.status);
  }
  return response.json();
}

/** POST /api/v1/biometria/cadastro/concluir */
export async function biometriaCadastroConcluir(credential: Record<string, unknown>) {
  const response = await apiFetch("/api/v1/biometria/cadastro/concluir", {
    method: "POST",
    body: JSON.stringify(credential),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao concluir cadastro de biometria", response.status);
  }
  return data;
}

/** POST /api/v1/biometria/login/iniciar — rota pública */
export async function biometriaLoginIniciar(email: string) {
  const response = await apiFetch("/api/v1/biometria/login/iniciar", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (response.status === 404) {
    throw new ApiError(
      "Biometria não cadastrada para este usuário. Faça login com e-mail e senha e cadastre sua biometria nas configurações de perfil.",
      404
    );
  }
  if (!response.ok) {
    throw new ApiError("Erro ao iniciar login biométrico", response.status);
  }
  return response.json();
}

/** POST /api/v1/biometria/login/concluir — rota pública */
export async function biometriaLoginConcluir(assertion: Record<string, unknown>) {
  const response = await apiFetch("/api/v1/biometria/login/concluir", {
    method: "POST",
    body: JSON.stringify(assertion),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data?.message || "Falha na autenticação biométrica", response.status);
  }
  return data; // { success, usuario_id, nome, email }
}

/* ======================================================
   EDITAR PERFIL
   ====================================================== */
export async function editarPerfil(
  usuarioId: number,
  dados: {
    nome_completo?: string;
    apelido?: string;
    celular?: string;
    logradouro?: string;
    numero_da_rua?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    genero?: string;
    pix_cpf?: string;
    pix_celular?: string;
    pix_email?: string;
    pix_chave?: string;
  }
) {
  const response = await apiFetch(`/api/v1/edita-perfil/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new ApiError(data?.message || data?.error || "Erro ao editar perfil", response.status);
  }

  return data;
}

/* ======================================================
   TROCAR SENHA (logado)
   ====================================================== */
export async function trocarSenha(
  usuarioId: number,
  dados: { senha_atual: string; nova_senha: string }
) {
  // A API espera os campos "senhaAtual" e "novaSenha" (camelCase)
  const response = await apiFetch(`/api/v1/troca-senha/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify({ senhaAtual: dados.senha_atual, novaSenha: dados.nova_senha }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || "Erro ao trocar senha", response.status);
  }

  return data;
}

/* ======================================================
   HISTÓRICO DE PATRIMÔNIO
   ====================================================== */
export async function getHistoricoPatrimonio(usuarioId: number): Promise<HistoricoPatrimonioResponse> {
  const response = await apiFetch(`/api/v1/historico-patrimonio/${usuarioId}`);
  if (!response.ok) {
    throw new ApiError("Erro ao buscar histórico de patrimônio", response.status);
  }
  return response.json() as Promise<HistoricoPatrimonioResponse>;
}

/* ======================================================
   HISTÓRICO DE RENDIMENTOS
   ====================================================== */
export async function getHistoricoRendimentos(usuarioId: number): Promise<HistoricoRendimentosResponse> {
  const response = await apiFetch(`/api/v1/historico-rendimentos/${usuarioId}`);
  if (!response.ok) {
    throw new ApiError("Erro ao buscar histórico de rendimentos", response.status);
  }
  return response.json() as Promise<HistoricoRendimentosResponse>;
}

/* ======================================================
   TEMA
   ====================================================== */
export async function getTema(usuarioId: number): Promise<{ tema: string }> {
  const response = await apiFetch(`/api/v1/tema/${usuarioId}`);
  if (!response.ok) throw new ApiError("Erro ao buscar tema", response.status);
  return response.json();
}

export async function putTema(usuarioId: number, tema: "claro" | "escuro"): Promise<void> {
  await apiFetch(`/api/v1/tema/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify({ tema }),
  });
}

/* ======================================================
   RANKING
   ====================================================== */
export async function getRanking(): Promise<RankingItem[]> {
  const response = await apiFetch("/api/v1/ranking");
  if (!response.ok) {
    throw new ApiError("Erro ao buscar ranking", response.status);
  }
  return response.json() as Promise<RankingItem[]>;
}

/* ======================================================
   PREFERÊNCIA DE LOGIN
   ====================================================== */
export async function atualizarPreferenciaLogin(
  usuarioId: number,
  preferencia: "senha" | "biometria"
) {
  const response = await apiFetch(`/api/v1/preferencia-login/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify({ preferencia_login: preferencia }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao atualizar preferência de login.", response.status);
  }

  return data;
}

/* ======================================================
   ASSINATURA
   ====================================================== */
export async function atualizarAssinatura(usuarioId: number, novaAssinatura: string) {
  const response = await apiFetch(`/api/v1/atualizar-assinatura/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify({ novaAssinatura }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao atualizar assinatura", response.status);
  }

  return data;
}

/* ======================================================
   HELPERS
   ====================================================== */
export function getTotalPinsFromPins(pins: PinUsuario[]): number {
  return pins.length;
}
