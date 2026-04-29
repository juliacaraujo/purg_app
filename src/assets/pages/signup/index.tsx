/**
 * Purg — Page Meta
 * @page Criar Conta (Signup)
 * @version 1.3.0
 * @status active
 * @lastUpdate 2026-03-21
 * @changes
 * - 1.3.0: Termos movidos para tela separada (Terms), botão Cadastrar navega para Terms após validação
 * - 1.2.2: Retorno do campo de confirmação de senha e validação de igualdade
 * - 1.2.1: Correção de regex inválido (erro Metro Bundler)
 * - 1.2.0: Máscara CPF/celular e formatação do nome
 * - 1.1.0: Checkbox de termos, mostrar/ocultar senha e disclaimer
 * - 1.0.0: Versão inicial da tela
 */

import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { style } from "./styles";

export default function Signup({ navigation }) {
  const [nome, setNome] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");

  const [dataNasc, setDataNasc] = useState("");
  const [genero, setGenero] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [erroCelular, setErroCelular] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [erroDataNasc, setErroDataNasc] = useState("");

  // -----------------------------
  // Helpers de formatação (SAFE)
  // -----------------------------
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  const formatCPF = (value: string) => {
    const d = onlyDigits(value).slice(0, 11);
    let out = d.slice(0, 3);
    if (d.length >= 4) out += "." + d.slice(3, 6);
    if (d.length >= 7) out += "." + d.slice(6, 9);
    if (d.length >= 10) out += "-" + d.slice(9, 11);
    return out;
  };

  const formatPhoneBR = (value: string) => {
    const d = onlyDigits(value).slice(0, 11);
    const ddd = d.slice(0, 2);
    const rest = d.slice(2);

    const is11 = rest.length > 8;
    const p1 = is11 ? rest.slice(0, 5) : rest.slice(0, 4);
    const p2 = is11 ? rest.slice(5, 9) : rest.slice(4, 8);

    let out = "";
    if (ddd) out += `(${ddd}) `;
    out += p1;
    if (p2) out += `-${p2}`;
    return out.trim();
  };

  const normalizeSpaces = (value: string) =>
    value.replace(/\s+/g, " ").trimStart();

  const formatDataNasc = (value: string) => {
    const d = onlyDigits(value).slice(0, 8);
    let out = d.slice(0, 2);
    if (d.length >= 3) out += "/" + d.slice(2, 4);
    if (d.length >= 5) out += "/" + d.slice(4, 8);
    return out;
  };

  const dataNascParaISO = (value: string): string => {
    const d = onlyDigits(value);
    if (d.length !== 8) return "";
    return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
  };

  const validarNome = (value: string) => {
    const partes = titleCaseName(value).trim().split(" ").filter(Boolean);
    if (partes.length < 2) setErroNome("Informe o nome completo (nome e sobrenome).");
    else setErroNome("");
  };

  const validarCelular = (value: string) => {
    if (onlyDigits(value).length < 11) setErroCelular("Informe um celular válido no formato (xx) xxxxx-xxxx.");
    else setErroCelular("");
  };

  const validarEmail = (value: string) => {
    if (!/@.+\..+/.test(value)) setErroEmail("Informe um e-mail válido (ex: nome@email.com).");
    else setErroEmail("");
  };

  const validarCpfBlur = (value: string) => {
    if (!validarCPF(onlyDigits(value))) setErroCpf("CPF inválido. Verifique e tente novamente.");
    else setErroCpf("");
  };

  const validarDataNasc = (value: string) => {
    const d = onlyDigits(value);
    if (d.length !== 8) { setErroDataNasc("Informe a data no formato dd/mm/aaaa."); return; }
    const dia = Number(d.slice(0, 2));
    const mes = Number(d.slice(2, 4));
    const ano = Number(d.slice(4, 8));
    const dt = new Date(ano, mes - 1, dia);
    if (dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia || dt > new Date()) {
      setErroDataNasc("Data de nascimento inválida.");
    } else {
      setErroDataNasc("");
    }
  };

  const PREP_MINUSCULA = new Set(["da", "de", "do", "das", "dos", "e", "a", "o", "as", "os"]);

  const titleCaseName = (value: string) => {
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
  };

  // -----------------------------
  // Validações
  // -----------------------------
  const criterios = {
    tamanho: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    especial: /[!@#$%*]/.test(senha),
  };
  const senhaValida = criterios.tamanho && criterios.maiuscula && criterios.especial;

  const todosCamposPreenchidos =
    nome.trim() !== "" &&
    nomeMae.trim() !== "" &&
    onlyDigits(cpf).length === 11 &&
    onlyDigits(celular).length >= 10 &&
    email.trim() !== "" &&
    onlyDigits(dataNasc).length === 8 &&
    genero !== "" &&
    senha !== "" &&
    confirmSenha !== "" &&
    confirmSenha === senha;

  const podeSubmeter = todosCamposPreenchidos && senhaValida;

  const validarCPF = (cpfDigits: string) => {
    if (cpfDigits.length !== 11 || /^(\d)\1+$/.test(cpfDigits)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += +cpfDigits[i] * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== +cpfDigits[9]) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += +cpfDigits[i] * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    return resto === +cpfDigits[10];
  };

  // -----------------------------
  // Submit — valida e vai para Termos
  // -----------------------------
  const handleSignup = () => {
    const nomeFinal = titleCaseName(nome);
    const cpfDigits = onlyDigits(cpf);
    const celularDigits = onlyDigits(celular);

    if (
      !nomeFinal ||
      !cpfDigits ||
      !celularDigits ||
      !email ||
      !senha ||
      !confirmSenha
    ) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (senha !== confirmSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (!validarCPF(cpfDigits)) {
      Alert.alert("CPF inválido", "Digite um CPF válido.");
      return;
    }

    if (!senhaValida) {
      Alert.alert(
        "Senha inválida",
        "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial."
      );
      return;
    }

    navigation.navigate("Terms", {
      nome: nomeFinal,
      nome_da_mae: titleCaseName(nomeMae),
      cpf: cpfDigits,
      celular: celularDigits,
      email,
      senha,
      data_nascimento: dataNascParaISO(dataNasc),
      genero,
    });
  };

  return (
    <ScrollView contentContainerStyle={style.container} keyboardShouldPersistTaps="handled">
      <Text style={style.title}>Criar Conta</Text>

      <TextInput
        style={[style.input, erroNome ? style.inputErro : null]}
        placeholder="Nome completo"
        value={nome}
        onChangeText={(t) => { setNome(normalizeSpaces(t)); setErroNome(""); }}
        onBlur={() => { const n = titleCaseName(nome); setNome(n); validarNome(n); }}
      />
      {erroNome ? <Text style={style.erroTexto}>{erroNome}</Text> : null}

      <TextInput
        style={style.input}
        placeholder="Nome da mãe"
        value={nomeMae}
        onChangeText={(t) => setNomeMae(normalizeSpaces(t))}
        onBlur={() => setNomeMae(titleCaseName(nomeMae))}
      />

      <TextInput
        style={[style.input, erroDataNasc ? style.inputErro : null]}
        placeholder="Data de nascimento (dd/mm/aaaa)"
        keyboardType="number-pad"
        value={dataNasc}
        onChangeText={(t) => { setDataNasc(formatDataNasc(t)); setErroDataNasc(""); }}
        onBlur={() => validarDataNasc(dataNasc)}
      />
      {erroDataNasc ? <Text style={style.erroTexto}>{erroDataNasc}</Text> : null}

      <View style={style.generoSecao}>
        <Text style={style.generoTitulo}>Gênero</Text>
        <View style={style.generoRow}>
          {(["Masculino", "Feminino", "Outros"] as const).map((op) => (
            <TouchableOpacity
              key={op}
              style={[style.generoBtn, genero === op && style.generoBtnAtivo]}
              onPress={() => setGenero(op)}
            >
              <Text style={[style.generoBtnTexto, genero === op && style.generoBtnTextoAtivo]}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={[style.input, erroCpf ? style.inputErro : null]}
        placeholder="CPF"
        keyboardType="number-pad"
        value={cpf}
        onChangeText={(t) => { setCpf(formatCPF(t)); setErroCpf(""); }}
        onBlur={() => validarCpfBlur(cpf)}
      />
      {erroCpf ? <Text style={style.erroTexto}>{erroCpf}</Text> : null}

      <TextInput
        style={[style.input, erroCelular ? style.inputErro : null]}
        placeholder="Celular"
        keyboardType="phone-pad"
        value={celular}
        onChangeText={(t) => { setCelular(formatPhoneBR(t)); setErroCelular(""); }}
        onBlur={() => validarCelular(celular)}
      />
      {erroCelular ? <Text style={style.erroTexto}>{erroCelular}</Text> : null}

      <TextInput
        style={[style.input, erroEmail ? style.inputErro : null]}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={(t) => { setEmail(t); setErroEmail(""); }}
        onBlur={() => validarEmail(email)}
      />
      {erroEmail ? <Text style={style.erroTexto}>{erroEmail}</Text> : null}

      <TextInput
        style={style.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
      />

      <TextInput
        style={style.input}
        placeholder="Confirmar senha"
        value={confirmSenha}
        onChangeText={setConfirmSenha}
      />

      <View style={style.criteriosContainer}>
        <Text style={style.criteriosTitulo}>A senha deve conter:</Text>
        <View style={style.criterioRow}>
          <Text style={[style.criterioIcon, criterios.tamanho && style.criterioOk]}>●</Text>
          <Text style={[style.criterioTexto, criterios.tamanho && style.criterioOk]}>No mínimo 8 caracteres</Text>
        </View>
        <View style={style.criterioRow}>
          <Text style={[style.criterioIcon, criterios.maiuscula && style.criterioOk]}>●</Text>
          <Text style={[style.criterioTexto, criterios.maiuscula && style.criterioOk]}>No mínimo 1 letra maiúscula</Text>
        </View>
        <View style={style.criterioRow}>
          <Text style={[style.criterioIcon, criterios.especial && style.criterioOk]}>●</Text>
          <Text style={[style.criterioTexto, criterios.especial && style.criterioOk]}>No mínimo 1 caractere especial (! @ # $ % *)</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[style.button, !podeSubmeter && style.buttonDisabled]}
        onPress={handleSignup}
        disabled={!podeSubmeter}
      >
        <Text style={style.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 16 }}>
        <Text style={style.linkText}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
