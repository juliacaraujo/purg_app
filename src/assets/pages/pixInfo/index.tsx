import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../../context/AuthContext";
import { getBuscarDepositosPendentes } from "../../../services/api";
import { styles } from "./styles";
import { useRefresh } from "../../../context/RefreshContext";

const moneyFmt = (v: any) => {
  const n = Math.trunc((Number(v) || 0) * 100) / 100;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function PixInfo({ route, navigation }: any) {
  const { user } = useAuth();
  const { triggerRefresh } = useRefresh();
  const {
    valor = 0,
    pix_copia_cola,
    expiracao_min = 60,
    expiracao_seconds,
  } = route?.params ?? {};

  const initialSeconds = expiracao_seconds != null ? expiracao_seconds : expiracao_min * 60;

  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"qrcode" | "confirmed" | "expired">("qrcode");
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!user?.id) return;

    let remaining = initialSeconds;
    let done = false;

    let timerId: ReturnType<typeof setInterval>;
    let pollId: ReturnType<typeof setInterval>;

    timerId = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0 && !done) {
        done = true;
        clearInterval(timerId);
        clearInterval(pollId);
        setStep("expired");
      }
    }, 1000);

    pollId = setInterval(async () => {
      if (done) return;
      try {
        const pendentes = await getBuscarDepositosPendentes(user.id);
        if (!Array.isArray(pendentes) || pendentes.length === 0) {
          done = true;
          clearInterval(timerId);
          clearInterval(pollId);
          triggerRefresh();
          setStep("confirmed");
        }
      } catch {}
    }, 5000);

    return () => {
      clearInterval(timerId);
      clearInterval(pollId);
    };
  }, [user?.id]);

  const handleCopiar = async () => {
    if (!pix_copia_cola) return;
    try {
      await Clipboard.setStringAsync(pix_copia_cola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert("Erro", "Não foi possível copiar o código.");
    }
  };

  if (step === "confirmed") {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.confirmedIcon}>✓</Text>
        <Text style={styles.confirmedTitle}>Pagamento confirmado!</Text>
        <Text style={styles.confirmedSubtitle}>
          Seu saldo foi creditado na conta Purg.
        </Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.actionBtnText}>Ver minha conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "expired") {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.expiredIcon}>⏱</Text>
        <Text style={styles.expiredTitle}>Código expirado</Text>
        <Text style={styles.expiredSubtitle}>
          O tempo para pagamento se encerrou. Solicite um novo depósito.
        </Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.actionBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Pagar com Pix</Text>

      {valor > 0 && (
        <View style={styles.valorBox}>
          <Text style={styles.valorLabel}>Valor a depositar</Text>
          <Text style={styles.valorText}>{moneyFmt(valor)}</Text>
        </View>
      )}

      <View style={styles.countdownRow}>
        <Text style={styles.countdownLabel}>Expira em</Text>
        <Text style={[styles.countdownValue, secondsLeft < 300 && styles.countdownUrgent]}>
          {fmtTime(secondsLeft)}
        </Text>
      </View>

      {pix_copia_cola ? (
        <View style={styles.pixCard}>
          <Text style={styles.pixCardLabel}>Pix Copia e Cola</Text>
          <Text style={styles.pixChave} numberOfLines={3}>
            {pix_copia_cola}
          </Text>
          <TouchableOpacity
            style={[styles.copyBtn, copied && styles.copied]}
            onPress={handleCopiar}
          >
            <Text style={styles.copyBtnText}>
              {copied ? "Copiado!" : "Copiar código"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.waitingRow}>
        <ActivityIndicator size="small" color="#888" />
        <Text style={styles.waitingText}>Aguardando confirmação do pagamento...</Text>
      </View>
    </ScrollView>
  );
}
