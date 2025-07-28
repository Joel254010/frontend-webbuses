import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginAnunciante.css";
import logoWebBuses from "./assets/logo-webbuses.png";
import { API_URL } from "./config";

function LoginAnunciante() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const resposta = await fetch(`${API_URL}/anunciantes/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (resposta.ok) {
        const dados = await resposta.json();

        const telefoneBruto = dados.telefone?.replace(/\D/g, "") || "";
        const whatsappLink = telefoneBruto ? `https://wa.me/55${telefoneBruto}` : "";
        const endereco = dados.endereco || "";
        const cidade = dados.localizacao?.cidade || "-";
        const estado = dados.localizacao?.estado || "-";

        const anuncianteLogado = {
          nome: dados.nome || "Anunciante",
          email: dados.email,
          telefone: dados.telefone || "",
          telefoneBruto,
          whatsappLink,
          cpfcnpj: dados.documento || "",
          endereco,
          cidade,
          estado,
        };

        localStorage.setItem("token_anunciante", dados.token || "token-simulado");
        localStorage.setItem("anunciante_logado", JSON.stringify(anuncianteLogado));

        alert("✅ Login realizado com sucesso!");
        navigate("/painel-anunciante");
      } else {
        const erroApi = await resposta.json();
        setErro(erroApi?.mensagem || "E-mail ou senha inválidos.");
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setErro("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        {/* 🔙 Botão voltar ao início */}
        <button
          onClick={() => navigate("/")}
          style={{
            marginBottom: "16px",
            padding: "8px 16px",
            backgroundColor: "#88fe03",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            color: "#0B1021",
          }}
        >
          🔙 Voltar aos Anúncios
        </button>

        <img src={logoWebBuses} alt="Web Buses" className="login-logo" />
        <h2>Login do Anunciante</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="E-mail cadastrado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="senha-container">
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <span
              className="olho-senha"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </span>
          </div>
          <button type="submit">Entrar</button>
          {erro && <p className="erro">{erro}</p>}
        </form>

        <div className="links-auxiliares">
          <button
            className="link-texto"
            onClick={() => alert("Função ainda não implementada")}
          >
            Esqueci minha senha
          </button>
          <button
            className="link-texto"
            onClick={() => navigate("/cadastro-anunciante")}
          >
            Ainda não tem conta? Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginAnunciante;
