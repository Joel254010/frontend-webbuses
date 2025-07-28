import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginAnunciante.css";
import logoWebBuses from "./assets/logo-webbuses.png";
import { API_URL } from "./config";

function CadastroAnunciante() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpfcnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState(""); // formato: "Cidade, Estado"
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      // 🔎 Separar cidade e estado
      const partesEndereco = endereco.split(",");
      const cidade = partesEndereco[0]?.trim() || "-";
      const estado = partesEndereco[1]?.trim() || "-";

      // 📞 Sanitizar telefone e montar link WhatsApp
      const telefoneBruto = telefone.replace(/\D/g, "");
      const whatsappLink = telefoneBruto ? `https://wa.me/55${telefoneBruto}` : "";

      const novoAnunciante = {
        nome,
        telefone,
        email,
        documento: cpfcnpj,
        endereco,
        senha,
        localizacao: { cidade, estado },
      };

      const resposta = await fetch(`${API_URL}/anunciantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAnunciante),
      });

      if (resposta.ok) {
        const dados = await resposta.json();

        // ✅ Salvar todos os dados do anunciante logado
        const anuncianteLogado = {
          nome,
          email,
          telefone,
          telefoneBruto,
          whatsappLink,
          cpfcnpj,
          cidade,
          estado,
          endereco,
        };

        localStorage.setItem("token_anunciante", dados.token || "token-simulado");
        localStorage.setItem("anunciante_logado", JSON.stringify(anuncianteLogado));

        alert("✅ Cadastro realizado com sucesso!");
        navigate("/painel-anunciante");
      } else {
        const erroApi = await resposta.json();
        setErro(erroApi?.mensagem || "Erro desconhecido.");
      }
    } catch (err) {
      console.error("Erro ao cadastrar anunciante:", err);
      setErro("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <img src={logoWebBuses} alt="Web Buses" className="login-logo" />
        <h2>Cadastro do Anunciante</h2>
        <form onSubmit={handleCadastro}>
          <input type="text" placeholder="Nome completo ou Empresa" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input type="tel" placeholder="Telefone que seja WhatsApp" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="text" placeholder="CPF ou CNPJ" value={cpfcnpj} onChange={(e) => setCpfCnpj(e.target.value)} required />
          <input type="text" placeholder="Sua Cidade" value={endereco} onChange={(e) => setEndereco(e.target.value)} required />

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

          <button type="submit">Cadastrar</button>
          {erro && <p className="erro">{erro}</p>}
        </form>

        <div className="links-auxiliares">
          <button className="link-texto" onClick={() => navigate("/login-anunciante")}>
            Já tem conta? Faça login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CadastroAnunciante;
