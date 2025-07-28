import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo-webbuses.png";

function PagamentoAnuncio() {
  const navigate = useNavigate();

  const LINK_PAGAMENTO = "https://pay.finaliza.shop/pl/65fb0987c6";
  const nomeAnunciante = localStorage.getItem("anunciante_nome") || "Anunciante";

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth: "600px" }}>
        <img src={logo} alt="Web Buses" style={{ width: 100, marginBottom: 20 }} />
        <h2>Anúncio salvo com sucesso! ✅</h2>

        <p style={{ marginTop: "20px", lineHeight: "1.6", color: "#222" }}>
          Olá <strong>{nomeAnunciante}</strong>, para que seu anúncio seja publicado na Web Buses, é necessário realizar o pagamento único de <strong style={{ color: "#0B1021" }}>R$49,90</strong>.
        </p>

        <p style={{ marginTop: "12px", lineHeight: "1.5", fontSize: "0.95rem", color: "#444" }}>
          Após o pagamento, nossa equipe irá revisar os dados do seu veículo e liberar o anúncio em até 24 horas úteis.
        </p>

        <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "6px", marginTop: "20px", border: "1px solid #ddd" }}>
          <p style={{ fontSize: "0.9rem", color: "#0B1021" }}>
            💡 <strong>Dica:</strong> Pague com Pix ou cartão para ativação mais rápida.
          </p>
        </div>

        <a
          href={LINK_PAGAMENTO}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "24px",
            backgroundColor: "#88fe03",
            color: "#0B1021",
            padding: "14px 24px",
            fontWeight: "bold",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          💳 Realizar Pagamento Agora
        </a>

        <button
          onClick={() => navigate("/painel-anunciante")}
          style={{
            marginTop: "16px",
            padding: "10px",
            backgroundColor: "#ccc",
            color: "#0B1021",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Voltar ao Painel
        </button>
      </div>
    </div>
  );
}

export default PagamentoAnuncio;
