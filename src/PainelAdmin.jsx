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

      // ✅ Agrupar por anunciante
      const agrupados = {};
      dados.forEach((anuncio) => {
        const chave =
          anuncio.telefoneBruto ||
          anuncio.email ||
          anuncio.nomeAnunciante ||
          anuncio.anunciante;

        if (!agrupados[chave]) {
          agrupados[chave] = {
            id: chave,
            nome: anuncio.nomeAnunciante || "-",
            telefone: anuncio.telefoneBruto || "-",
            email: anuncio.email || "-",
            cidade: anuncio.localizacao?.cidade || "-",
            estado: anuncio.localizacao?.estado || "-",
            anuncios: [],
          };
        }
        agrupados[chave].anuncios.push(anuncio);
      });

      setAnunciantes(Object.values(agrupados));
    } catch (erro) {
      console.error("Erro ao carregar anúncios:", erro);
    }
  };

  useEffect(() => {
    carregarAnuncios();
  }, []);

  // ✅ Atualizar status
  const atualizarStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/anuncios/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  };

  // ❌ Excluir anúncio
  const excluirAnuncio = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este anúncio?")) return;
    try {
      await fetch(`${API_URL}/anuncios/${id}`, { method: "DELETE" });
      carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao excluir anúncio:", erro);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${fundo})`,
        backgroundSize: "300px",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <img src={logo} alt="Web Buses" style={{ maxWidth: "200px" }} />
      <h1>Painel do Administrador</h1>

      {anunciantes.map((anunciante) => (
        <div
          key={anunciante.id}
          style={{
            background: "#fff",
            padding: "15px",
            margin: "20px 0",
            borderRadius: "8px",
          }}
        >
          <h2>{anunciante.nome}</h2>
          <p>
            📧 {anunciante.email} | 📞 {anunciante.telefone}
          </p>
          <p>
            📍 {anunciante.cidade} - {anunciante.estado}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            {anunciante.anuncios.map((anuncio) => (
              <div
                key={anuncio._id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "10px",
                  background: "#f9f9f9",
                }}
              >
                <img
                  src={
                    anuncio.fotoCapa ||
                    anuncio.fotoCapaUrl ||
                    (anuncio.imagens?.length ? anuncio.imagens[0] : "/placeholder.jpg")
                  }
                  alt="Capa do anúncio"
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <h3>{anuncio.fabricanteCarroceria} {anuncio.modeloCarroceria}</h3>
                <p>💰 {Number(anuncio.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                <p>Status: {anuncio.status}</p>

                <button onClick={() => atualizarStatus(anuncio._id, "aprovado")}>
                  ✅ Aprovar
                </button>
                <button onClick={() => atualizarStatus(anuncio._id, "pendente")}>
                  ⏳ Pendente
                </button>
                <button onClick={() => atualizarStatus(anuncio._id, "rejeitado")}>
                  ❌ Rejeitar
                </button>
                <button onClick={() => excluirAnuncio(anuncio._id)}>
                  🗑 Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PainelAdmin;
