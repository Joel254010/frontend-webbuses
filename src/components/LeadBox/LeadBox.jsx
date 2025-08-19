// src/LeadBox.jsx
import React, { useState } from "react";
import "./LeadBox.css";
import { API_URL } from "../../config";

export default function LeadBox() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [subOpcao, setSubOpcao] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const opcoes = [
    "Comprar para renovar minha frota",
    "Vender para renovar minha frota",
    "Financiamento",
    "Consórcio Carta Contemplada",
    "Consórcio Carta Programada",
    "Compra de Peças",
    "Socorro Ônibus Quebrado",
  ];

  const podeEnviar =
    nome.trim() &&
    (telefone.trim() || email.trim()) &&
    subOpcao &&
    detalhes.trim().length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!podeEnviar) return;

    setLoading(true);
    setMsg(null);

    try {
      const body = {
        nome,
        telefone,
        email,
        interesse: subOpcao,
        detalhes,
        origem: "webbuses-leadbox",
      };

      const resp = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error("Erro ao enviar lead");

      setMsg({
        tipo: "ok",
        texto: `Obrigado ${nome}! 🎉 Logo a equipe da WeBBuses ou um parceiro entrará em contato com você.`,
      });

      setNome("");
      setTelefone("");
      setEmail("");
      setSubOpcao("");
      setDetalhes("");
    } catch (err) {
      setMsg({ tipo: "erro", texto: "Falha ao enviar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="leadbox">
      <h2>O que você precisa? Conte com a <span>WeBBuses</span>!</h2>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nome Completo ou Empresa:</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Expresso Paulista"
          />
        </div>

        <div className="field">
          <label>Contato telefone (com DDD):</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="field">
          <label>Contato E-mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="field">
          <label
            className="menu-label"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            Como podemos te ajudar? {menuAberto ? "▲" : "▼"}
          </label>
          {menuAberto && (
            <ul className="submenu">
              {opcoes.map((opc) => (
                <li
                  key={opc}
                  className={subOpcao === opc ? "ativo" : ""}
                  onClick={() => {
                    setSubOpcao(opc);
                    setMenuAberto(false);
                  }}
                >
                  {opc}
                </li>
              ))}
            </ul>
          )}
          {subOpcao && (
            <div className="subescolhida">
              <strong>Selecionado:</strong> {subOpcao}
            </div>
          )}
        </div>

        <div className="field">
          <label>Detalhe mais sobre o que está precisando:</label>
          <textarea
            rows={6}
            maxLength={5000}
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            placeholder="Digite os detalhes aqui (até 5.000 caracteres)"
          />
        </div>

        {msg && (
          <div className={`alert ${msg.tipo}`}>
            {msg.texto}
          </div>
        )}

        <button type="submit" disabled={!podeEnviar || loading}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
