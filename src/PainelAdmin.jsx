// src/PainelAdmin.jsx
import React, { useState, useEffect } from "react";
import logo from "./assets/logo-webbuses.png";
import fundo from "./assets/bg-whatsapp.png";
import { API_URL } from "./config";

function PainelAdmin() {
  const [anunciantes, setAnunciantes] = useState([]);

  // 🔄 Carregar anúncios agrupados por anunciante
  const carregarAnuncios = async () => {
    try {
      const resposta = await fetch(`${API_URL}/anuncios`);
      const dados = await resposta.json();

      // ✅ Garante que temos um array
      const lista = Array.isArray(dados.anuncios) ? dados.anuncios : [];

      const agrupados = {};
      lista.forEach((anuncio) => {
        const telefoneBruto =
          anuncio.telefoneBruto || (anuncio.telefone ? anuncio.telefone.replace(/\D/g, "") : "");
        const chave = telefoneBruto || anuncio.email || anuncio.nomeAnunciante || anuncio.anunciante;

        if (!agrupados[chave]) {
          agrupados[chave] = {
            id: chave,
            nome: anuncio.nomeAnunciante || "-",
            telefone: telefoneBruto || "-",
            email: anuncio.email || "-",
            cidade: anuncio.localizacao?.cidade || "-",
            estado: anuncio.localizacao?.estado || "-",
            dataCadastro: anuncio.dataCadastro || new Date().toLocaleDateString("pt-BR"),
            anuncios: []
          };
        }

        agrupados[chave].anuncios.push(anuncio);
      });

      setAnunciantes(Object.values(agrupados));
    } catch (erro) {
      console.error("Erro ao buscar anúncios:", erro);
    }
  };

  useEffect(() => {
    carregarAnuncios();
  }, []);

  const atualizarStatusAnuncio = async (anuncianteId, anuncioId, novoStatus) => {
    try {
      await fetch(`${API_URL}/anuncios/${anuncioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });

      await carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  };

  const excluirAnuncio = async (anuncianteId, anuncioId) => {
    if (!anuncioId) {
      alert("❌ ID do anúncio inválido.");
      return;
    }

    const confirmar = window.confirm("Deseja realmente excluir este anúncio?");
    if (!confirmar) return;

    try {
      const resposta = await fetch(`${API_URL}/anuncios/${anuncioId}`, { method: "DELETE" });

      if (resposta.ok) {
        await carregarAnuncios();
        alert("✅ Anúncio excluído com sucesso.");
      } else {
        const erro = await resposta.json();
        alert("❌ Erro ao excluir anúncio: " + (erro?.mensagem || "Erro desconhecido."));
      }
    } catch (erro) {
      console.error("Erro ao excluir anúncio:", erro);
      alert("❌ Erro ao conectar ao servidor.");
    }
  };

  const excluirAnunciante = async (anuncianteId) => {
    const confirmar = window.confirm("⚠️ Isso irá excluir TODOS os anúncios deste anunciante. Deseja continuar?");
    if (!confirmar) return;

    try {
      const anunciante = anunciantes.find((a) => a.id === anuncianteId);
      if (anunciante) {
        for (const anuncio of anunciante.anuncios) {
          const id = anuncio._id || anuncio.id;
          if (id) {
            await fetch(`${API_URL}/anuncios/${id}`, { method: "DELETE" });
          }
        }
      }
      await carregarAnuncios();
      alert("✅ Anunciante e todos os seus anúncios foram excluídos.");
    } catch (erro) {
      console.error("Erro ao excluir anunciante:", erro);
      alert("❌ Erro ao excluir anunciante.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logado");
    window.location.href = "/login-admin";
  };

  return (
    <div style={{ ...styles.container, backgroundImage: `url(${fundo})` }}>
      <div style={styles.topo}>
        <img src={logo} alt="Web Buses" style={styles.logo} />
        <button onClick={handleLogout} style={styles.logout}>Sair</button>
      </div>
      <h1 style={styles.titulo}>Bem-vindo, Admin</h1>

      {anunciantes.map((anunciante) => (
        <div key={anunciante.id} style={styles.cardAnunciante}>
          <h2 style={styles.nomeAnunciante}>{anunciante.nome}</h2>
          <p><strong>Email:</strong> {anunciante.email}</p>
          <p><strong>Telefone:</strong> {anunciante.telefone}</p>
          <p><strong>Localização:</strong> {anunciante.cidade} - {anunciante.estado}</p>
          <p><strong>Data de Cadastro:</strong> {anunciante.dataCadastro}</p>

          <h3 style={styles.subtitulo}>Anúncios enviados:</h3>
          {anunciante.anuncios.map((anuncio) => (
            <div key={anuncio._id} style={styles.cardAnuncio}>
              <div style={styles.galeria}>
                {(anuncio.imagens || []).map((img, index) => (
                  <img key={index} src={img} alt={`Foto ${index + 1}`} style={styles.imagemMiniatura} />
                ))}
              </div>
              <div style={styles.infoAnuncio}>
                <p><strong>Modelo:</strong> {anuncio.modeloCarroceria}</p>
                <p><strong>Valor:</strong> {anuncio.valor}</p>
                <p><strong>Status:</strong> {anuncio.status}</p>
                {anuncio.status === "pendente" || anuncio.status === "aguardando pagamento" ? (
                  <div style={styles.botoes}>
                    <button onClick={() => atualizarStatusAnuncio(anunciante.id, anuncio._id, "aprovado")} style={styles.botaoAprovar}>Aprovar</button>
                    <button onClick={() => atualizarStatusAnuncio(anunciante.id, anuncio._id, "rejeitado")} style={styles.botaoRejeitar}>Rejeitar</button>
                    <button onClick={() => excluirAnuncio(anunciante.id, anuncio._id)} style={styles.botaoExcluir}>Excluir</button>
                  </div>
                ) : anuncio.status === "aguardando venda" ? (
                  <div style={styles.botoes}>
                    <p style={{ fontWeight: "bold", color: "#ffc107" }}>🚧 Aguardando Confirmação de Venda</p>
                    <button onClick={() => atualizarStatusAnuncio(anunciante.id, anuncio._id, "vendido")} style={styles.botaoRejeitar}>Confirmar Venda</button>
                    <button onClick={() => excluirAnuncio(anunciante.id, anuncio._id)} style={styles.botaoExcluir}>Excluir</button>
                  </div>
                ) : (
                  <>
                    <p style={
                      anuncio.status === "aprovado" ? styles.statusVerde :
                      anuncio.status === "vendido" ? { color: "#00e0ff", fontWeight: "bold" } :
                      styles.statusVermelho
                    }>
                      {anuncio.status === "aprovado" ? "✅ Aprovado" :
                       anuncio.status === "vendido" ? "✔️ Vendido" :
                       "❌ Rejeitado"}
                    </p>
                    <button onClick={() => excluirAnuncio(anunciante.id, anuncio._id)} style={styles.botaoExcluir}>Excluir</button>
                  </>
                )}
              </div>
            </div>
          ))}

          <button onClick={() => excluirAnunciante(anunciante.id)} style={{ ...styles.botaoExcluir, marginTop: 20 }}>
            ❌ Excluir Anunciante
          </button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    backgroundSize: "300px",
    backgroundRepeat: "repeat",
    minHeight: "100vh",
    color: "#fff"
  },
  topo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#88fe03",
    padding: "12px 24px",
    borderRadius: 8,
    boxShadow: "0 0 8px rgba(0,0,0,0.3)"
  },
  logo: { height: 60 },
  logout: {
    backgroundColor: "#f00",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer"
  },
  titulo: { fontSize: 28, margin: "24px 0" },
  cardAnunciante: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    boxShadow: "0 0 8px rgba(0,0,0,0.4)"
  },
  nomeAnunciante: {
    fontSize: 22,
    marginBottom: 8,
    color: "#88fe03"
  },
  subtitulo: {
    marginTop: 16,
    fontSize: 18,
    color: "#fff"
  },
  cardAnuncio: {
    display: "flex",
    flexWrap: "wrap",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  galeria: { display: "flex", gap: 8, flexWrap: "wrap" },
  imagemMiniatura: {
    width: 100,
    height: 80,
    objectFit: "cover",
    borderRadius: 6
  },
  infoAnuncio: { flex: 1, marginLeft: 16 },
  botoes: { display: "flex", gap: 8, marginTop: 12 },
  botaoAprovar: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  botaoRejeitar: {
    backgroundColor: "#ffc107",
    color: "#000",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  botaoExcluir: {
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  statusVerde: {
    color: "#88fe03",
    fontWeight: "bold",
    marginTop: 10
  },
  statusVermelho: {
    color: "#f00",
    fontWeight: "bold",
    marginTop: 10
  }
};

export default PainelAdmin;
