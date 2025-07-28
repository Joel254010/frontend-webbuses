import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginAnunciante.css";
import logoWebBuses from "./assets/logo-webbuses.png";

function PainelAnunciante() {
  const navigate = useNavigate();
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [aviso, setAviso] = useState("");

  // 🔁 Recupera dados do anunciante logado
  const dados = JSON.parse(localStorage.getItem("anunciante_logado")) || {};
  const nome = dados.nome || "Anunciante";
  const telefone = dados.telefone || "";
  const email = dados.email || "";
  const whatsappLink = dados.whatsappLink || null;

  useEffect(() => {
    const aceite = localStorage.getItem("termosAceitos");
    if (aceite === "true") {
      setTermosAceitos(true);
      setMostrarTermos(false);
    } else {
      setTermosAceitos(false);
      setMostrarTermos(true);
    }
  }, []);

  const handleAceite = () => {
    localStorage.setItem("termosAceitos", "true");
    setTermosAceitos(true);
    setMostrarTermos(false);
    setAviso("");
  };

  const handleReexibirTermos = () => {
    localStorage.removeItem("termosAceitos");
    setTimeout(() => {
      navigate(0);
    }, 300);
  };

  const handleCadastrarOnibus = () => {
    if (!termosAceitos) {
      setAviso("⚠️ Para cadastrar um anúncio é obrigatório ler e aceitar os termos.");
      return;
    }
    navigate("/cadastrar-onibus");
  };

  const handleVerMeusAnuncios = () => {
    navigate("/meus-anuncios");
  };

  const handleLogout = () => {
    const confirmar = window.confirm("Tem certeza que deseja sair do painel?");
    if (confirmar) {
      localStorage.removeItem("token_anunciante");
      localStorage.removeItem("anunciante_logado");
      localStorage.removeItem("termosAceitos");
      navigate("/login-anunciante");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <img src={logoWebBuses} alt="Web Buses" className="login-logo" />
        <h2>Bem-vindo, {nome} 👋</h2>

        {whatsappLink && (
          <p style={{ color: "#222", marginTop: "-10px", fontSize: "0.95rem" }}>
            WhatsApp:{" "}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#222", fontWeight: "bold" }}
            >
              {telefone}
            </a>
          </p>
        )}

        {email && (
          <p style={{ color: "#222", marginTop: "-8px", fontSize: "0.95rem" }}>
            Email: <strong>{email}</strong>
          </p>
        )}

        <p style={{ color: "#222" }}>
          Aqui você poderá cadastrar, editar e visualizar seus anúncios de ônibus.
        </p>

        {mostrarTermos && (
          <div
            style={{
              backgroundColor: "#f0f0f0",
              color: "#222",
              padding: "20px",
              borderRadius: "10px",
              marginTop: "20px",
              textAlign: "left",
            }}
          >
            <h4>📄 Termos de Publicação de Anúncio</h4>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
              Ao prosseguir com a publicação de anúncios na plataforma <strong>WebBuses</strong>,
              o anunciante declara estar ciente e de acordo com as seguintes condições:
            </p>
            <ul style={{ paddingLeft: "20px", fontSize: "0.95rem", lineHeight: "1.6" }}>
              <li>Cada anúncio está sujeito a uma <strong>taxa única de R$49,90</strong>.</li>
              <li>O pagamento será via <strong>Pix</strong> ou <strong>Cartão de Crédito</strong>.</li>
              <li>O anúncio será <strong>analisado previamente</strong> e só será publicado após validação.</li>
              <li>A taxa é válida para <strong>exibição única</strong>, sem cobrança recorrente.</li>
            </ul>
            <p style={{ fontSize: "0.95rem", marginTop: "10px" }}>
              Ao clicar abaixo, o anunciante confirma que leu e concorda com os termos descritos.
            </p>
            <button
              onClick={handleAceite}
              style={{
                marginTop: "12px",
                padding: "10px",
                backgroundColor: "#88fe03",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Confirmo e aceito os termos
            </button>
          </div>
        )}

        <button
          onClick={handleCadastrarOnibus}
          disabled={!termosAceitos}
          style={{
            marginTop: "20px",
            backgroundColor: termosAceitos ? "#88fe03" : "#ccc",
            color: termosAceitos ? "#000" : "#666",
            padding: "12px",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            cursor: termosAceitos ? "pointer" : "not-allowed",
            opacity: termosAceitos ? 1 : 0.7,
          }}
        >
          Cadastrar Novo Ônibus
        </button>

        {!termosAceitos && (
          <p style={{ color: "red", fontSize: "0.9rem", marginTop: "8px" }}>
            ⚠️ É obrigatório aceitar os termos antes de cadastrar um ônibus.
          </p>
        )}

        {aviso && (
          <p style={{ color: "red", marginTop: "8px", fontSize: "0.9rem" }}>{aviso}</p>
        )}

        <button
          onClick={handleReexibirTermos}
          style={{
            marginTop: "12px",
            padding: "8px",
            backgroundColor: "#88fe03",
            color: "#444",
            border: "1px solid #ccc",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          🔄 Reexibir Termos (teste)
        </button>

        <button
          onClick={handleVerMeusAnuncios}
          style={{
            marginTop: "12px",
            padding: "10px",
            backgroundColor: "#88fe03",
            color: "#0B1021",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          📋 Meus Anúncios
        </button>

        <button
          onClick={handleLogout}
          style={{
            marginTop: "12px",
            padding: "10px",
            backgroundColor: "#ff4d4f",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🚪 Sair do Painel
        </button>
      </div>
    </div>
  );
}

export default PainelAnunciante;

