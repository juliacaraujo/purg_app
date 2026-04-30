import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  getFamiliaTutelados,
  familiaTrocarPerfil,
  familiaRetornarPerfil,
  familiaAceitarConvite,
} from "../services/api";
import { useAuth } from "./AuthContext";
import type { TuteladoItem } from "../types";

const STORAGE_GUARDIAO_ID    = "purg_guardiao_id";
const STORAGE_GUARDIAO_EMAIL = "purg_guardiao_email";
const STORAGE_ATUANDO_NOME   = "purg_atuando_como_nome";
const STORAGE_PENDING_INVITE = "purg_pending_invite";

// Memória em RAM como fallback para plataformas sem localStorage (native)
const memStorage: Record<string, string> = {};

const webStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage)
        return window.localStorage.getItem(key);
    } catch {}
    return memStorage[key] ?? null;
  },
  set: (key: string, value: string) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memStorage[key] = value;
  },
  remove: (key: string) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    delete memStorage[key];
  },
};

export type AtuandoComo = { id: number; nome: string };
type GuardiaoOriginal = { id: number; email?: string };

type FamiliaContextType = {
  tutelados: TuteladoItem[];
  atuandoComo: AtuandoComo | null;
  carregarTutelados: () => Promise<void>;
  trocarParaTutelado: (tuteladoId: number, tuteladoNome: string) => Promise<void>;
  retornarAoGuardiao: () => Promise<void>;
  temTutelados: boolean;
  salvarConvitePendente: (token: string) => void;
  convitePendenteResultado: "aceito" | "erro" | null;
  limparConvitePendenteResultado: () => void;
};

const FamiliaContext = createContext<FamiliaContextType | undefined>(undefined);

export function FamiliaProvider({ children }: { children: ReactNode }) {
  const { user, updateUser, logout } = useAuth();

  const [tutelados, setTutelados] = useState<TuteladoItem[]>([]);
  const [atuandoComo, setAtuandoComo] = useState<AtuandoComo | null>(null);
  const [guardiaoOriginal, setGuardiaoOriginal] = useState<GuardiaoOriginal | null>(null);
  const [convitePendenteResultado, setConvitePendenteResultado] = useState<"aceito" | "erro" | null>(null);

  // Rastreia por qual userId já fizemos o restore, evitando re-execução e
  // garantindo que funciona corretamente quando outro usuário faz login
  const restoredForUserRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id || restoredForUserRef.current === user.id) return;
    restoredForUserRef.current = user.id;

    const guardiaoId = webStorage.get(STORAGE_GUARDIAO_ID);
    const nome = webStorage.get(STORAGE_ATUANDO_NOME);
    if (guardiaoId && nome) {
      setAtuandoComo({ id: user.id, nome });
      setGuardiaoOriginal({ id: Number(guardiaoId), email: webStorage.get(STORAGE_GUARDIAO_EMAIL) ?? undefined });
      return;
    }

    // Aceita convite pendente salvo antes do login
    const pendingToken = webStorage.get(STORAGE_PENDING_INVITE);
    if (pendingToken) {
      familiaAceitarConvite(pendingToken)
        .then(() => {
          webStorage.remove(STORAGE_PENDING_INVITE);
          setConvitePendenteResultado("aceito");
        })
        .catch((e: any) => {
          // Token expirado ou inválido → descarta. Erro de rede (5xx) → mantém para próxima tentativa
          if (!e?.status || (e.status !== 500 && e.status !== 503)) {
            webStorage.remove(STORAGE_PENDING_INVITE);
          }
          setConvitePendenteResultado("erro");
        });
    }

    carregarTutelados();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarTutelados = useCallback(async () => {
    if (!user?.id) return;
    try {
      const lista = await getFamiliaTutelados();
      setTutelados(lista);
    } catch {
      setTutelados([]);
    }
  }, [user?.id]);

  const trocarParaTutelado = useCallback(async (tuteladoId: number, tuteladoNome: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const result = await familiaTrocarPerfil(tuteladoId);
    const novoId = result.tutelado.id;
    const nome = result.tutelado.nome || tuteladoNome;

    webStorage.set(STORAGE_GUARDIAO_ID, String(user.id));
    if (user.email) webStorage.set(STORAGE_GUARDIAO_EMAIL, user.email);
    webStorage.set(STORAGE_ATUANDO_NOME, nome);

    setGuardiaoOriginal({ id: user.id, email: user.email });
    setAtuandoComo({ id: novoId, nome });
    setTutelados([]);
    updateUser({ id: novoId });
  }, [user, updateUser]);

  const retornarAoGuardiao = useCallback(async () => {
    const original = guardiaoOriginal;
    try {
      await familiaRetornarPerfil();
    } catch (e: any) {
      webStorage.remove(STORAGE_GUARDIAO_ID);
      webStorage.remove(STORAGE_GUARDIAO_EMAIL);
      webStorage.remove(STORAGE_ATUANDO_NOME);
      setAtuandoComo(null);
      setGuardiaoOriginal(null);
      if (e?.status === 401) { logout(); return; }
      throw e;
    }

    webStorage.remove(STORAGE_GUARDIAO_ID);
    webStorage.remove(STORAGE_GUARDIAO_EMAIL);
    webStorage.remove(STORAGE_ATUANDO_NOME);
    setAtuandoComo(null);
    setGuardiaoOriginal(null);
    if (original) updateUser({ id: original.id, email: original.email });
    setTimeout(() => carregarTutelados(), 0);
  }, [guardiaoOriginal, updateUser, logout, carregarTutelados]);

  const salvarConvitePendente = useCallback((token: string) => {
    webStorage.set(STORAGE_PENDING_INVITE, token);
  }, []);

  const limparConvitePendenteResultado = useCallback(() => {
    setConvitePendenteResultado(null);
  }, []);

  return (
    <FamiliaContext.Provider value={{
      tutelados,
      atuandoComo,
      carregarTutelados,
      trocarParaTutelado,
      retornarAoGuardiao,
      temTutelados: tutelados.length > 0,
      salvarConvitePendente,
      convitePendenteResultado,
      limparConvitePendenteResultado,
    }}>
      {children}
    </FamiliaContext.Provider>
  );
}

export function useFamilia() {
  const ctx = useContext(FamiliaContext);
  if (!ctx) throw new Error("useFamilia deve ser usado dentro de FamiliaProvider");
  return ctx;
}
