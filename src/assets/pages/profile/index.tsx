import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  Animated,
  Image,
  Switch,
  Alert,
} from "react-native";
import imgBiometria from "../../../../assets/biometria.png";
import { makeProfileStyle } from "./styles";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { SwipeTabsWrapper } from "../../components/SwipeTabsWrapper";
import {
  getDadosCadastro, editarPerfil, editarChavesPix, trocarSenha, putTema, atualizarPreferenciaLogin,
  getPinNegociacaoStatus, criarPinNegociacao, alterarPinNegociacao, recuperarPinSolicitar, verificarSenhaNegociacao,
  familiaConvidar, familiaGetPermissoes, familiaPutPermissoes, familiaRevogar, familiaGetConvitesPendentes, familiaGetGuardioes,
  putAvatar,
} from "../../../services/api";
import avatarMap from "../../avatarMap";
import type { DadosCadastroResponse, TuteladoItem, PermissoesTutelado, ConvitePendenteItem, GuardiaoItem } from "../../../types";
import { useFamilia } from "../../../context/FamiliaContext";
import { cadastrarBiometria, isPasskeySupported } from "../../../services/biometria";
import { ModalSelecionarAvatar } from "../../components/ModalSelecionarAvatar";

const PREP_MINUSCULA = new Set(["da", "de", "do", "das", "dos", "e", "a", "o", "as", "os"]);

function titleCaseName(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const safe = clean.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ''\-\s]/g, "");
  return safe
    .split(" ")
    .filter(Boolean)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && PREP_MINUSCULA.has(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

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

function validarCPF(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += +digits[i] * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== +digits[9]) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += +digits[i] * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === +digits[10];
}

const familiaS = StyleSheet.create({
  tuteladoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { fontSize: 16, fontWeight: "700" },
  nome: { fontSize: 14, fontWeight: "600" },
  email: { fontSize: 12, marginTop: 1 },
  btns: { flexDirection: "row", gap: 6 },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btnText: { fontSize: 12, fontWeight: "600" },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  permLabel: { fontSize: 14, flex: 1, marginRight: 12 },
  pixSubBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  pixSubTitulo: { fontSize: 12, fontWeight: "600", marginBottom: 10 },
  pixCheckRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pixCheckLabel: { fontSize: 14 },
  permsNota: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
    fontStyle: "italic",
  },
  conviteCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  convitesPendentesLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 12,
    marginBottom: 8,
  },
  pendenteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendenteBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  seletorItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  seletorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  seletorAvatarLetra: { fontSize: 18, fontWeight: "700" },
  seletorNome: { fontSize: 15, fontWeight: "600" },
  seletorEmail: { fontSize: 12, marginTop: 2 },
  seletorAtivo: { fontSize: 12, fontWeight: "700" },
});

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
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

  // Senha de Negociação
  const [pinCadastrado, setPinCadastrado] = useState<boolean | null>(null);

  const [modalCriarPin, setModalCriarPin] = useState(false);
  const [pinNovo1, setPinNovo1] = useState("");
  const [pinNovo1Conf, setPinNovo1Conf] = useState("");
  const [erroCriarPin, setErroCriarPin] = useState<string | null>(null);
  const [criandoPin, setCriandoPin] = useState(false);

  const [modalAlterarPin, setModalAlterarPin] = useState(false);
  const [pinAtual, setPinAtual] = useState("");
  const [pinNovo2, setPinNovo2] = useState("");
  const [pinNovo2Conf, setPinNovo2Conf] = useState("");
  const [erroAlterarPin, setErroAlterarPin] = useState<string | null>(null);
  const [alterandoPin, setAlterandoPin] = useState(false);

  const [modalRecuperarPin, setModalRecuperarPin] = useState(false);
  const [senhaRecupPin, setSenhaRecupPin] = useState("");
  const [erroRecupPin, setErroRecupPin] = useState<string | null>(null);
  const [recuperandoPin, setRecuperandoPin] = useState(false);
  const [recupPinEnviado, setRecupPinEnviado] = useState(false);

  // Confirmação por Senha de Negociação antes de salvar dados/pix
  const [modalConfSenha, setModalConfSenha] = useState(false);
  const [senhaConf, setSenhaConf] = useState("");
  const [erroSenhaConf, setErroSenhaConf] = useState<string | null>(null);
  const [verificandoSenha, setVerificandoSenha] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<"dados" | "pix" | null>(null);

  const [toast, setToast] = useState<{ msg: string; tipo: "sucesso" | "erro" } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modo Família
  const { tutelados, atuandoComo, carregarTutelados, trocarParaTutelado } = useFamilia();

  const [modalConvite, setModalConvite] = useState(false);
  const [emailConvite, setEmailConvite] = useState("");
  const [erroConvite, setErroConvite] = useState<string | null>(null);
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const [modalPermissoes, setModalPermissoes] = useState(false);
  const [tuteladoSelecionado, setTuteladoSelecionado] = useState<TuteladoItem | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesTutelado | null>(null);
  const [carregandoPerms, setCarregandoPerms] = useState(false);
  const [salvandoPerms, setSalvandoPerms] = useState(false);
  const [erroPerms, setErroPerms] = useState<string | null>(null);

  const [modalAvatar, setModalAvatar] = useState(false);
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);

  const [modalSeletor, setModalSeletor] = useState(false);
  const [trocandoPerfil, setTrocandoPerfil] = useState<number | null>(null);
  const [convitesPendentes, setConvitesPendentes] = useState<ConvitePendenteItem[]>([]);
  const [guardioes, setGuardioes] = useState<GuardiaoItem[]>([]);
  const [guardiaoesCarregados, setGuardioesCarregados] = useState(false);

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
    getPinNegociacaoStatus(user.id)
      .then((s) => { if (user?.id) setPinCadastrado(s.senha_cadastrada); })
      .catch(() => { if (user?.id) setPinCadastrado(null); });
    if (!atuandoComo) {
      familiaGetGuardioes()
        .then((g) => { setGuardioes(g); setGuardioesCarregados(true); })
        .catch(() => { setGuardioes([]); setGuardioesCarregados(true); });
      carregarTutelados();
      familiaGetConvitesPendentes().then(setConvitesPendentes).catch(() => {});
    }
  }, [user?.id, atuandoComo, carregarTutelados]);

  async function handleEnviarConvite() {
    const emailNorm = emailConvite.trim().toLowerCase();

    if (!emailNorm) { setErroConvite("Informe um e-mail."); return; }

    if (!/@.+\..+/.test(emailNorm)) { setErroConvite("Informe um e-mail válido (ex: nome@email.com)."); return; }

    if (user?.email && emailNorm === user.email.toLowerCase()) {
      setErroConvite("Você não pode convidar a si mesmo.");
      return;
    }

    if (tutelados.some((t) => t.tutelado_email.toLowerCase() === emailNorm)) {
      setErroConvite("Este e-mail já está vinculado como dependente.");
      return;
    }

    try {
      setEnviandoConvite(true);
      setErroConvite(null);
      await familiaConvidar(emailNorm);
      setModalConvite(false);
      setEmailConvite("");
      mostrarToast("Convite enviado com sucesso!", "sucesso");
      carregarTutelados();
      familiaGetConvitesPendentes().then(setConvitesPendentes).catch(() => {});
    } catch (e: any) {
      setErroConvite(e?.message || "Não foi possível enviar o convite.");
    } finally {
      setEnviandoConvite(false);
    }
  }

  async function abrirModalPermissoes(t: TuteladoItem) {
    setTuteladoSelecionado(t);
    setErroPerms(null);
    setPermissoes(null);
    setModalPermissoes(true);
    try {
      setCarregandoPerms(true);
      const p = await familiaGetPermissoes(t.tutelado_id);
      setPermissoes(p);
    } catch (e: any) {
      setErroPerms(e?.message || "Não foi possível carregar as permissões.");
    } finally {
      setCarregandoPerms(false);
    }
  }

  async function handleSalvarAvatar(avatarId: number) {
    if (!user?.id) return;
    try {
      setSalvandoAvatar(true);
      await putAvatar(user.id, avatarId);
      updateUser({ ...user, avatarId });
      setModalAvatar(false);
      mostrarToast("Avatar atualizado!", "sucesso");
    } catch (e: any) {
      mostrarToast(e?.message || "Não foi possível atualizar o avatar.", "erro");
    } finally {
      setSalvandoAvatar(false);
    }
  }

  async function salvarPermissao(campo: keyof Omit<PermissoesTutelado, "tutelado_id" | "atualizado_em" | "chaves_pix_autorizadas">, valor: boolean) {
    if (!tuteladoSelecionado || !permissoes) return;
    const novas = { ...permissoes, [campo]: valor };
    setPermissoes(novas);
    try {
      setSalvandoPerms(true);
      await familiaPutPermissoes(tuteladoSelecionado.tutelado_id, { [campo]: valor });
      mostrarToast("Permissão atualizada.", "sucesso");
    } catch (e: any) {
      setPermissoes(permissoes);
      mostrarToast(e?.message || "Erro ao salvar permissão.", "erro");
    } finally {
      setSalvandoPerms(false);
    }
  }

  async function salvarChavesPix(chaves: string[]) {
    if (!tuteladoSelecionado || !permissoes) return;
    const novas = { ...permissoes, chaves_pix_autorizadas: chaves };
    setPermissoes(novas);
    try {
      await familiaPutPermissoes(tuteladoSelecionado.tutelado_id, { chaves_pix_autorizadas: chaves });
      mostrarToast("Chaves Pix atualizadas.", "sucesso");
    } catch (e: any) {
      setPermissoes(permissoes);
      mostrarToast(e?.message || "Erro ao salvar chaves Pix.", "erro");
    }
  }

  function confirmarRevogar(t: TuteladoItem) {
    Alert.alert(
      "Remover vínculo",
      `Tem certeza que deseja remover ${t.tutelado_nome} como dependente?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await familiaRevogar(t.tutelado_id);
              mostrarToast("Vínculo removido.", "sucesso");
              carregarTutelados();
            } catch (e: any) {
              mostrarToast(e?.message || "Não foi possível remover o vínculo.", "erro");
            }
          },
        },
      ]
    );
  }

  async function handleTrocarPerfil(tuteladoId: number, nome: string) {
    setModalSeletor(false);
    mostrarToast(`Entrando na conta de ${nome}...`, "sucesso");
    try {
      await trocarParaTutelado(tuteladoId, nome);
    } catch (e: any) {
      mostrarToast(e?.message || "Não foi possível trocar de perfil.", "erro");
    }
  }

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

  function salvarDados() {
    if (!nomeEdit.trim()) { mostrarToast("Nome não pode ficar em branco.", "erro"); return; }
    setAcaoPendente("dados");
    setSenhaConf("");
    setErroSenhaConf(null);
    setModalConfSenha(true);
  }

  function salvarPix() {
    const cpfDigits = pixCpfEdit.replace(/\D/g, "");
    if (cpfDigits && !validarCPF(cpfDigits)) {
      setErroPix("CPF inválido. Verifique e tente novamente.");
      return;
    }
    setAcaoPendente("pix");
    setSenhaConf("");
    setErroSenhaConf(null);
    setModalConfSenha(true);
  }

  async function executarSalvarPendente() {
    if (!senhaConf || senhaConf.length !== 4) {
      setErroSenhaConf("Informe os 4 dígitos da Senha de Negociação.");
      return;
    }
    setVerificandoSenha(true);
    setErroSenhaConf(null);
    try {
      await verificarSenhaNegociacao(user!.id, senhaConf);
      setSalvando(true);
      if (acaoPendente === "dados") {
        await editarPerfil(user!.id, {
          nome_completo: titleCaseName(nomeEdit),
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
        setModalConfSenha(false);
        setModalDados(false);
        carregar();
        mostrarToast("Dados salvos com sucesso!", "sucesso");
      } else if (acaoPendente === "pix") {
        await editarChavesPix(user!.id, {
          pix_cpf: pixCpfEdit.replace(/\D/g, ""),
          pix_celular: pixCelEdit.replace(/\D/g, ""),
          pix_email: pixEmailEdit.trim(),
          pix_chave: pixChaveEdit.trim(),
        });
        setModalConfSenha(false);
        setModalPix(false);
        carregar();
        mostrarToast("Chaves Pix salvas com sucesso!", "sucesso");
      }
    } catch (e: any) {
      if (e?.status === 401) {
        const tent = e?.data?.tentativas_restantes;
        setErroSenhaConf(`Senha incorreta.${tent != null ? ` ${tentativasLabel(tent)}.` : ""}`);
      } else if (e?.status === 423) {
        const ate = e?.data?.bloqueado_ate;
        let msg = "Conta bloqueada temporariamente.";
        if (ate) {
          try {
            const hora = new Date(ate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            msg = `Conta bloqueada. Tente novamente após ${hora}.`;
          } catch {}
        }
        setErroSenhaConf(msg);
      } else {
        setModalConfSenha(false);
        if (acaoPendente === "dados") setErroDados(e?.message || "Não foi possível salvar os dados.");
        else setErroPix(e?.message || "Não foi possível salvar as chaves Pix.");
      }
    } finally {
      setVerificandoSenha(false);
      setSalvando(false);
    }
  }

  async function salvarSenha() {
    if (!senhaAtual) { setErroSenha("Informe a senha atual."); return; }
    if (novaSenha.length < 8 || !/[A-Z]/.test(novaSenha) || !/[!@#$%^&*()\-_=+.]/.test(novaSenha)) {
      setErroSenha("A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial (! @ # $ % ^ & * - _ = + .).");
      return;
    }
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

  function tentativasLabel(n: number) {
    return `${n} tentativa${n !== 1 ? "s" : ""} restante${n !== 1 ? "s" : ""}`;
  }

  async function handleCriarPin() {
    if (pinNovo1.length !== 4 || !/^\d{4}$/.test(pinNovo1)) {
      setErroCriarPin("A senha deve ter exatamente 4 dígitos numéricos."); return;
    }
    if (pinNovo1 !== pinNovo1Conf) { setErroCriarPin("As senhas não coincidem."); return; }
    try {
      setCriandoPin(true); setErroCriarPin(null);
      await criarPinNegociacao(user!.id, { senha: pinNovo1, senha_confirmacao: pinNovo1Conf });
      setModalCriarPin(false); setPinNovo1(""); setPinNovo1Conf("");
      setPinCadastrado(true);
      mostrarToast("Senha de Negociação criada com sucesso!", "sucesso");
    } catch (e: any) {
      setErroCriarPin(e?.message || "Não foi possível criar a senha.");
    } finally { setCriandoPin(false); }
  }

  async function handleAlterarPin() {
    if (!pinAtual) { setErroAlterarPin("Informe a senha atual."); return; }
    if (pinNovo2.length !== 4 || !/^\d{4}$/.test(pinNovo2)) {
      setErroAlterarPin("A nova senha deve ter exatamente 4 dígitos numéricos."); return;
    }
    if (pinNovo2 !== pinNovo2Conf) { setErroAlterarPin("As senhas não coincidem."); return; }
    try {
      setAlterandoPin(true); setErroAlterarPin(null);
      await alterarPinNegociacao(user!.id, { senha_atual: pinAtual, senha_nova: pinNovo2, senha_confirmacao: pinNovo2Conf });
      setModalAlterarPin(false); setPinAtual(""); setPinNovo2(""); setPinNovo2Conf("");
      mostrarToast("Senha de Negociação alterada com sucesso!", "sucesso");
    } catch (e: any) {
      if (e?.status === 401) {
        const tent = e?.data?.tentativas_restantes;
        setErroAlterarPin(`Senha atual incorreta.${tent != null ? ` ${tentativasLabel(tent)}.` : ""}`);
      } else if (e?.status === 423) {
        const ate = e?.data?.bloqueado_ate;
        let msg = "Conta bloqueada temporariamente.";
        if (ate) {
          try {
            const hora = new Date(ate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            msg = `Conta bloqueada. Tente novamente após ${hora}.`;
          } catch {}
        }
        setErroAlterarPin(msg);
      } else {
        setErroAlterarPin(e?.message || "Não foi possível alterar a senha.");
      }
    } finally { setAlterandoPin(false); }
  }

  async function handleRecuperarPin() {
    if (!senhaRecupPin) { setErroRecupPin("Informe sua senha de login."); return; }
    try {
      setRecuperandoPin(true); setErroRecupPin(null);
      await recuperarPinSolicitar(user!.id, { senha_login: senhaRecupPin });
      setRecupPinEnviado(true);
    } catch (e: any) {
      setErroRecupPin(e?.message || "Não foi possível enviar o e-mail de recuperação.");
    } finally { setRecuperandoPin(false); }
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
    <>
    <SwipeTabsWrapper currentTab="Patrimônio">
      <ScrollView
        style={style.container}
        contentContainerStyle={style.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cabeçalho */}
        <View style={style.header}>
          <TouchableOpacity style={style.avatarWrap} onPress={() => setModalAvatar(true)}>
            {user?.avatarId && avatarMap[user.avatarId] ? (
              <Image source={avatarMap[user.avatarId]} style={style.avatarImg} />
            ) : (
              <View style={style.avatar}>
                <Text style={style.avatarLetra}>{dados?.nome_completo?.[0] ?? "?"}</Text>
              </View>
            )}
            <View style={style.avatarEditBtn}>
              <Text style={style.avatarEditBtnText}>✎</Text>
            </View>
          </TouchableOpacity>
          <Text style={style.nome}>{dados?.nome_completo ? titleCaseName(dados.nome_completo) : "—"}</Text>
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
              onPress={() => { setDark(false); if (user?.id) putTema(user.id, "claro").catch(() => { setDark(true); mostrarToast("Não foi possível salvar a preferência de tema.", "erro"); }); }}
            >
              <Text style={[style.toggleBtnText, !isDark && style.toggleBtnTextActive]}>Claro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[style.toggleBtn, isDark && style.toggleBtnActive]}
              onPress={() => { setDark(true); if (user?.id) putTema(user.id, "escuro").catch(() => { setDark(false); mostrarToast("Não foi possível salvar a preferência de tema.", "erro"); }); }}
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
          <View style={style.linha}><Text style={style.linhaLabel}>Nome completo</Text><Text style={style.linhaValor}>{dados?.nome_completo ? titleCaseName(dados.nome_completo) : "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Apelido</Text><Text style={style.linhaValor}>{dados?.apelido ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Data de nascimento</Text><Text style={style.linhaValor}>{formatDate(dados?.data_nascimento)}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Gênero</Text><Text style={style.linhaValor}>{dados?.genero ?? "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Nome da mãe</Text><Text style={style.linhaValor}>{dados?.nome_da_mae ? titleCaseName(dados.nome_da_mae) : "—"}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Celular</Text><Text style={style.linhaValor}>{formatarCelular(dados?.celular)}</Text></View>
          <View style={style.linha}><Text style={style.linhaLabel}>Endereço</Text><Text style={style.linhaValor}>{[dados?.logradouro, dados?.numero_da_rua, dados?.complemento, dados?.bairro, dados?.cidade, dados?.estado, dados?.cep].filter(Boolean).join(", ") || "—"}</Text></View>
          <View style={[style.linha, { borderBottomWidth: 0 }]}><Text style={style.linhaLabel}>Membro desde</Text><Text style={style.linhaValor}>{formatDate(dados?.created_at)}</Text></View>
        </View>

        {/* Plataforma */}
        <View style={style.secao}>
          <Text style={[style.secaoTitulo, { marginBottom: 8 }]}>Plataforma</Text>
          <View style={[style.linha, { borderBottomWidth: 0 }]}><Text style={style.linhaLabel}>Assinatura</Text><Text style={style.linhaValor}>{dados?.assinatura ?? "—"}</Text></View>
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
            <Text style={[ms.secaoBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Trocar senha de acesso</Text>
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

        {/* Senha de Negociação */}
        <View style={style.secao}>
          <Text style={[style.secaoTitulo, { marginBottom: 8 }]}>Senha de Negociação</Text>
          <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
            Proteja seus saques e edições com uma senha de 4 dígitos numéricos.
          </Text>
          {pinCadastrado === false && (
            <TouchableOpacity
              style={[ms.secaoBtn, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary }]}
              onPress={() => { setPinNovo1(""); setPinNovo1Conf(""); setErroCriarPin(null); setModalCriarPin(true); }}
            >
              <Text style={[ms.secaoBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Criar Senha de Negociação</Text>
            </TouchableOpacity>
          )}
          {pinCadastrado === true && (
            <>
              <TouchableOpacity
                style={[ms.secaoBtn, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary, marginBottom: 10 }]}
                onPress={() => { setPinAtual(""); setPinNovo2(""); setPinNovo2Conf(""); setErroAlterarPin(null); setModalAlterarPin(true); }}
              >
                <Text style={[ms.secaoBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Trocar senha de negociação</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.secaoBtn, { borderColor: colors.border }]}
                onPress={() => { setSenhaRecupPin(""); setErroRecupPin(null); setRecupPinEnviado(false); setModalRecuperarPin(true); }}
              >
                <Text style={[ms.secaoBtnText, { color: colors.textSecondary }]}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Modo Família — Seletor de conta (quando tem tutelados ou está atuando como tutelado) */}
        {(tutelados.length > 0 || atuandoComo) && (
          <View style={style.secao}>
            <Text style={[style.secaoTitulo, { marginBottom: 12 }]}>Perfil ativo</Text>
            <TouchableOpacity
              style={[ms.secaoBtn, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary }]}
              onPress={() => setModalSeletor(true)}
            >
              <Text style={[ms.secaoBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Alternar conta</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modo Família — Dependente: mostra guardiões */}
        {!atuandoComo && guardiaoesCarregados && guardioes.length > 0 && (
          <View style={style.secao}>
            <Text style={[style.secaoTitulo, { marginBottom: 8 }]}>Modo Família</Text>
            <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
              Você está vinculado como dependente ou tutelado das seguintes pessoas:
            </Text>
            {guardioes.map((g) => (
              <View key={g.id} style={[familiaS.tuteladoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={[familiaS.avatar, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[familiaS.avatarLetra, { color: colors.primary }]}>{g.nome_completo?.[0]?.toUpperCase() ?? "?"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[familiaS.nome, { color: colors.textPrimary }]}>{titleCaseName(g.nome_completo)}</Text>
                  <Text style={[familiaS.email, { color: colors.textSecondary }]}>Guardião</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Modo Família — Guardião: gerenciar dependentes */}
        {!atuandoComo && guardiaoesCarregados && guardioes.length === 0 && (
          <View style={style.secao}>
            <Text style={[style.secaoTitulo, { marginBottom: 8 }]}>Modo Família</Text>
            <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
              Vincule dependentes ou tutelados e gerencie o que cada um pode fazer na conta deles.
            </Text>
            {tutelados.map((t) => (
              <View key={t.id} style={[familiaS.tuteladoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={[familiaS.avatar, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[familiaS.avatarLetra, { color: colors.primary }]}>{t.tutelado_nome?.[0]?.toUpperCase() ?? "?"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[familiaS.nome, { color: colors.textPrimary }]}>{t.tutelado_nome}</Text>
                  <Text style={[familiaS.email, { color: colors.textSecondary }]} numberOfLines={1}>{t.tutelado_email}</Text>
                </View>
                <View style={familiaS.btns}>
                  <TouchableOpacity
                    style={[familiaS.btn, { borderColor: colors.primary }]}
                    onPress={() => abrirModalPermissoes(t)}
                  >
                    <Text style={[familiaS.btnText, { color: colors.primary }]}>Permissões</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[familiaS.btn, { borderColor: "#FF3B30" }]}
                    onPress={() => confirmarRevogar(t)}
                  >
                    <Text style={[familiaS.btnText, { color: "#FF3B30" }]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[ms.secaoBtn, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary, borderColor: isDark ? colors.border : colors.primary }]}
              onPress={() => { setEmailConvite(""); setErroConvite(null); setModalConvite(true); }}
            >
              <Text style={[ms.secaoBtnText, { color: isDark ? colors.textPrimary : "#fff" }]}>Adicionar dependente ou tutelado</Text>
            </TouchableOpacity>
            {convitesPendentes.length > 0 && (
              <>
                <Text style={[familiaS.convitesPendentesLabel, { color: colors.textSecondary }]}>Convites aguardando resposta</Text>
                {convitesPendentes.map((c) => (
                  <View key={c.id} style={[familiaS.conviteCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[familiaS.nome, { color: colors.textPrimary }]}>{c.email_convidado}</Text>
                      <Text style={[familiaS.email, { color: colors.textSecondary }]}>Expira em {formatDate(c.expira_em)}</Text>
                    </View>
                    <View style={[familiaS.pendenteBadge, { backgroundColor: "#F5A62322" }]}>
                      <Text style={[familiaS.pendenteBadgeText, { color: "#F5A623" }]}>Pendente</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={style.botaoSair} onPress={logout}>
          <Text style={style.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal — Convidar tutelado */}
      <Modal visible={modalConvite} animationType="slide" transparent>
        <View style={ms.overlay}>
          <View style={ms.modal}>
            <Text style={ms.modalTitulo}>Convidar dependente</Text>
            <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
              Informe o e-mail do usuário que deseja vincular como dependente. Um e-mail de convite será enviado.
            </Text>
            <Text style={ms.inputLabel}>E-mail do dependente</Text>
            <TextInput
              style={ms.input}
              placeholder="e-mail@exemplo.com"
              placeholderTextColor="#bbb"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailConvite}
              onChangeText={(v) => { setEmailConvite(v); setErroConvite(null); }}
            />
            {erroConvite && <View style={ms.modalErro}><Text style={ms.modalErroTexto}>{erroConvite}</Text></View>}
            <View style={ms.modalBtns}>
              <TouchableOpacity style={ms.btnCancelar} onPress={() => setModalConvite(false)}>
                <Text style={ms.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.btnSalvar, enviandoConvite && { opacity: 0.6 }]}
                onPress={handleEnviarConvite}
                disabled={enviandoConvite}
              >
                {enviandoConvite ? <ActivityIndicator color="#fff" /> : <Text style={ms.btnSalvarText}>Enviar convite</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal — Permissões do tutelado */}
      <Modal visible={modalPermissoes} animationType="slide" transparent>
        <View style={ms.overlay}>
          <View style={[ms.modal, { maxHeight: "90%" as any }]}>
            <Text style={ms.modalTitulo}>Permissões — {tuteladoSelecionado?.tutelado_nome}</Text>
            <View style={{ flex: 1 }}>
            {carregandoPerms ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
            ) : erroPerms ? (
              <View style={ms.modalErro}><Text style={ms.modalErroTexto}>{erroPerms}</Text></View>
            ) : permissoes ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <Text style={[familiaS.permsNota, { color: colors.textTertiary }]}>
                  Estas configurações são compartilhadas entre todos os responsáveis deste usuário.
                </Text>
                {([
                  { campo: "pode_depositar" as const, label: "Pode realizar depósitos" },
                  { campo: "pode_criar_objetivos" as const, label: "Pode criar objetivos" },
                  { campo: "pode_alterar_perfil" as const, label: "Pode alterar dados de perfil" },
                  { campo: "pode_alterar_pix" as const, label: "Pode alterar chaves Pix" },
                ] as const).map(({ campo, label }) => (
                  <View key={campo} style={[familiaS.permRow, { borderBottomColor: colors.border }]}>
                    <Text style={[familiaS.permLabel, { color: colors.textPrimary }]}>{label}</Text>
                    <Switch
                      value={permissoes[campo]}
                      onValueChange={(v) => salvarPermissao(campo, v)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                      disabled={salvandoPerms}
                    />
                  </View>
                ))}
                {/* Pode sacar (com sub-seleção de chaves Pix) */}
                <View style={[familiaS.permRow, { borderBottomColor: colors.border }]}>
                  <Text style={[familiaS.permLabel, { color: colors.textPrimary }]}>Pode realizar saques</Text>
                  <Switch
                    value={permissoes.pode_sacar}
                    onValueChange={(v) => salvarPermissao("pode_sacar", v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                    disabled={salvandoPerms}
                  />
                </View>
                {permissoes.pode_sacar && (
                  <View style={[familiaS.pixSubBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Text style={[familiaS.pixSubTitulo, { color: colors.textSecondary }]}>Chaves Pix autorizadas para saque:</Text>
                    {([
                      { key: "pix_cpf", label: "CPF" },
                      { key: "pix_celular", label: "Celular" },
                      { key: "pix_email", label: "E-mail" },
                      { key: "pix_chave", label: "Chave aleatória" },
                    ]).map(({ key, label }) => {
                      const ativa = permissoes.chaves_pix_autorizadas.includes(key);
                      return (
                        <TouchableOpacity
                          key={key}
                          style={familiaS.pixCheckRow}
                          onPress={() => {
                            const novas = ativa
                              ? permissoes.chaves_pix_autorizadas.filter((c) => c !== key)
                              : [...permissoes.chaves_pix_autorizadas, key];
                            salvarChavesPix(novas);
                          }}
                        >
                          <View style={[familiaS.checkbox, { borderColor: ativa ? colors.primary : colors.border, backgroundColor: ativa ? colors.primary : "transparent" }]}>
                            {ativa && <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>✓</Text>}
                          </View>
                          <Text style={[familiaS.pixCheckLabel, { color: colors.textPrimary }]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : null}
            <TouchableOpacity style={[ms.btnSalvar, { marginTop: 8, flex: 0 }]} onPress={() => setModalPermissoes(false)}>
              <Text style={ms.btnSalvarText}>Fechar</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal — Seletor de perfil */}
      <Modal visible={modalSeletor} animationType="none" transparent>
        <View style={ms.overlay}>
          <View style={ms.modal}>
            <Text style={ms.modalTitulo}>Escolher perfil</Text>
            {/* Minha conta */}
            <TouchableOpacity
              style={[familiaS.seletorItem, {
                borderColor: !atuandoComo ? colors.primary : colors.border,
                backgroundColor: !atuandoComo ? colors.primary + "11" : colors.backgroundSecondary,
              }]}
              onPress={() => {
                if (!atuandoComo) { setModalSeletor(false); return; }
                setModalSeletor(false);
              }}
              disabled={!atuandoComo}
            >
              <View style={[familiaS.seletorAvatar, { backgroundColor: colors.primary + "33" }]}>
                <Text style={[familiaS.seletorAvatarLetra, { color: colors.primary }]}>
                  {dados?.nome_completo?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[familiaS.seletorNome, { color: colors.textPrimary }]}>
                  {dados?.apelido || dados?.nome_completo || "Minha conta"}
                </Text>
                <Text style={[familiaS.seletorEmail, { color: colors.textSecondary }]}>Conta principal</Text>
              </View>
              {!atuandoComo && <Text style={[familiaS.seletorAtivo, { color: colors.primary }]}>Ativo</Text>}
            </TouchableOpacity>
            {/* Tutelados */}
            {tutelados.map((t) => {
              const isAtivo = atuandoComo?.id === t.tutelado_id;
              return (
                <Pressable
                  key={t.id}
                  style={[familiaS.seletorItem, {
                    borderColor: isAtivo ? colors.primary : colors.border,
                    backgroundColor: isAtivo ? colors.primary + "11" : colors.backgroundSecondary,
                    opacity: trocandoPerfil === t.tutelado_id ? 0.6 : 1,
                  }]}
                  onPress={() => handleTrocarPerfil(t.tutelado_id, t.tutelado_nome)}
                  disabled={!!trocandoPerfil || isAtivo}
                >
                  <View style={[familiaS.seletorAvatar, { backgroundColor: "#E0700011" }]}>
                    <Text style={[familiaS.seletorAvatarLetra, { color: "#E07000" }]}>
                      {t.tutelado_nome?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[familiaS.seletorNome, { color: colors.textPrimary }]}>{t.tutelado_nome}</Text>
                    <Text style={[familiaS.seletorEmail, { color: colors.textSecondary }]} numberOfLines={1}>{t.tutelado_email}</Text>
                  </View>
                  {trocandoPerfil === t.tutelado_id
                    ? <ActivityIndicator color={colors.primary} size="small" />
                    : isAtivo
                      ? <Text style={[familiaS.seletorAtivo, { color: colors.primary }]}>Ativo</Text>
                      : null
                  }
                </Pressable>
              );
            })}
            <TouchableOpacity style={[ms.btnCancelar, { marginTop: 16 }]} onPress={() => setModalSeletor(false)}>
              <Text style={ms.btnCancelarText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        <Campo ms={ms} label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} placeholder="Mínimo 8 caracteres" secureTextEntry />
        <Campo ms={ms} label="Confirmar nova senha" value={confirmarSenha} onChangeText={setConfirmarSenha} placeholder="Repita a nova senha" secureTextEntry />
        <View style={{ marginBottom: 14 }}>
          {([
            { ok: novaSenha.length >= 8, texto: "No mínimo 8 caracteres" },
            { ok: /[A-Z]/.test(novaSenha), texto: "No mínimo 1 letra maiúscula" },
            { ok: /[!@#$%^&*()\-_=+.]/.test(novaSenha), texto: "No mínimo 1 caractere especial (! @ # $ % ^ & * - _ = + .)" },
          ] as const).map(({ ok, texto }) => (
            <View key={texto} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Text style={{ color: ok ? colors.primary : colors.textTertiary, fontSize: 10 }}>●</Text>
              <Text style={{ color: ok ? colors.primary : colors.textTertiary, fontSize: 12 }}>{texto}</Text>
            </View>
          ))}
        </View>
      </ModalEdicao>

      {/* Modal — Criar Senha de Negociação */}
      <ModalEdicao
        visible={modalCriarPin}
        titulo="Criar Senha de Negociação"
        onClose={() => setModalCriarPin(false)}
        onSalvar={handleCriarPin}
        loading={criandoPin}
        erro={erroCriarPin}
        ms={ms}
      >
        <Campo ms={ms} label="Senha (4 dígitos)" value={pinNovo1} onChangeText={(v) => { setPinNovo1(v); setErroCriarPin(null); }} placeholder="••••" keyboardType="number-pad" secureTextEntry />
        <Campo ms={ms} label="Confirmar Senha" value={pinNovo1Conf} onChangeText={(v) => { setPinNovo1Conf(v); setErroCriarPin(null); }} placeholder="••••" keyboardType="number-pad" secureTextEntry />
      </ModalEdicao>

      {/* Modal — Alterar Senha de Negociação */}
      <ModalEdicao
        visible={modalAlterarPin}
        titulo="Alterar Senha de Negociação"
        onClose={() => setModalAlterarPin(false)}
        onSalvar={handleAlterarPin}
        loading={alterandoPin}
        erro={erroAlterarPin}
        ms={ms}
      >
        <Campo ms={ms} label="Senha atual" value={pinAtual} onChangeText={(v) => { setPinAtual(v); setErroAlterarPin(null); }} placeholder="••••" keyboardType="number-pad" secureTextEntry />
        <Campo ms={ms} label="Nova senha (4 dígitos)" value={pinNovo2} onChangeText={(v) => { setPinNovo2(v); setErroAlterarPin(null); }} placeholder="••••" keyboardType="number-pad" secureTextEntry />
        <Campo ms={ms} label="Confirmar nova senha" value={pinNovo2Conf} onChangeText={(v) => { setPinNovo2Conf(v); setErroAlterarPin(null); }} placeholder="••••" keyboardType="number-pad" secureTextEntry />
      </ModalEdicao>

      {/* Modal — Recuperar Senha de Negociação */}
      <Modal visible={modalRecuperarPin} animationType="slide" transparent>
        <View style={ms.overlay}>
          <View style={ms.modal}>
            <Text style={ms.modalTitulo}>Recuperar Senha de Negociação</Text>
            {recupPinEnviado ? (
              <>
                <Text style={[ms.bioDesc, { color: colors.primary, marginBottom: 20 }]}>
                  E-mail enviado! Verifique sua caixa de entrada para redefinir a senha. O link expira em 15 minutos.
                </Text>
                <TouchableOpacity style={ms.btnSalvar} onPress={() => setModalRecuperarPin(false)}>
                  <Text style={ms.btnSalvarText}>Fechar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
                  Informe a senha do seu login para confirmar sua identidade. Enviaremos um e-mail com o link de recuperação da senha.
                </Text>
                <Text style={ms.inputLabel}>Senha de Login</Text>
                <TextInput
                  style={ms.input}
                  placeholder="Sua senha de acesso"
                  placeholderTextColor="#bbb"
                  secureTextEntry
                  autoCapitalize="none"
                  value={senhaRecupPin}
                  onChangeText={(v) => { setSenhaRecupPin(v); setErroRecupPin(null); }}
                />
                {erroRecupPin && (
                  <View style={ms.modalErro}><Text style={ms.modalErroTexto}>{erroRecupPin}</Text></View>
                )}
                <View style={ms.modalBtns}>
                  <TouchableOpacity style={ms.btnCancelar} onPress={() => setModalRecuperarPin(false)}>
                    <Text style={ms.btnCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[ms.btnSalvar, recuperandoPin && { opacity: 0.6 }]}
                    onPress={handleRecuperarPin}
                    disabled={recuperandoPin}
                  >
                    {recuperandoPin
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={ms.btnSalvarText}>Enviar e-mail</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal — Confirmar com Senha de Negociação */}
      <Modal visible={modalConfSenha} animationType="slide" transparent>
        <View style={ms.overlay}>
          <View style={ms.modal}>
            <Text style={ms.modalTitulo}>Confirmar identidade</Text>
            <Text style={[ms.bioDesc, { color: colors.textSecondary }]}>
              Informe sua Senha de Negociação de 4 dígitos para confirmar a alteração.
            </Text>
            <Text style={ms.inputLabel}>Senha de Negociação</Text>
            <TextInput
              style={ms.input}
              placeholder="••••"
              placeholderTextColor="#bbb"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={senhaConf}
              onChangeText={(v) => { setSenhaConf(v); setErroSenhaConf(null); }}
            />
            {erroSenhaConf && (
              <View style={ms.modalErro}><Text style={ms.modalErroTexto}>{erroSenhaConf}</Text></View>
            )}
            <View style={ms.modalBtns}>
              <TouchableOpacity style={ms.btnCancelar} onPress={() => setModalConfSenha(false)}>
                <Text style={ms.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.btnSalvar, (verificandoSenha || salvando) && { opacity: 0.6 }]}
                onPress={executarSalvarPendente}
                disabled={verificandoSenha || salvando}
              >
                {(verificandoSenha || salvando)
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={ms.btnSalvarText}>Confirmar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toast && (
        <Animated.View style={[ms.toast, { opacity: toastOpacity, backgroundColor: toast.tipo === "sucesso" ? "#1a7a3a" : "#c0392b" }]}>
          <Text style={ms.toastTexto}>{toast.msg}</Text>
        </Animated.View>
      )}

    </SwipeTabsWrapper>
    <ModalSelecionarAvatar
      visible={modalAvatar}
      onClose={() => setModalAvatar(false)}
      avatarAtual={user?.avatarId ?? null}
      onSalvar={handleSalvarAvatar}
      loading={salvandoAvatar}
      colors={colors}
      nomeInicial={dados?.nome_completo?.[0] ?? "?"}
    />
  </>
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
