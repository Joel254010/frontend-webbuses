import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo-webbuses.png";
import fundo from "./assets/bg-whatsapp.png"; // ✅ Fundo importado corretamente

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  // Se já estiver logado, redireciona automaticamente
  useEffect(() => {
    if (localStorage.getItem("admin_logado") === "true") {
      navigate("/painel-admin");
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setErro("");

    const ADMIN_EMAIL = "admin@webbuses.com";
    const ADMIN_SENHA = "123456";

    if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
      localStorage.setItem("admin_logado", "true");
      navigate("/painel-admin");
    } else {
      setErro("E-mail ou senha incorretos.");
    }
  };

  return (
    <div style={{ ...styles.container, backgroundImage: `url(${fundo})` }}>
      <img src={logo} alt="Web Buses" style={styles.logo} />
      <h2 style={styles.titulo}>Login do Administrador</h2>
      <form onSubmit={handleLogin} style={styles.formulario}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={styles.input}
          required
        />
        {erro && <p style={styles.erro}>{erro}</p>}
        <button type="submit" style={styles.botao}>Entrar</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#0a0a0a",
    backgroundRepeat: "repeat",
    backgroundSize: "300px",
    minHeight: "100vh",
    fontFamily: "'Montserrat', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  logo: {
    width: 140,
    marginBottom: 24
  },
  titulo: {
    color: "#88fe03",
    fontSize: 24,
    marginBottom: 16
  },
  formulario: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: 360,
    gap: 14
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16
  },
  botao: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#88fe03",
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    border: "none",
    cursor: "pointer"
  },
  erro: {
    color: "red",
    fontSize: 14,
    marginTop: -10,
    textAlign: "center"
  }
};

export default AdminLogin;
