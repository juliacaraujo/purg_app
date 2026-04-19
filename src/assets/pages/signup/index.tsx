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
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { style } from "./styles";

export default function Signup({ navigation }) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const titleCaseName = (value: string) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (!clean) return "";

    const safe = clean.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ''\-\s]/g, "");

    return safe
      .split(" ")
      .filter(Boolean)
      .map(
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      )
      .join(" ");
  };

  // -----------------------------
  // Validações
  // -----------------------------
  const senhaValida = (value: string) =>
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[!@#$%*]/.test(value);

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

    if (!senhaValida(senha)) {
      Alert.alert(
        "Senha inválida",
        "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial."
      );
      return;
    }

    navigation.navigate("Terms", {
      nome: nomeFinal,
      cpf: cpfDigits,
      celular: celularDigits,
      email,
      senha,
    });
  };

  return (
    <ScrollView contentContainerStyle={style.container} keyboardShouldPersistTaps="handled">
      <Text style={style.title}>Criar Conta</Text>

      <TextInput
        style={style.input}
        placeholder="Nome completo"
        value={nome}
        onChangeText={(t) => setNome(normalizeSpaces(t))}
        onBlur={() => setNome(titleCaseName(nome))}
      />

      <TextInput
        style={style.input}
        placeholder="CPF"
        keyboardType="number-pad"
        value={cpf}
        onChangeText={(t) => setCpf(formatCPF(t))}
      />

      <TextInput
        style={style.input}
        placeholder="Celular"
        keyboardType="phone-pad"
        value={celular}
        onChangeText={(t) => setCelular(formatPhoneBR(t))}
      />

      <TextInput
        style={style.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={style.input}
        placeholder="Senha"
        secureTextEntry={!showPassword}
        value={senha}
        onChangeText={setSenha}
      />

      <TextInput
        style={style.input}
        placeholder="Confirmar senha"
        secureTextEntry={!showPassword}
        value={confirmSenha}
        onChangeText={setConfirmSenha}
      />

      <TouchableOpacity
        onPress={() => setShowPassword((v) => !v)}
        style={{ marginBottom: 8 }}
      >
        <Text style={style.linkText}>
          {showPassword ? "Ocultar senha" : "Mostrar senha"}
        </Text>
      </TouchableOpacity>

      <Text style={style.subtitle}>
        A senha deve conter no mínimo 8 caracteres, uma letra maiúscula e um
        caractere especial (! @ # $ % *).
      </Text>

      <TouchableOpacity style={style.button} onPress={handleSignup}>
        <Text style={style.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={style.linkText}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
