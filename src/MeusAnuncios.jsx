import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginAnunciante.css";
import { API_URL } from "./config";

function MeusAnuncios() {
  const [anuncios, setAnuncios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("anunciante_logado")) || {};
    const telefoneBruto = dados.telefoneBruto || "";
    const email = dados.email || "";

    const carregarMeusAnuncios = async () => {
      try {
        const resposta = await fetch(`${API_URL}/anuncios`);
        const todos = await resposta.json();

        const meus = todos.filter((anuncio) => {
          const tel = anuncio.telefoneBruto || anuncio.telefone?.replace(/\D/g, "");
          return (
            (telefoneBruto && tel === telefoneBruto) ||
            (email && anuncio.email === email)
          );
        });

        setAnuncios(
          meus.filter(
            (a) =>
              a.status === "aprovado" ||
              a.status === "vendido" ||
              a.status === "pendente_venda"
          )
        );
      } catch (erro) {
        console.error("Erro ao carregar anúncios:", erro);
      }
    };

    carregarMeusAnuncios();
  }, []);

  const handleEditar = (id) => {
    navigate(`/editar-anuncio/${id}`);
  };

  const handleVendido = async (id) => {
    const confirmar = window.confirm(
      "Deseja marcar este anúncio como vendido? Ele será enviado ao admin para confirmação."
    );
    if (!confirmar) return;

    try {
      await fetch(`${API_URL}/anuncios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pendente_venda" }),
      });

      setAnuncios((prev) =>
        prev.map((anuncio) =>
          anuncio._id === id ? { ...anuncio, status: "pendente_venda" } : anuncio
        )
      );

      alert("📩 Solicitação enviada. Aguarde a confirmação do administrador.");
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
      alert("Erro ao marcar como vendido.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth: "900px", textAlign: "left" }}>
        <button
          onClick={() => navigate("/painel-anunciante")}
          style={{
            marginBottom: "20px",
            padding: "10px 16px",
            backgroundColor: "#88fe03",
            color: "#0B1021",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🔙 Voltar ao Painel
        </button>

        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          📋 Meus Anúncios
        </h2>

        {anuncios.length === 0 ? (
          <p>Nenhum anúncio encontrado para este anunciante.</p>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
          >
            {anuncios.map((anuncio) => (
              <div
                key={anuncio._id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#fff",
                }}
              >
                <img
                  src={
                    anuncio.fotoCapaUrl ||
                    (anuncio.imagens?.length > 0 ? anuncio.imagens[0] : "")
                  }
                  alt={anuncio.modeloCarroceria}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                />
                <h4 style={{ marginBottom: "10px", color: "#0B1021" }}>
                  {anuncio.modeloCarroceria}
                </h4>

                <p style={{ fontSize: "14px", marginBottom: "4px" }}>
                  <strong>Kilometragem:</strong> {anuncio.kilometragemAtual || "-"}
                </p>
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>Lugares:</strong> {anuncio.quantidadeLugares || "-"}
                </p>

                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>Status:</strong>{" "}
                  {anuncio.status === "vendido"
                    ? "✅ Vendido"
                    : anuncio.status === "pendente_venda"
                    ? "⏳ Aguardando Confirmação"
                    : "🟢 Aprovado"}
                </p>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleEditar(anuncio._id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#88fe03",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      color: "#0B1021",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleVendido(anuncio._id)}
                    disabled={
                      anuncio.status === "vendido" ||
                      anuncio.status === "pendente_venda"
                    }
                    style={{
                      flex: 1,
                      backgroundColor:
                        anuncio.status === "vendido" || anuncio.status === "pendente_venda"
                          ? "#bbb"
                          : "#f44336",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      color: "white",
                      cursor:
                        anuncio.status === "vendido" || anuncio.status === "pendente_venda"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {anuncio.status === "vendido"
                      ? "✅ Vendido"
                      : anuncio.status === "pendente_venda"
                      ? "⏳ Aguardando Confirmação"
                      : "✅ Vendido"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeusAnuncios;

