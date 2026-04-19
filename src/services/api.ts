// src/services/api.ts

const BASE_URL =
  (process.env as any)?.EXPO_PUBLIC_API_BASE_URL ??
  "https://jinx.purg.com.br";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
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
export async function getCarteira(usuarioId: number) {
  const response = await apiFetch(`/api/v1/carteira/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar dados da carteira", response.status);
  }

  return response.json();
}

/* ======================================================
   RENDIMENTOS
   ====================================================== */
export async function getRendimentosUsuario(usuarioId: number) {
  const response = await apiFetch(`/api/v1/rendimentos-usuario/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar rendimentos do usuário", response.status);
  }

  return response.json();
}

/* ======================================================
   PINS DO USUÁRIO
   ====================================================== */
export async function getPinsUsuario(usuarioId: number) {
  const response = await apiFetch(`/api/v1/pins-usuario/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar pins do usuário", response.status);
  }

  return response.json();
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
export async function solicitarSaque(usuarioId: number, valor: number, chavePix?: string) {
  const response = await apiFetch(`/api/v1/saque/${usuarioId}`, {
    method: "POST",
    body: JSON.stringify({ amount: valor, chave_pix: chavePix }),
  });

  if (!response.ok) {
    throw new ApiError("Erro ao solicitar saque", response.status);
  }

  return response.json();
}

/* ======================================================
   CRIAR CONTA
   ====================================================== */
export async function criarConta(dados: {
  nome_completo: string;
  cpf: string;
  celular: string;
  email: string;
  senha: string;
}) {
  // A API espera o campo "password", não "senha"
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
export async function cancelarSaque(usuarioId: number) {
  const response = await apiFetch(`/api/v1/cancelar-saque/${usuarioId}`, {
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

  if (!response.ok) {
    throw new ApiError(data?.message || "Erro ao solicitar depósito", response.status);
  }

  return data;
}

/* ======================================================
   CANCELAR DEPÓSITO
   ====================================================== */
export async function cancelarDeposito(usuarioId: number) {
  const response = await apiFetch(`/api/v1/cancelar-deposito/${usuarioId}`, {
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
export async function getDadosCadastro(usuarioId: number) {
  const response = await apiFetch(`/api/v1/dados-cadastro/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar dados cadastrais do usuário", response.status);
  }

  return response.json();
}

/* ======================================================
   OBJETIVOS
   ====================================================== */
export async function getObjetivos(usuarioId: number) {
  const response = await apiFetch(`/api/v1/objetivos/${usuarioId}`);

  if (!response.ok) {
    throw new ApiError("Erro ao buscar objetivos", response.status);
  }

  return response.json();
}

export async function getObjetivoDetalhe(usuarioId: number, objetivoId: number) {
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
export async function biometriaCadastroConcluir(credential: any) {
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
export async function biometriaLoginConcluir(assertion: any) {
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
    celular?: string;
    endereco?: string;
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

  if (!response.ok) {
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
export async function getHistoricoPatrimonio(usuarioId: number) {
  const response = await apiFetch(`/api/v1/historico-patrimonio/${usuarioId}`);
  if (!response.ok) {
    throw new ApiError("Erro ao buscar histórico de patrimônio", response.status);
  }
  return response.json(); // { success, historico: [{ data, carteira_dia }] }
}

/* ======================================================
   HISTÓRICO DE RENDIMENTOS
   ====================================================== */
export async function getHistoricoRendimentos(usuarioId: number) {
  const response = await apiFetch(`/api/v1/historico-rendimentos/${usuarioId}`);
  if (!response.ok) {
    throw new ApiError("Erro ao buscar histórico de rendimentos", response.status);
  }
  return response.json(); // { success, historico: [{ data, rendimento_dia }] }
}

/* ======================================================
   HELPERS
   ====================================================== */
export function getTotalPinsFromPins(pins: any[]) {
  if (!Array.isArray(pins)) return 0;
  return pins.length;
}
