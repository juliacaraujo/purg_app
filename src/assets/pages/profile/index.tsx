import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { style } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { getDadosCadastro, editarPerfil, trocarSenha } from "../../../services/api";
import {
  cadastrarBiometria,
  isPasskeySupported,
} from "../../../services/biometria";

const GREEN = "#34C759";
const DARK = "#111";
const GRAY = "#888";
const BORDER = "#e8e8e8";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatarCPF(digits: string | null | undefined): string {
  if (!digits) return "—";
  const d = digits.replace(/\D/g, "");
  if (d.length !== 11) return digits;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarCelular(digits: string | null | undefined): string {
  if (!digits) return "—";
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

// ─── Sub-componentes de visualização ─────────────────
function Secao({ titulo, children, onEditar }: { titulo: string; children: React.ReactNode; onEditar?: () => void }) {
  return (
    <View style={style.secao}>
      <View style={ms.secaoHeaderRow}>
        <Text style={style.secaoTitulo}>{titulo}</Text>
        {onEditar && (
          <TouchableOpacity onPress={onEditar}>
            <Text style={ms.editarLink}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={style.linha}>
      <Text style={style.linhaLabel}>{label}</Text>
      <Text style={style.linhaValor}>{valor ?? "—"}</Text>
    </View>
  );
}

// ─── Modal genérico ───────────────────────────────────
function ModalEdicao({
  visible,
  titulo,
  onClose,
  onSalvar,
  loading,
  children,
}: {
  visible: boolean;
  titulo: string;
  onClose: () => void;
  onSalvar: () => void;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={ms.overlay}>
        <View style={ms.modal}>
          <Text style={ms.modalTitulo}>{titulo}</Text>
          {children}
          <View style={ms.modalBtns}>
            <TouchableOpacity style={ms.btnCancelar} onPress={onClose}>
              <Text style={ms.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.btnSalvar, loading && { opacity: 0.6 }]}
              onPress={onSalvar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={ms.btnSalvarText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <>
      <Text style={ms.inputLabel}>{label}</Text>
      <TextInput
        style={ms.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#bbb"
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </>
  );
}

// ─── Tela principal ───────────────────────────────────
export default function Profile() {
  const { user, logout } = useAuth();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modais
  const [modalDados, setModalDados] = useState(false);
  const [modalPix, setModalPix] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Campos editar dados
  const [nomeEdit, setNomeEdit] = useState("");
  const [celularEdit, setCelularEdit] = useState("");
  const [enderecoEdit, setEnderecoEdit] = useState("");

  // Campos editar pix
  const [pixCpfEdit, setPixCpfEdit] = useState("");
  const [pixCelEdit, setPixCelEdit] = useState("");
  const [pixEmailEdit, setPixEmailEdit] = useState("");
  const [pixChaveEdit, setPixChaveEdit] = useState("");

  // Campos trocar senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Biometria
  const [cadastrandoBio, setCadastrandoBio] = useState(false);
  const biometriaSuportada = isPasskeySupported();

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getDadosCadastro(user.id);
      setDados(res);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = () => {
    setRefreshing(true);
    carregar();
  };

  // ── Abrir modais com valores atuais ──────────────────
  function abrirModalDados() {
    setNomeEdit(dados?.nome_completo ?? "");
    setCelularEdit(dados?.celular ?? "");
    setEnderecoEdit(dados?.endereco ?? "");
    setModalDados(true);
  }

  function abrirModalPix() {
    setPixCpfEdit(dados?.pix_cpf ?? "");
    setPixCelEdit(dados?.pix_celular ?? "");
    setPixEmailEdit(dados?.pix_email ?? "");
    setPixChaveEdit(dados?.pix_chave ?? "");
    setModalPix(true);
  }

  function abrirModalSenha() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setModalSenha(true);
  }

  // ── Salvar dados pessoais ────────────────────────────
  async function salvarDados() {
    if (!nomeEdit.trim()) {
      Alert.alert("Atenção", "Nome não pode ficar em branco.");
      return;
    }
    try {
      setSalvando(true);
      await editarPerfil(user!.id, {
        nome_completo: nomeEdit.trim(),
        celular: celularEdit.trim(),
        endereco: enderecoEdit.trim(),
      });
      setModalDados(false);
      carregar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar os dados.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Salvar chaves Pix ────────────────────────────────
  async function salvarPix() {
    try {
      setSalvando(true);
      await editarPerfil(user!.id, {
        pix_cpf: pixCpfEdit.trim(),
        pix_celular: pixCelEdit.trim(),
        pix_email: pixEmailEdit.trim(),
        pix_chave: pixChaveEdit.trim(),
      });
      setModalPix(false);
      carregar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar as chaves Pix.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Trocar senha ─────────────────────────────────────
  async function salvarSenha() {
    if (!senhaAtual) {
      Alert.alert("Atenção", "Informe a senha atual.");
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    try {
      setSalvando(true);
      await trocarSenha(user!.id, { senha_atual: senhaAtual, nova_senha: novaSenha });
      setModalSenha(false);
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível trocar a senha.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Cadastrar biometria ──────────────────────────────
  async function handleCadastrarBiometria() {
    try {
      setCadastrandoBio(true);
      await cadastrarBiometria();
      Alert.alert("Biometria cadastrada", "Agora você pode entrar com digital ou Face ID na próxima vez.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível cadastrar a biometria.");
    } finally {
      setCadastrandoBio(false);
    }
  }

  if (loading) {
    return (
      <View style={style.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  const statusAtivo = dados?.status_ativo === 1 ? "Ativo" : "Inativo";
  const corStatus = dados?.status_ativo === 1 ? GREEN : "#FF3B30";

  const pixCpf = formatarCPF(dados?.pix_cpf);
  const pixCelular = formatarCelular(dados?.pix_celular);
  const pixEmail = dados?.pix_email || "—";
  const pixChave = dados?.pix_chave || "—";
  const temPix = dados?.pix_cpf || dados?.pix_celular || dados?.pix_email || dados?.pix_chave;

  return (
    <SwipeTabsWrapper currentTab="Patrimônio">
      <ScrollView
        style={style.container}
        contentContainerStyle={style.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cabeçalho */}
        <View style={style.header}>
          <View style={style.avatar}>
            <Text style={style.avatarLetra}>
              {dados?.nome_completo?.[0] ?? "?"}
            </Text>
          </View>
          <Text style={style.nome}>{dados?.nome_completo ?? "—"}</Text>
          <View style={style.badges}>
            <View style={[style.badge, { backgroundColor: corStatus + "22", borderColor: corStatus }]}>
              <Text style={[style.badgeTexto, { color: corStatus }]}>{statusAtivo}</Text>
            </View>
            {dados?.assinatura ? (
              <View style={[
                style.badgeAssinatura,
                dados.assinatura === "Poppy Pro"
                  ? { backgroundColor: "#007AFF" }
                  : { backgroundColor: "#f0f0f0" },
              ]}>
                <Text style={[
                  style.badgeAssinaturaTexto,
                  dados.assinatura === "Poppy Pro"
                    ? { color: "#fff" }
                    : { color: "#333" },
                ]}>{dados.assinatura}</Text>
              </View>
            ) : null}
          </View>
          <Text style={style.idTexto}>ID #{dados?.usuario_id}</Text>
        </View>

        {/* Dados pessoais */}
        <Secao titulo="Dados Pessoais" onEditar={abrirModalDados}>
          <Linha label="Nome completo" valor={dados?.nome_completo ?? "—"} />
          <Linha label="Data de nascimento" valor={formatDate(dados?.data_nascimento)} />
          <Linha label="Celular" valor={dados?.celular ?? "—"} />
          <Linha label="Endereço" valor={dados?.endereco ?? "—"} />
          <Linha label="Membro desde" valor={formatDate(dados?.created_at)} />
        </Secao>

        {/* Plataforma */}
        <Secao titulo="Plataforma">
          <Linha label="Assinatura" valor={dados?.assinatura ?? "—"} />
          <Linha label="Suitability" valor={dados?.suitability ?? "—"} />
          <Linha label="Suitability complementar" valor={dados?.suitability_complementar ?? "—"} />
        </Secao>

        {/* Chaves Pix */}
        <Secao titulo="Chaves Pix" onEditar={abrirModalPix}>
          {temPix ? (
            <>
              <Linha label="CPF" valor={pixCpf} />
              <Linha label="Celular" valor={pixCelular} />
              <Linha label="E-mail" valor={pixEmail} />
              <Linha label="Chave aleatória" valor={pixChave} />
            </>
          ) : (
            <Text style={style.semDados}>Nenhuma chave Pix cadastrada.</Text>
          )}
        </Secao>

        {/* Segurança */}
        <Secao titulo="Segurança">
          <TouchableOpacity style={ms.secaoBtn} onPress={abrirModalSenha}>
            <Text style={ms.secaoBtnText}>Trocar senha</Text>
          </TouchableOpacity>
        </Secao>

        {/* Biometria */}
        <Secao titulo="Biometria">
          {biometriaSuportada ? (
            <>
              <Text style={ms.bioDesc}>
                Cadastre sua digital ou Face ID para entrar sem digitar senha.
              </Text>
              <TouchableOpacity
                style={[ms.secaoBtn, ms.bioBtn, cadastrandoBio && { opacity: 0.6 }]}
                onPress={handleCadastrarBiometria}
                disabled={cadastrandoBio}
              >
                {cadastrandoBio ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={ms.bioBtnText}>Cadastrar biometria</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={style.semDados}>
              Biometria não disponível neste dispositivo ou navegador.
            </Text>
          )}
        </Secao>

        <TouchableOpacity style={style.botaoSair} onPress={logout}>
          <Text style={style.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal — Dados pessoais */}
      <ModalEdicao
        visible={modalDados}
        titulo="Editar Dados"
        onClose={() => setModalDados(false)}
        onSalvar={salvarDados}
        loading={salvando}
      >
        <Campo label="Nome completo" value={nomeEdit} onChangeText={setNomeEdit} placeholder="Seu nome" />
        <Campo label="Celular" value={celularEdit} onChangeText={setCelularEdit} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
        <Campo label="Endereço" value={enderecoEdit} onChangeText={setEnderecoEdit} placeholder="Rua, número, cidade" />
      </ModalEdicao>

      {/* Modal — Chaves Pix */}
      <ModalEdicao
        visible={modalPix}
        titulo="Editar Chaves Pix"
        onClose={() => setModalPix(false)}
        onSalvar={salvarPix}
        loading={salvando}
      >
        <Campo label="CPF" value={pixCpfEdit} onChangeText={setPixCpfEdit} placeholder="000.000.000-00" keyboardType="number-pad" />
        <Campo label="Celular" value={pixCelEdit} onChangeText={setPixCelEdit} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
        <Campo label="E-mail" value={pixEmailEdit} onChangeText={setPixEmailEdit} placeholder="email@exemplo.com" keyboardType="email-address" />
        <Campo label="Chave aleatória" value={pixChaveEdit} onChangeText={setPixChaveEdit} placeholder="UUID ou chave" />
      </ModalEdicao>

      {/* Modal — Trocar senha */}
      <ModalEdicao
        visible={modalSenha}
        titulo="Trocar Senha"
        onClose={() => setModalSenha(false)}
        onSalvar={salvarSenha}
        loading={salvando}
      >
        <Campo label="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} placeholder="••••••" secureTextEntry />
        <Campo label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} placeholder="Mínimo 6 caracteres" secureTextEntry />
        <Campo label="Confirmar nova senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita a nova senha" secureTextEntry />
      </ModalEdicao>
    </SwipeTabsWrapper>
  );
}

const ms = StyleSheet.create({
  secaoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editarLink: {
    fontSize: 13,
    color: GREEN,
    fontWeight: "600",
  },
  secaoBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  secaoBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: DARK,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GRAY,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    marginBottom: 14,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  btnCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnCancelarText: {
    color: GRAY,
    fontWeight: "600",
  },
  btnSalvar: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSalvarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Biometria
  bioDesc: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 12,
    lineHeight: 18,
  },
  bioBtn: {
    backgroundColor: DARK,
  },
  bioBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
