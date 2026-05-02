export interface CarteiraResponse {
  saldo: number;
  investido: number;
  liga?: string;
}

export interface RendimentosResponse {
  rendimento_total: number;
  ultimo_rendimento: number;
}

export interface DadosCadastroResponse {
  usuario_id: number;
  nome_completo: string;
  apelido?: string;
  email?: string;
  cpf?: string;
  celular?: string;
  logradouro?: string;
  numero_da_rua?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  genero?: string;
  nome_da_mae?: string;
  created_at?: string;
  status_ativo: number;
  assinatura?: string;
  pix_cpf?: string;
  pix_celular?: string;
  pix_email?: string;
  pix_chave?: string;
}

export interface PinUsuario {
  id_resultado: number;
  razao_social: string;
  quantidade_tokens_total_usuario: number;
  rendimento_token_total_usuario: number;
  juros_a_a: number;
  risco: string;
}

export interface PinsResponse {
  data: PinUsuario[];
}

export interface HistoricoPatrimonioItem {
  data: string;
  carteira_dia: number;
}

export interface HistoricoRendimentosItem {
  data: string;
  rendimento_dia: number;
}

export interface HistoricoPatrimonioResponse {
  success: boolean;
  historico: HistoricoPatrimonioItem[];
}

export interface HistoricoRendimentosResponse {
  success: boolean;
  historico: HistoricoRendimentosItem[];
}

export interface ObjetivoItem {
  objetivo_id: number;
  objetivo_descricao: string;
  valor_alvo: number;
  prazo_total: number;
  saldo_alocado_total: number;
  percentual_geral: number;
  metas_completas: number;
  metas_total: number;
  objetivo_completo: boolean;
  is_patrimonio: boolean;
}

export interface MetaDetalhe {
  id: number;
  numero: number;
  valor_alvo: number;
  saldo_alocado: number;
  percentual: number;
  pontos: number;
  completo: boolean;
  data_limite: string;
}

export interface PontosInfo {
  total: number;
}

export interface LigaItem {
  nome: string;
  pontuacao_minima: number;
}

export interface ObjetivosResponse {
  objetivos: ObjetivoItem[];
  pontos: PontosInfo | null;
}

export interface GraficoPoint {
  data: string;
  valor: number;
}

export interface ProjecaoItem {
  mes: string;
  label: string;
  valor: number;
}

export interface ProjecaoResponse {
  projecao: ProjecaoItem[];
}

export interface RankingItem {
  posicao: number;
  usuario_id: number;
  apelido: string;
  pontos: number;
  liga: string;
}

export interface TuteladoItem {
  id: number;
  tutelado_id: number;
  tutelado_nome: string;
  tutelado_email: string;
  criado_em: string;
}

export interface GuardiaoItem {
  id: number;
  nome_completo: string;
}

export interface ConvitePendenteItem {
  id: number;
  email_convidado: string;
  expira_em: string;
  criado_em: string;
}

export interface PermissoesTutelado {
  tutelado_id: number;
  pode_sacar: boolean;
  chaves_pix_autorizadas: string[];
  pode_depositar: boolean;
  pode_criar_objetivos: boolean;
  pode_alterar_perfil: boolean;
  pode_alterar_pix: boolean;
  atualizado_em: string;
}
