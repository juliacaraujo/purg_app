import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { styles } from "./styles";

// ── Altere aqui a chave PIX da empresa ──
const CHAVE_PIX = "pix@purg.com.br";

const REGRAS = [
  "Realize a transferência PIX exatamente com o valor informado.",
  "Use o mesmo CPF cadastrado na sua conta Purg.",
  "Depósitos são processados em até 1 dia útil após confirmação.",
  "Valor mínimo de depósito: R$ 1,00.",
  "Em caso de dúvidas, entre em contato com nosso suporte.",
];

// Trunca para 2 casas decimais (vírgula)
const moneyFmt = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

export default function PixInfo({ route, navigation }: any) {
  const valor = route?.params?.valor ?? 0;
  const [copied, setCopied] = useState(false);

  const handleCopiar = async () => {
    await Clipboard.setStringAsync(CHAVE_PIX);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Como depositar</Text>
      <Text style={styles.subtitle}>
        Faça um PIX para a chave abaixo e seu saldo será creditado automaticamente.
      </Text>

      {/* Valor a depositar */}
      {valor > 0 && (
        <View style={styles.valorBox}>
          <Text style={styles.valorLabel}>Valor a depositar</Text>
          <Text style={styles.valorText}>{moneyFmt(valor)}</Text>
        </View>
      )}

      {/* Chave PIX + botão copiar */}
      <View style={styles.pixCard}>
        <Text style={styles.pixCardLabel}>Chave PIX</Text>
        <Text style={styles.pixChave}>{CHAVE_PIX}</Text>
        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copied]}
          onPress={handleCopiar}
        >
          <Text style={styles.copyBtnText}>
            {copied ? "Chave copiada!" : "Copiar chave PIX"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Como funciona */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Como funciona</Text>
        <Text style={styles.infoCardText}>
          Após copiar a chave PIX, abra o app do seu banco, escolha a opção PIX e cole a chave.
          Confirme o valor e finalize a transferência. Assim que o pagamento for identificado,
          seu saldo na Purg será atualizado automaticamente.
        </Text>
      </View>

      {/* Regras */}
      <Text style={styles.rulesTitle}>Regras de depósito</Text>
      {REGRAS.map((r, i) => (
        <View key={i} style={styles.ruleItem}>
          <View style={styles.ruleDot} />
          <Text style={styles.ruleText}>{r}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
