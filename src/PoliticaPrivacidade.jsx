// src/PoliticaPrivacidade.jsx
import React from "react";

export default function PoliticaPrivacidade() {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Política de Privacidade — WebBuses</h1>
        <p>
          Esta política explica como tratamos seus dados pessoais em conformidade com a
          Lei Geral de Proteção de Dados (LGPD – Lei 13.709/2018).
        </p>

        <h2 style={styles.h2}>1) Quem somos</h2>
        <p>
          A WebBuses é uma plataforma de anúncios de compra e venda de ônibus e utilitários.
          Contato: <a href="mailto:contato@webbuses.com">contato@webbuses.com</a>.
        </p>

        <h2 style={styles.h2}>2) Dados que coletamos</h2>
        <ul>
          <li>Identificação: nome/razão social.</li>
          <li>Contato: e-mail e telefone/WhatsApp.</li>
          <li>Interesse: categoria (ex.: comprar, vender, financiamento etc.).</li>
          <li>Detalhes do pedido e localização (cidade/UF).</li>
          <li>Metadados técnicos: IP e user-agent (segurança e auditoria).</li>
        </ul>

        <h2 style={styles.h2}>3) Finalidades</h2>
        <ul>
          <li>Conectar você com empresas parceiras homologadas do setor.</li>
          <li>Atender solicitações, suporte e comunicações relacionadas.</li>
          <li>Análises internas (desempenho, melhorias e prevenção a fraudes).</li>
        </ul>

        <h2 style={styles.h2}>4) Base legal</h2>
        <p>Consentimento (art. 7º, I, da LGPD). Você pode revogar a qualquer momento.</p>

        <h2 style={styles.h2}>5) Compartilhamento</h2>
        <p>
          Compartilhamos seus dados com <strong>parceiros homologados</strong> somente
          para atender sua solicitação (ex.: cotação de compra, venda, financiamento).
        </p>

        <h2 style={styles.h2}>6) Retenção</h2>
        <p>
          Mantemos os dados pelo tempo necessário ao atendimento e obrigações legais.
          Depois disso, realizamos anonimização ou exclusão segura.
        </p>

        <h2 style={styles.h2}>7) Direitos do titular</h2>
        <ul>
          <li>Acesso, correção, portabilidade e eliminação.</li>
          <li>Informações sobre uso e compartilhamento.</li>
          <li>Revogação do consentimento e oposição ao tratamento.</li>
        </ul>
        <p>
          Para exercer seus direitos:{" "}
          <a href="mailto:contato@webbuses.com">contato@webbuses.com</a>.
        </p>

        <h2 style={styles.h2}>8) Segurança</h2>
        <p>
          Adotamos medidas técnicas e administrativas proporcionais para proteger seus dados.
        </p>

        <h2 style={styles.h2}>9) Atualizações</h2>
        <p>Última atualização: {new Date().toLocaleDateString("pt-BR")}.</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: { background: "#0a0a0a", minHeight: "60vh", padding: "32px 16px" },
  card: {
    maxWidth: 960,
    margin: "0 auto",
    background: "#0b1021",
    color: "#e9f0ff",
    border: "1px solid #22283a",
    borderRadius: 16,
    padding: 24,
  },
  h1: { marginTop: 0, fontSize: 24, color: "#88fe03" },
  h2: { marginTop: 20, fontSize: 18, color: "#88fe03" },
};
