import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getEventosPendentes,
  marcarEventoVisto,
  familiaAceitarConvite,
  aceitarConviteGuardiao,
  familiaRejeitarConvite,
  familiaRejeitarConviteGuardiao,
  type Evento,
} from "../services/api";
import { useAuth } from "./AuthContext";

export type { Evento };

type EventosContextType = {
  eventos: Evento[];
  carregando: boolean;
  dispensarEvento: (evento: Evento) => Promise<void>;
  aceitarEvento: (evento: Evento) => Promise<void>;
  rejeitarEvento: (evento: Evento) => Promise<void>;
};

const EventosContext = createContext<EventosContextType | undefined>(undefined);

export function EventosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const removerEvento = useCallback((id: number) => {
    setEventos((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => {
    if (!user?.id) { setEventos([]); return; }

    let cancelado = false;
    setCarregando(true);
    getEventosPendentes()
      .then((lista) => { if (!cancelado) setEventos(lista); })
      .catch(() => {})
      .finally(() => { if (!cancelado) setCarregando(false); });

    return () => { cancelado = true; };
  }, [user?.id]);

  const dispensarEvento = useCallback(async (evento: Evento) => {
    await marcarEventoVisto(evento.id).catch(() => {});
    removerEvento(evento.id);
  }, [removerEvento]);

  const aceitarEvento = useCallback(async (evento: Evento) => {
    const token = evento.payload?.token;
    if (!token) throw new Error("Token não encontrado no evento.");
    if (evento.acao === "convite_tutelado") {
      await familiaAceitarConvite(token);
    } else if (evento.acao === "convite_guardiao") {
      await aceitarConviteGuardiao(token);
    }
    removerEvento(evento.id);
  }, [removerEvento]);

  const rejeitarEvento = useCallback(async (evento: Evento) => {
    const token = evento.payload?.token;
    if (!token) throw new Error("Token não encontrado no evento.");
    if (evento.acao === "convite_tutelado") {
      await familiaRejeitarConvite(token);
    } else if (evento.acao === "convite_guardiao") {
      await familiaRejeitarConviteGuardiao(token);
    }
    removerEvento(evento.id);
  }, [removerEvento]);

  return (
    <EventosContext.Provider value={{ eventos, carregando, dispensarEvento, aceitarEvento, rejeitarEvento }}>
      {children}
    </EventosContext.Provider>
  );
}

export function useEventos() {
  const ctx = useContext(EventosContext);
  if (!ctx) throw new Error("useEventos deve ser usado dentro de EventosProvider");
  return ctx;
}
