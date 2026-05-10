import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { style } from "./styles";
import { criarConta, loginUser, familiaAceitarConvite } from "../../../services/api";

// -----------------------------------------------
// Conteúdo de cada termo
// -----------------------------------------------
const TEXTO_USO = `TERMOS DE USO – PURG

1. DISPOSIÇÕES GERAIS

1.1. Os presentes Termos de Uso ("Termos") regulam o acesso, a utilização e a relação jurídica estabelecida entre qualquer pessoa física ou jurídica ("Usuário") e a Purg, pessoa jurídica de direito privado.

1.2. Ao acessar, cadastrar-se ou interagir com os sistemas, aplicativos e funcionalidades disponibilizados ("Plataforma"), o Usuário declara ter lido, compreendido e aceitado integralmente estes Termos de forma livre e expressa.

1.3. Caso o Usuário não concorde com qualquer disposição aqui estabelecida, deverá abster-se imediatamente de utilizar a Plataforma.


2. NATUREZA DOS SERVIÇOS

2.1. A Purg atua como uma empresa de tecnologia e gestão estratégica de ativos, oferecendo soluções de tokenização de direitos econômicos e automação de estratégias financeiras.

2.2. A Purg não é uma instituição financeira, corretora de valores ou seguradora. A Plataforma atua na estruturação tecnológica de ativos originados por parceiros regulamentados, realizando a gestão operacional dos fluxos para o Usuário.

2.3. Os serviços disponibilizados não constituem promessa de rentabilidade fixa ou eliminação de riscos, sendo o Usuário responsável por suas decisões após a análise do perfil de risco disponível.


3. MECÂNICA DE ATIVOS (PINS, VAGALUMES E EMBLEMAS)

3.1. Pins: Representam a menor fração de direitos econômicos estruturados pela Plataforma, com valor nominal fixo de R$ 0,01 (um centavo de real). O Pin confere ao Usuário o direito de receber a distribuição proporcional dos rendimentos gerados pelo ativo subjacente.

3.2. Vagalumes: Constituem um índice de expectativa de rendimento para ativos em período de carência ou pré-venda. O valor em "Vagalumes" é meramente escritural e não possui liquidez imediata, sendo convertido em saldo monetário real (R$) somente após o encerramento do ciclo de carência e efetivo recebimento do fluxo financeiro pela Purg.

3.3. Emblemas: São créditos de bonificação por fidelidade ou compensação por custo de oportunidade (saldo não alocado). Os Emblemas não são sacáveis e não possuem paridade monetária para resgate, podendo ser utilizados exclusivamente dentro da Plataforma para a aquisição de novos ativos.


4. GESTÃO AUTOMATIZADA (POPPY)

4.1. Poppy Basic: Versão de acesso padrão, limitada a ativos de perfis de risco conservadores definidos pela Purg, sem custo adicional de assinatura sobre o rendimento.

4.2. Poppy Pro: Versão avançada que permite exposição a maiores faixas de risco/retorno e automação de reinvestimento (juros compostos).

4.3. Taxa de Assinatura: O Usuário da versão Pro concorda com a retenção automática diária de um percentual (%) sobre o rendimento bruto gerado, a título de taxa de serviço pela gestão automatizada e tecnologia de reinvestimento.


5. PROGRAMA DE MITIGAÇÃO DE RISCOS (SINISTRO)

5.1. Natureza do Sinistro: Trata-se de um programa de proteção progressiva mantido por liberalidade da Purg para mitigar eventuais inadimplências dos ativos subjacentes aos Pins.

5.2. Limitação de Garantia: A cobertura do Sinistro não constitui um contrato de seguro (SUSEP), mas sim uma garantia limitada oferecida pela Purg, cujo percentual de proteção varia conforme o Rank do Usuário ou modalidade de assinatura ativa.

5.3. Critérios de Cobertura: Ativos classificados em faixas de baixo risco (Rating até BB) possuem proteção integral por padrão. Para Ratings superiores, a proteção segue a tabela de progressão de Rank e benefícios vigentes na data da ocorrência.


6. DEPÓSITOS E LIQUIDEZ

6.1. Depósitos via Pix: São realizados de maneira instantânea e os valores são integralmente alocados na carteira do Usuário para aquisição de ativos, sem gerar lucro direto imediato para a Purg.

6.2. Depósitos via Cartão de Crédito: Permitem contribuições regulares e automáticas. O Usuário reconhece que este mecanismo é uma forma de aporte e que o total depositado é destinado à compra de ativos designados pelo próprio Usuário ou pela Poppy.

6.3. Liquidez Diária: A Purg provê a conversão de compromissos financeiros de longo prazo em produtos com liquidez diária através de sua tecnologia de antecipação de fluxos. O Usuário declara ciência de que essa liquidez depende da disponibilidade sistêmica da Plataforma.


7. CADASTRO E SEGURANÇA

7.1. O Usuário compromete-se a fornecer informações verdadeiras e atualizadas, responsabilizando-se civil e criminalmente pela veracidade dos dados.

7.2. O acesso à conta é pessoal e intransferível, sendo o Usuário o único responsável por manter a confidencialidade de suas senhas e credenciais.

7.3. A Purg reserva-se o direito de suspender contas que apresentem indícios de fraude, lavagem de dinheiro ou violação das normas de compliance.


8. RISCOS E RESPONSABILIDADES

8.1. O Usuário reconhece que investimentos em ativos de crédito envolvem risco de mercado, risco de crédito e risco de liquidez.

8.2. A Purg não se responsabiliza por perdas decorrentes de decisões do próprio Usuário, atos de terceiros, falhas de conexão à internet ou eventos de força maior.

8.3. Em nenhuma hipótese a Purg será responsável por danos indiretos, lucros cessantes ou expectativas de ganho não realizadas.


9. ALTERAÇÕES E FORO

9.1. Estes Termos podem ser alterados a qualquer tempo para refletir novos produtos ou mudanças regulatórias. O uso continuado da Plataforma após a publicação das alterações implica aceitação dos novos termos.

9.2. Este documento é regido pelas leis da República Federativa do Brasil.

9.3. Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas deste instrumento.`;

const TEXTO_PRIVACIDADE = `POLÍTICA DE PRIVACIDADE – PURG

1. INTRODUÇÃO

1.1. A Purg está comprometida com a privacidade e proteção dos dados pessoais de seus Usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).

1.2. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as informações pessoais fornecidas pelo Usuário ao utilizar a Plataforma.


2. DADOS COLETADOS

2.1. Dados de cadastro: nome completo, CPF, e-mail, número de celular e senha (criptografada).

2.2. Dados de uso: histórico de transações, preferências de investimento, logs de acesso e interações com a Plataforma.

2.3. Dados de dispositivo: modelo do aparelho, sistema operacional, identificadores de dispositivo e endereço IP.


3. FINALIDADE DO TRATAMENTO

3.1. Os dados são utilizados para: prestação dos serviços contratados, cumprimento de obrigações legais e regulatórias, prevenção a fraudes, comunicações sobre a conta e melhoria contínua da Plataforma.


4. COMPARTILHAMENTO DE DADOS

4.1. A Purg não vende dados pessoais a terceiros.

4.2. Poderemos compartilhar dados com parceiros regulamentados, autoridades competentes e prestadores de serviços essenciais à operação da Plataforma, sempre sob acordos de confidencialidade.


5. SEGURANÇA

5.1. Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, perda ou destruição.

5.2. Em caso de incidente de segurança, notificaremos os Usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD) nos prazos legais.


6. DIREITOS DO USUÁRIO

6.1. O Usuário pode solicitar a qualquer momento: acesso, correção, portabilidade, eliminação ou revogação do consentimento de seus dados, através dos canais de atendimento da Purg.


7. CONTATO

7.1. Dúvidas sobre esta Política podem ser enviadas ao nosso Encarregado de Dados (DPO) pelo e-mail: privacidade@purg.com.br`;

const TEXTO_RISCOS = `TERMOS DE RISCOS DA PLATAFORMA – PURG

1. DECLARAÇÃO DE CIÊNCIA

1.1. Ao utilizar a Plataforma, o Usuário declara ter plena ciência de que toda e qualquer operação envolvendo ativos financeiros está sujeita a riscos inerentes ao mercado.

1.2. Rentabilidades passadas não garantem resultados futuros.


2. TIPOS DE RISCO

2.1. Risco de Crédito: Possibilidade de inadimplência dos devedores dos ativos subjacentes aos Pins, resultando em perdas parciais ou totais do capital investido.

2.2. Risco de Mercado: Variações nas condições econômicas, taxas de juros e inflação que podem afetar negativamente o valor dos ativos.

2.3. Risco de Liquidez: Embora a Purg ofereça liquidez diária através de sua tecnologia, situações excepcionais de mercado podem temporariamente limitar a conversão de ativos em recursos financeiros.

2.4. Risco Operacional: Falhas em sistemas tecnológicos, processos internos ou eventos externos que possam afetar o funcionamento da Plataforma.

2.5. Risco Regulatório: Mudanças na legislação ou regulamentação aplicável que possam impactar as operações da Purg ou dos ativos disponíveis.


3. PERFIL DE INVESTIDOR

3.1. O Usuário é responsável por avaliar seu próprio perfil de risco antes de realizar qualquer investimento na Plataforma.

3.2. A Purg disponibiliza informações sobre o rating de risco de cada ativo para auxiliar nessa avaliação, mas não presta assessoria de investimentos individualizada.


4. PROGRAMA SINISTRO

4.1. O Programa Sinistro oferece proteção parcial contra inadimplência, conforme descrito nos Termos de Uso. Essa proteção é limitada e não elimina integralmente o risco de perda.

4.2. A cobertura máxima, os critérios de elegibilidade e os prazos de pagamento estão sujeitos às regras vigentes na data da ocorrência do sinistro.


5. LIMITAÇÃO DE RESPONSABILIDADE

5.1. A Purg não garante retornos mínimos nem se responsabiliza por perdas decorrentes de decisões de investimento do Usuário.

5.2. O Usuário investe por conta e risco próprios, tendo ciência integral dos riscos descritos neste documento.


6. RECOMENDAÇÃO

6.1. Recomendamos que o Usuário diversifique seus investimentos e não aplique na Plataforma recursos que não possa prescindir no curto prazo.`;

const TODOS_TERMOS = TEXTO_USO + "\n\n─────────────────────────────\n\n" + TEXTO_PRIVACIDADE + "\n\n─────────────────────────────\n\n" + TEXTO_RISCOS;

// -----------------------------------------------
// Componente principal
// -----------------------------------------------
export default function Terms({ navigation, route }: any) {
  const dadosCadastro = route?.params ?? {};
  const conviteToken: string = dadosCadastro.convite ?? "";
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const [acceptedUso, setAcceptedUso] = useState(false);
  const [acceptedPrivacidade, setAcceptedPrivacidade] = useState(false);
  const [acceptedRiscos, setAcceptedRiscos] = useState(false);

  const [modalTitulo, setModalTitulo] = useState("");
  const [modalTexto, setModalTexto] = useState("");
  const [modalVisivel, setModalVisivel] = useState(false);

  const allAccepted = acceptedUso && acceptedPrivacidade && acceptedRiscos;
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; tipo: "sucesso" | "erro" } | null>(null);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const chegouAoFinal =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (chegouAoFinal) setScrolledToBottom(true);
  };

  const abrirModal = (titulo: string, texto: string) => {
    setModalTitulo(titulo);
    setModalTexto(texto);
    setModalVisivel(true);
  };

  const handleConfirmar = async () => {
    const { nome, nome_da_mae, cpf, celular, email, senha, data_nascimento, genero, cep, logradouro, numero, bairro, cidade, estado } = dadosCadastro;

    if (!nome || !cpf || !celular || !email || !senha) {
      setFeedback({ msg: "Dados incompletos. Volte e preencha todos os campos.", tipo: "erro" });
      return;
    }

    let codigoRef: string | undefined;
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("purg_pending_ref") : null;
      if (stored) codigoRef = stored;
    } catch {}

    try {
      setEnviando(true);
      setFeedback(null);

      const result = await criarConta({
        nome_completo: nome,
        nome_da_mae,
        cpf,
        celular,
        email,
        senha,
        data_nascimento,
        genero,
        ...(codigoRef ? { codigo_ref: codigoRef } : {}),
        ...(cep ? { cep } : {}),
        ...(logradouro ? { logradouro } : {}),
        ...(numero ? { numero } : {}),
        ...(bairro ? { bairro } : {}),
        ...(cidade ? { cidade } : {}),
        ...(estado ? { estado } : {}),
        termos_de_uso: "1",
        termos_de_privacidade: "1",
        termos_de_riscos_da_plataforma: "1",
      });

      if (!result.success || !result.userId) {
        setFeedback({ msg: result.message || "Não foi possível criar a conta.", tipo: "erro" });
        return;
      }

      try { if (typeof window !== "undefined") window.localStorage.removeItem("purg_pending_ref"); } catch {}

      // Faz login automático para estabelecer sessão (necessário para criar o PIN)
      let loginOk = false;
      try { await loginUser(email, senha); loginOk = true; } catch {}

      // Aceita convite de responsável somente se o login estabeleceu sessão
      if (conviteToken && loginOk) {
        try { await familiaAceitarConvite(conviteToken); } catch {}
      }

      navigation.navigate("SetupPinCadastro", { userId: result.userId });
    } catch (e: any) {
      setFeedback({ msg: e?.message || "Não foi possível conectar ao servidor.", tipo: "erro" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Termos e Condições</Text>

      <Text style={style.instrucao}>
        Leia os termos abaixo na íntegra antes de prosseguir.
      </Text>

      <ScrollView
        style={style.scroll}
        contentContainerStyle={style.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <Text style={style.text}>{TODOS_TERMOS}</Text>
      </ScrollView>

      {scrolledToBottom && (
        <View style={style.acceptanceContainer}>
          <Text style={style.acceptanceTitle}>
            Confirme seu aceite para cada termo:
          </Text>

          {/* Termos de Uso */}
          <TouchableOpacity
            style={style.checkboxRow}
            onPress={() => setAcceptedUso((v) => !v)}
          >
            <Text style={style.checkbox}>{acceptedUso ? "☑️" : "⬜"}</Text>
            <Text style={style.plainText}>Aceitar os </Text>
            <TouchableOpacity
              onPress={() => abrirModal("Termos de Uso", TEXTO_USO)}
            >
              <Text style={style.termLink}>Termos de Uso</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Termos de Privacidade */}
          <TouchableOpacity
            style={style.checkboxRow}
            onPress={() => setAcceptedPrivacidade((v) => !v)}
          >
            <Text style={style.checkbox}>{acceptedPrivacidade ? "☑️" : "⬜"}</Text>
            <Text style={style.plainText}>Aceitar os </Text>
            <TouchableOpacity
              onPress={() =>
                abrirModal("Termos de Privacidade", TEXTO_PRIVACIDADE)
              }
            >
              <Text style={style.termLink}>Termos de Privacidade</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Termos de Riscos */}
          <TouchableOpacity
            style={style.checkboxRow}
            onPress={() => setAcceptedRiscos((v) => !v)}
          >
            <Text style={style.checkbox}>{acceptedRiscos ? "☑️" : "⬜"}</Text>
            <Text style={style.plainText}>Aceitar os </Text>
            <TouchableOpacity
              onPress={() =>
                abrirModal(
                  "Termos de Riscos da Plataforma",
                  TEXTO_RISCOS
                )
              }
            >
              <Text style={style.termLink}>
                Termos de Riscos da Plataforma
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {feedback && (
            <View style={[style.feedbackBox, feedback.tipo === "sucesso" ? style.feedbackSucesso : style.feedbackErro]}>
              <Text style={style.feedbackTexto}>{feedback.msg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[style.button, (!allAccepted || enviando) && { opacity: 0.5 }]}
            onPress={handleConfirmar}
            disabled={!allAccepted || enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <Text style={style.buttonText}>Confirmar cadastro</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={style.linkText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de detalhe de cada termo */}
      <Modal visible={modalVisivel} animationType="slide">
        <View style={style.modalContainer}>
          <Text style={style.modalTitle}>{modalTitulo}</Text>
          <ScrollView style={style.modalScroll}>
            <Text style={style.text}>{modalTexto}</Text>
          </ScrollView>
          <TouchableOpacity
            style={style.button}
            onPress={() => setModalVisivel(false)}
          >
            <Text style={style.buttonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
