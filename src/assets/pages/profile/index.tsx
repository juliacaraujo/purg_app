import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import imgBiometria from "../../../../assets/biometria.png";
import { makeProfileStyle } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import { getDadosCadastro, editarPerfil, trocarSenha, putTema, atualizarPreferenciaLogin } from "../../../services/api";
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
  const [erroDados, setErroDados] = useState<string | null>(null);
  const [erroPix, setErroPix] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const [nomeEdit, setNomeEdit] = useState("");
  const [apelidoEdit, setApelidoEdit] = useState("");
  const [generoEdit, setGeneroEdit] = useState("");
  const [celularEdit, setCelularEdit] = useState("");
  const [logradouroEdit, setLogradouroEdit] = useState("");
  const [numeroEdit, setNumeroEdit] = useState("");
  const [complementoEdit, setComplementoEdit] = useState("");
  const [bairroEdit, setBairroEdit] = useState("");
  const [cidadeEdit, setCidadeEdit] = useState("");
  const [estadoEdit, setEstadoEdit] = useState("");
  const [cepEdit, setCepEdit] = useState("");

  const [pixCpfEdit, setPixCpfEdit] = useState("");
  const [pixCelEdit, setPixCelEdit] = useState("");
  const [pixEmailEdit, setPixEmailEdit] = useState("");
  const [pixChaveEdit, setPixChaveEdit] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [cadastrandoBio, setCadastrandoBio] = useState(false);
  const biometriaSuportada = isPasskeySupported();

  const [toast, setToast] = useState<{ msg: string; tipo: "sucesso" | "erro" } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function mostrarToast(msg: string, tipo: "sucesso" | "erro") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, tipo });
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => setToast(null));
    }, 3500);
  }

  const ms = useMemo(() => makeModalStyle(colors), [colors]);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getDadosCadastro(user.id);
      setDados(res);
    } catch {
      mostrarToast("Não foi possível carregar os dados do perfil.", "erro");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = () => { setRefreshing(true); carregar(); };

  function abrirModalDados() {
    setErroDados(null);
    setNomeEdit(dados?.nome_completo ?? "");
    setApelidoEdit(dados?.apelido ?? "");
    setGeneroEdit(dados?.genero ?? "");
    setCelularEdit(dados?.celular ?? "");
    setLogradouroEdit(dados?.logradouro ?? "");
    setNumeroEdit(dados?.numero_da_rua != null ? String(dados.numero_da_rua) : "");
    setComplementoEdit(dados?.complemento ?? "");
    setBairroEdit(dados?.bairro ?? "");
    setCidadeEdit(dados?.cidade ?? "");
    setEstadoEdit(dados?.estado ?? "");
    setCepEdit(dados?.cep ?? "");
    setModalDados(true);
  }

  function abrirModalPix() {
    setErroPix(null);
    setPixCpfEdit(dados?.pix_cpf ?? "");
    setPixCelEdit(dados?.pix_celular ?? "");
    setPixEmailEdit(dados?.pix_email ?? "");
    setPixChaveEdit(dados?.pix_chave ?? "");
    setModalPix(true);
  }

  function abrirModalSenha() {
    setErroSenha(null);
    setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
    setModalSenha(true);
  }

  async function salvarDados() {
    if (!nomeEdit.trim()) { mostrarToast("Nome não pode ficar em branco.", "erro"); return; }
    try {
      setSalvando(true);
      await editarPerfil(user!.id, {
        nome_completo: nomeEdit.trim(),
        apelido: apelidoEdit.trim(),
        genero: generoEdit || undefined,
        celular: celularEdit.replace(/\D/g, ""),
        logradouro: logradouroEdit.trim(),
        numero_da_rua: numeroEdit.trim() || undefined,
        complemento: complementoEdit.trim(),
        bairro: bairroEdit.trim(),
        cidade: cidadeEdit.trim(),
        estado: estadoEdit.trim(),
        cep: cepEdit.replace(/\D/g, ""),
      });
      setModalDados(false);
      carregar();
      mostrarToast("Dados salvos com sucesso!", "sucesso");
    } catch (e: any) {
      setErroDados(e?.message || "Não foi possível salvar os dados.");
    } finally { setSalvando(false); }
  }

  async function salvarPix() {
    try {
      setSalvando(true);
      await editarPerfil(user!.id, {
        pix_cpf: pixCpfEdit.replace(/\D/g, ""),
        pix_celular: pixCelEdit.replace(/\D/g, ""),
        pix_email: pixEmailEdit.trim(),
        pix_chave: pixChaveEdit.trim(),
      });
      setModalPix(false);
      carregar();
      mostrarToast("Chaves Pix salvas com sucesso!", "sucesso");
    } catch (e: any) {
      setErroPix(e?.message || "Não foi possível salvar as chaves Pix.");
    } finally { setSalvando(false); }
  }

  async function salvarSenha() {
    if (!senhaAtual) { setErroSenha("Informe a senha atual."); return; }
    if (novaSenha.length < 6) { setErroSenha("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirmarSenha) { setErroSenha("As senhas não coincidem."); return; }
    try {
      setSalvando(true);
      await trocarSenha(user!.id, { senha_atual: senhaAtual, nova_senha: novaSenha });
      setModalSenha(false);
      mostrarToast("Senha alterada com sucesso!", "sucesso");
    } catch (e: any) {
      setErroSenha(e?.message || "Não foi possível trocar a senha.");
    } finally { setSalvando(false); }
  }

  async function handleCadastrarBiometria() {
    try {
      setCadastrandoBio(true);
      await cadastrarBiometria();
      await atualizarPreferenciaLogin(user!.id, "biometria").catch(() => {});
      mostrarToast("Biometria cadastrada! Agora você pode entrar com digital ou Face ID.", "sucesso");
    } catch (e: any) {
      mostrarToast(e?.message || "Não foi possível cadastrar a biometria.", "erro");
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
              onPress={() => { setDark(false); if (user?.id) putTema(user.id, "claro").catch(() => {}); }}
            >
              <Text style={[style.toggleBtnText, !isDark && style.toggleBtnTextActive]}>Claro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[style.toggleBtn, isDark && style.toggleBtnActive]}
              onPress={() => { setDark(true); if (user?.id) putTema(user.id, "escuro").catch(() => {}); }}
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
          <View style={style.linha}><Text style={style.linhaLabel}>Apelido</Text><Text style={style.linhaValor}>{dados?.apelido ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Data de nascimento</Text><Text style={style.linhaValor}>{formatDate(dados?.data_nascimento)}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Gênero</Text><Text style={style.linhaValor}>{dados?.genero ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Nome da mãe</Text><Text style={style.linhaValor}>{dados?.nome_da_mae ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Celular</Text><Text style={style.linhaValor}>{dados?.celular ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Endereço</Text><Text style={style.linhaValor}>{[dados?.logradouro, dados?.numero_da_rua, dados?.complemento, dados?.bairro, dados?.cidade, dados?.estado, dados?.cep].filter(Boolean).join(", ") || "—"}</Text></View>
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
          <TouchableOpacity style={[ms.secaoBtn, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary }]} onPress={abrirModalSenha}>
            <Text style={[ms.secaoBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Trocar senha</Text>
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
                style={[ms.secaoBtn, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary }, cadastrandoBio && { opacity: 0.6 }]}
                onPress={handleCadastrarBiometria}
                disabled={cadastrandoBio}
              >
                {cadastrandoBio ? (
                  <ActivityIndicator color={isDark ? colors.textPrimary : "#fff"} />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Image
                      source={imgBiometria}
                      style={{ width: 18, height: 18, tintColor: isDark ? colors.textPrimary : "#fff" }}
                      resizeMode="contain"
                    />
                    <Text style={[ms.bioBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Cadastrar biometria</Text>
                  </View>
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
      <ModalEdicao visible={modalDados} titulo="Editar Dados" onClose={() => setModalDados(false)} onSalvar={salvarDados} loading={salvando} erro={erroDados} ms={ms}>
        <Campo ms={ms} label="Nome completo" value={nomeEdit} onChangeText={setNomeEdit} placeholder="Seu nome" />
        <Campo ms={ms} label="Apelido" value={apelidoEdit} onChangeText={setApelidoEdit} placeholder="Seu apelido" />
        <Text style={ms.inputLabel}>Gênero</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["Masculino", "Feminino", "Outros"] as const).map((op) => (
            <TouchableOpacity
              key={op}
              style={[ms.generoBtn, generoEdit === op && ms.generoBtnAtivo]}
              onPress={() => setGeneroEdit(op)}
            >
              <Text style={[ms.generoBtnTexto, generoEdit === op && ms.generoBtnTextoAtivo]}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Campo ms={ms} label="Celular" value={celularEdit} onChangeText={setCelularEdit} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
        <Campo ms={ms} label="CEP" value={cepEdit} onChangeText={setCepEdit} placeholder="00000-000" keyboardType="number-pad" />
        <Campo ms={ms} label="Logradouro" value={logradouroEdit} onChangeText={setLogradouroEdit} placeholder="Rua, Av..." />
        <Campo ms={ms} label="Número" value={numeroEdit} onChangeText={setNumeroEdit} placeholder="0" keyboardType="number-pad" />
        <Campo ms={ms} label="Complemento" value={complementoEdit} onChangeText={setComplementoEdit} placeholder="Apto, Bloco..." />
        <Campo ms={ms} label="Bairro" value={bairroEdit} onChangeText={setBairroEdit} placeholder="Bairro" />
        <Campo ms={ms} label="Cidade" value={cidadeEdit} onChangeText={setCidadeEdit} placeholder="Cidade" />
        <Campo ms={ms} label="Estado" value={estadoEdit} onChangeText={setEstadoEdit} placeholder="SP" />
      </ModalEdicao>

      {/* Modal — Chaves Pix */}
      <ModalEdicao visible={modalPix} titulo="Editar Chaves Pix" onClose={() => setModalPix(false)} onSalvar={salvarPix} loading={salvando} erro={erroPix} ms={ms}>
        <Campo ms={ms} label="CPF" value={pixCpfEdit} onChangeText={setPixCpfEdit} placeholder="000.000.000-00" keyboardType="number-pad" />
        <Campo ms={ms} label="Celular" value={pixCelEdit} onChangeText={setPixCelEdit} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
        <Campo ms={ms} label="E-mail" value={pixEmailEdit} onChangeText={setPixEmailEdit} placeholder="email@exemplo.com" keyboardType="email-address" />
        <Campo ms={ms} label="Chave aleatória" value={pixChaveEdit} onChangeText={setPixChaveEdit} placeholder="UUID ou chave" />
      </ModalEdicao>

      {/* Modal — Trocar senha */}
      <ModalEdicao visible={modalSenha} titulo="Trocar Senha" onClose={() => setModalSenha(false)} onSalvar={salvarSenha} loading={salvando} erro={erroSenha} ms={ms}>
        <Campo ms={ms} label="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} placeholder="••••••" secureTextEntry />
        <Campo ms={ms} label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} placeholder="Mínimo 6 caracteres" secureTextEntry />
        <Campo ms={ms} label="Confirmar nova senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita a nova senha" secureTextEntry />
      </ModalEdicao>

      {toast && (
        <Animated.View style={[ms.toast, { opacity: toastOpacity, backgroundColor: toast.tipo === "sucesso" ? "#1a7a3a" : "#c0392b" }]}>
          <Text style={ms.toastTexto}>{toast.msg}</Text>
        </Animated.View>
      )}
    </SwipeTabsWrapper>
  );
}

type ModalStyles = ReturnType<typeof makeModalStyle>;

function ModalEdicao({ visible, titulo, onClose, onSalvar, loading, erro, ms, children }: {
  visible: boolean; titulo: string; onClose: () => void; onSalvar: () => void;
  loading: boolean; erro?: string | null; ms: ModalStyles; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={ms.overlay}>
        <View style={ms.modal}>
          <Text style={ms.modalTitulo}>{titulo}</Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {erro ? <View style={ms.modalErro}><Text style={ms.modalErroTexto}>{erro}</Text></View> : null}
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
    modal: { backgroundColor: c.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "85%" as any, flexShrink: 1, overflow: "hidden" as any },
    modalTitulo: { fontSize: 18, fontWeight: "700", color: c.textPrimary, marginBottom: 20 },
    inputLabel: { fontSize: 12, fontWeight: "600", color: c.textSecondary, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.textPrimary, marginBottom: 14, backgroundColor: c.backgroundSecondary },
    modalErro: { backgroundColor: "#c0392b22", borderWidth: 1, borderColor: "#c0392b", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12 },
    modalErroTexto: { color: "#c0392b", fontSize: 13, fontWeight: "600", textAlign: "center" },
    modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
    btnCancelar: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnCancelarText: { color: c.textSecondary, fontWeight: "600" },
    btnSalvar: { flex: 1, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnSalvarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    toast: { position: "absolute", bottom: 32, left: 24, right: 24, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    toastTexto: { color: "#fff", fontWeight: "600", fontSize: 14, textAlign: "center" },
    generoBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", backgroundColor: c.backgroundSecondary, borderWidth: 1, borderColor: c.border },
    generoBtnAtivo: { backgroundColor: c.primary, borderColor: c.primary },
    generoBtnTexto: { fontSize: 12, fontWeight: "600", color: c.textSecondary },
    generoBtnTextoAtivo: { color: "#fff" },
  });
