import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useFamilia } from "./FamiliaContext";
import { getDadosCadastro, getPermissoesProprias } from "../services/api";

export type PermissoesUsuario = {
  podeCriarObjetivos: boolean;
  podeDepositar: boolean;
  podeSacar: boolean;
  podeAlterarPerfil: boolean;
  podeAlterarPix: boolean;
};

const ADULTO: PermissoesUsuario = {
  podeCriarObjetivos: true,
  podeDepositar: true,
  podeSacar: true,
  podeAlterarPerfil: true,
  podeAlterarPix: true,
};

const MENOR_PADRAO: PermissoesUsuario = {
  podeCriarObjetivos: true,
  podeDepositar: false,
  podeSacar: false,
  podeAlterarPerfil: false,
  podeAlterarPix: false,
};

type RestricaoContextType = {
  menorDeIdade: boolean;
  permissoes: PermissoesUsuario;
  recarregar: () => void;
};

const RestricaoContext = createContext<RestricaoContextType>({
  menorDeIdade: false,
  permissoes: ADULTO,
  recarregar: () => {},
});

export function RestricaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { atuandoComo } = useFamilia();

  const [menorDeIdade, setMenorDeIdade] = useState(false);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>(ADULTO);

  const carregar = useCallback(async (userId: number) => {
    try {
      const dados = await getDadosCadastro(userId);
      if (dados?.adulto === 0) {
        setMenorDeIdade(true);
        try {
          const perms = await getPermissoesProprias(userId);
          setPermissoes({
            podeCriarObjetivos: true,
            podeDepositar: perms?.pode_depositar ?? false,
            podeSacar: perms?.pode_sacar ?? false,
            podeAlterarPerfil: perms?.pode_alterar_perfil ?? false,
            podeAlterarPix: perms?.pode_alterar_pix ?? false,
          });
        } catch {
          setPermissoes(MENOR_PADRAO);
        }
      } else {
        setMenorDeIdade(false);
        setPermissoes(ADULTO);
      }
    } catch {
      setMenorDeIdade(false);
      setPermissoes(ADULTO);
    }
  }, []);

  useEffect(() => {
    if (!user?.id || atuandoComo !== null) {
      // Não logado ou guardião impersonando dependente → sem restrições
      setMenorDeIdade(false);
      setPermissoes(ADULTO);
      return;
    }
    carregar(user.id);
  }, [user?.id, atuandoComo, carregar]);

  const recarregar = useCallback(() => {
    if (user?.id && atuandoComo === null) carregar(user.id);
  }, [user?.id, atuandoComo, carregar]);

  return (
    <RestricaoContext.Provider value={{ menorDeIdade, permissoes, recarregar }}>
      {children}
    </RestricaoContext.Provider>
  );
}

export function useRestricao() {
  return useContext(RestricaoContext);
}
