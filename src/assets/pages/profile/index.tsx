import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { makeProfileStyle } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { getDadosCadastro, editarPerfil, trocarSenha } from "../../../services/api";
import type { DadosCadastroResponse } from "../../../types";
import { cadastrarBiometria, isPasskeySupported } from "../../../services/biometria";

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

export default function Profile() {
  const { user, logout } = useAuth();
  const { isDark, colors, setDark } = useTheme();
  const style = useMemo(() => makeProfileStyle(colors), [colors]);

  const [dados, setDados] = useState<DadosCadastroResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalDados, setModalDados] = useState(false);
  const [modalPix, setModalPix] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nomeEdit, setNomeEdit] = useState("");
  const [celularEdit, setCelularEdit] = useState("");
  const [enderecoEdit, setEnderecoEdit] = useState("");

  const [pixCpfEdit, setPixCpfEdit] = useState("");
  const [pixCelEdit, setPixCelEdit] = useState("");
  const [pixEmailEdit, setPixEmailEdit] = useState("");
  const [pixChaveEdit, setPixChaveEdit] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [cadastrandoBio, setCadastrandoBio] = useState(false);
  const biometriaSuportada = isPasskeySupported();

  const ms = useMemo(() => makeModalStyle(colors), [colors]);

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

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

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
    setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
    setModalSenha(true);
  }

  async function salvarDados() {
    if (!nomeEdit.trim()) { Alert.alert("Atenção", "Nome não pode ficar em branco."); return; }
    try {
      setSalvando(true);
      await editarPerfil(user!.id, { nome_completo: nomeEdit.trim(), celular: celularEdit.trim(), endereco: enderecoEdit.trim() });
      setModalDados(false);
      carregar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar os dados.");
    } finally { setSalvando(false); }
  }

  async function salvarPix() {
    try {
      setSalvando(true);
      await editarPerfil(user!.id, { pix_cpf: pixCpfEdit.trim(), pix_celular: pixCelEdit.trim(), pix_email: pixEmailEdit.trim(), pix_chave: pixChaveEdit.trim() });
      setModalPix(false);
      carregar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar as chaves Pix.");
    } finally { setSalvando(false); }
  }

  async function salvarSenha() {
    if (!senhaAtual) { Alert.alert("Atenção", "Informe a senha atual."); return; }
    if (novaSenha.length < 6) { Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmarSenha) { Alert.alert("Atenção", "As senhas não coincidem."); return; }
    try {
      setSalvando(true);
      await trocarSenha(user!.id, { senha_atual: senhaAtual, nova_senha: novaSenha });
      setModalSenha(false);
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível trocar a senha.");
    } finally { setSalvando(false); }
  }

  async function handleCadastrarBiometria() {
    try {
      setCadastrandoBio(true);
      await cadastrarBiometria();
      Alert.alert("Biometria cadastrada", "Agora você pode entrar com digital ou Face ID na próxima vez.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível cadastrar a biometria.");
    } finally { setCadastrandoBio(false); }
  }

  if (loading) {
    return (
      <View style={style.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusAtivo = dados?.status_ativo === 1 ? "Ativo" : "Inativo";
  const corStatus = dados?.status_ativo === 1 ? colors.primary : "#FF3B30";
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
            <Text style={style.avatarLetra}>{dados?.nome_completo?.[0] ?? "?"}</Text>
          </View>
          <Text style={style.nome}>{dados?.nome_completo ?? "—"}</Text>
          <View style={style.badges}>
            <View style={[style.badge, { backgroundColor: corStatus + "22", borderColor: corStatus }]}>
              <Text style={[style.badgeTexto, { color: corStatus }]}>{statusAtivo}</Text>
            </View>
            {dados?.assinatura ? (
              <View style={[style.badgeAssinatura, dados.assinatura === "Poppy Pro" ? { backgroundColor: "#007AFF" } : { backgroundColor: colors.borderLight }]}>
                <Text style={[style.badgeAssinaturaTexto, dados.assinatura === "Poppy Pro" ? { color: "#fff" } : { color: colors.textPrimary }]}>
                  {dados.assinatura}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={style.idTexto}>ID #{dados?.usuario_id}</Text>
        </View>

        {/* Aparência */}
        <View style={style.toggleSecao}>
          <Text style={style.toggleTitulo}>Aparência</Text>
          <View style={style.toggleRow}>
            <TouchableOpacity
              style={[style.toggleBtn, !isDark && style.toggleBtnActive]}
              onPress={() => setDark(false)}
            >
              <Text style={[style.toggleBtnText, !isDark && style.toggleBtnTextActive]}>Claro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[style.toggleBtn, isDark && style.toggleBtnActive]}
              onPress={() => setDark(true)}
            >
              <Text style={[style.toggleBtnText, isDark && style.toggleBtnTextActive]}>Escuro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dados pessoais */}
        <View style={style.secao}>
          <View style={ms.secaoHeaderRow}>
            <Text style={style.secaoTitulo}>Dados Pessoais</Text>
            <TouchableOpacity onPress={abrirModalDados}>
              <Text style={[ms.editarLink, { color: colors.primary }]}>Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={style.linha}><Text style={style.linhaLabel}>Nome completo</Text><Text style={style.linhaValor}>{dados?.nome_completo ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Data de nascimento</Text><Text style={style.linhaValor}>{formatDate(dados?.data_nascimento)}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Celular</Text><Text style={style.linhaValor}>{dados?.celular ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Endereço</Text><Text style={style.linhaValor}>{dados?.endereco ?? "—"}</Text></View>
          <View style={[style.linha, { borderBottomWidth: 0 }]}><Text style={style.linhaLabel}>Membro desde</Text><Text style={style.linhaValor}>{formatDate(dados?.created_at)}</Text></View>
        </View>

        {/* Plataforma */}
        <View style={style.secao}>
          <Text style={[style.secaoTitulo, { marginBottom: 8 }]}>Plataforma</Text>
          <View style={style.linha}><Text style={style.linhaLabel}>Assinatura</Text><Text style={style.linhaValor}>{dados?.assinatura ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Suitability</Text><Text style={style.linhaValor}>{dados?.suitability ?? "—"}</Text></View>
          <View style={[style.linha, { borderBottomWidth: 0 }]}><Text style={style.linhaLabel}>Suitability complementar</Text><Text style={style.linhaValor}>{dados?.suitability_complementar ?? "—"}</Text></View>
        </View>

        {/* Chaves Pix */}
        <View style={style.secao}>
          <View style={ms.secaoHeaderRow}>
            <Text style={style.secaoTitulo}>Chaves Pix</Text>
            <TouchableOpacity onPress={abrirModalPix}>
              <Text style={[ms.editarLink, { color: colors.primary }]}>Editar</Text>
            </TouchableOpacity>
          </View>
          {temPix ? (
            <>
              <View style={style.linha}><Text style={style.linhaLabel}>CPF</Text><Text style={style.linhaValor}>{pixCpf}</Text></View>
              <View style={style.linha}><Text style={style.linhaLabel}>Celular</Text><Text style={style.linhaValor}>{pixCelular}</Text></View>
              <View style={style.linha}><Text style={style.linhaLabel}>E-mail</Text><Text style={style.linhaValor}>{pixEmail}</Text></View>
              <View style={[style.linha, { borderBottomWidth: 0 }]}><Text style={style.linhaLabel}>Chave aleatória</Text><Text style={style.linhaValor}>{pixChave}</Text></View>
            </>
          ) : (
            <Text style={style.semDados}>Nenhuma chave Pix cadastrada.</Text>
          )}
        </View>

        {/* Segurança */}
        <View style={style.secao}>
          <Text style={[style.secaoTitulo, { marginBottom: 12 }]}>Segurança</Text>
          <TouchableOpacity style={[ms.secaoBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={abrirModalSenha}>
            <Text style={[ms.secaoBtnText, { color: colors.textPrimary }]}>Trocar senha</Text>
          </TouchableOpacity>
        </View>

        {/* Biometria */}
        <View style={style.secao}>
          <Text style={[style.secaoTitulo, { marginBottom: 12 }]}>Biometria</Text>
          {biometriaSuportada ? (
            <>
              <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
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
            <Text style={style.semDados}>Biometria não disponível neste dispositivo ou navegador.</Text>
          )}
        </View>

        <TouchableOpacity style={style.botaoSair} onPress={logout}>
          <Text style={style.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal — Dados pessoais */}
      <ModalEdicao visible={modalDados} titulo="Editar Dados" onClose={() => setModalDados(false)} onSalvar={salvarDados} loading={salvando} ms={ms}>
        <Campo ms={ms} label="Nome completo" value={nomeEdit} onChangeText={setNomeEdit} placeholder="Seu nome" />
        <Campo ms={ms} label="Celular" value={celularEdit} onChangeText={setCelularEdit} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
        <Campo ms={ms} label="Endereço" value={enderecoEdit} onChangeText={setEnderecoEdit} placeholder="Rua, número, cidade" />
      </ModalEdicao>

      {/* Modal — Chaves Pix */}
      <ModalEdicao visible={modalPix} titulo="Editar Chaves Pix" onClose={() => setModalPix(false)} onSalvar={salvarPix} loading={salvando} ms={ms}>
        <Campo ms={ms} label="CPF" value={pixCpfEdit} onChangeText={setPixCpfEdit} placeholder="000.000.000-00" keyboardType="number-pad" />
        <Campo ms={ms} label="Celular" value={pixCelEdit} onChangeText={setPixCelEdit} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
        <Campo ms={ms} label="E-mail" value={pixEmailEdit} onChangeText={setPixEmailEdit} placeholder="email@exemplo.com" keyboardType="email-address" />
        <Campo ms={ms} label="Chave aleatória" value={pixChaveEdit} onChangeText={setPixChaveEdit} placeholder="UUID ou chave" />
      </ModalEdicao>

      {/* Modal — Trocar senha */}
      <ModalEdicao visible={modalSenha} titulo="Trocar Senha" onClose={() => setModalSenha(false)} onSalvar={salvarSenha} loading={salvando} ms={ms}>
        <Campo ms={ms} label="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} placeholder="••••••" secureTextEntry />
        <Campo ms={ms} label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} placeholder="Mínimo 6 caracteres" secureTextEntry />
        <Campo ms={ms} label="Confirmar nova senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita a nova senha" secureTextEntry />
      </ModalEdicao>
    </SwipeTabsWrapper>
  );
}

type ModalStyles = ReturnType<typeof makeModalStyle>;

function ModalEdicao({ visible, titulo, onClose, onSalvar, loading, ms, children }: {
  visible: boolean; titulo: string; onClose: () => void; onSalvar: () => void;
  loading: boolean; ms: ModalStyles; children: React.ReactNode;
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
            <TouchableOpacity style={[ms.btnSalvar, loading && { opacity: 0.6 }]} onPress={onSalvar} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={ms.btnSalvarText}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Campo({ ms, label, value, onChangeText, placeholder, keyboardType, secureTextEntry }: {
  ms: ModalStyles; label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: import("react-native").KeyboardTypeOptions; secureTextEntry?: boolean;
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

const makeModalStyle = (c: { textPrimary: string; textSecondary: string; border: string; background: string; backgroundSecondary: string; primary: string }) =>
  StyleSheet.create({
    secaoHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    editarLink: { fontSize: 13, fontWeight: "600" },
    secaoBtn: { paddingVertical: 10, alignItems: "center", borderRadius: 10, borderWidth: 1 },
    secaoBtnText: { fontSize: 14, fontWeight: "600" },
    bioDesc: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
    bioBtn: { backgroundColor: "#111", borderColor: "transparent" },
    bioBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: { backgroundColor: c.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "85%" as any },
    modalTitulo: { fontSize: 18, fontWeight: "700", color: c.textPrimary, marginBottom: 20 },
    inputLabel: { fontSize: 12, fontWeight: "600", color: c.textSecondary, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.textPrimary, marginBottom: 14, backgroundColor: c.backgroundSecondary },
    modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
    btnCancelar: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnCancelarText: { color: c.textSecondary, fontWeight: "600" },
    btnSalvar: { flex: 1, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
