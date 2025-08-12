// src/MeusAnuncios.jsx (ou MeusAnuncios.js)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginAnunciante.css";
import { API_URL, API_BASE } from "./config";

/* ==== Helpers iguais aos usados no Admin/Home ==== */
function normalizeUrlMaybe(value) {
  if (typeof value !== "string") return "";
  let s = value.trim();
  if (!s) return "";
  // JSON stringificado? {"secure_url":"..."}
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      const o = JSON.parse(s);
      if (o?.secure_url) return o.secure_url;
      if (o?.url) return o.url;
    } catch {}
    return "";
  }
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  if (!s.includes("://")) return `${API_BASE}/${s}`; // caminho relativo
  return "";
}

function getCapa(anuncio) {
  const byPriority =
    normalizeUrlMaybe(anuncio?.fotoCapaThumb) ||
    normalizeUrlMaybe(anuncio?.fotoCapaUrl) ||
    normalizeUrlMaybe(anuncio?.capaUrl);
  if (byPriority) return byPriority;

  const arr = anuncio?.imagens || anuncio?.fotos || anuncio?.images;
  const img0 = Array.isArray(arr) ? arr[0] : null;
  if (typeof img0 === "string") return normalizeUrlMaybe(img0);
  if (img0?.secure_url) return img0.secure_url;
  if (img0?.url) return normalizeUrlMaybe(img0.url);
  if (img0?.path) return normalizeUrlMaybe(img0.path);
  return "";
}

function formatarBRL(n) {
  const v = typeof n === "number" ? n : Number(String(n).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";
}

/* ==== Componente ==== */
export default function MeusAnuncios() {
  const [anuncios, setAnuncios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("anunciante_logado")) || {};
    const telefoneBruto = String(dados.telefoneBruto || dados.telefone || "").replace(/\D/g, "");
    const email = String(dados.email || "").toLowerCase();

    const carregarMeusAnuncios = async () => {
      setCarregando(true);
      try {
        const r = await fetch(`${API_URL}/anuncios`, { headers: { Accept: "application/json" } });
        const data = await r.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.anuncios)
          ? data.anuncios
          : [];

        // normaliza + filtra por telefone/email do anunciante logado
        const meus = lista
          .map((a) => ({
            ...a,
            _id: a._id || a.id,
            capaUrl: getCapa(a),
          }))
          .filter((a) => {
            const tel = String(a.telefoneBruto || a.telefone || "").replace(/\D/g, "");
            const emailAnuncio = String(a.email || "").toLowerCase();
            return (telefoneBruto && tel === telefoneBruto) || (email && emailAnuncio === email);
          })
          // mantém somente estados visíveis ao anunciante
          .filter((a) =>
            ["aprovado", "vendido", "aguardando venda", "pendente_venda"].includes(String(a.status || "").toLowerCase())
          );

        setAnuncios(meus);
      } catch (erro) {
        console.error("Erro ao carregar anúncios:", erro);
        setAnuncios([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarMeusAnuncios();
  }, []);

  const handleEditar = (id) => navigate(`/editar-anuncio/${id}`);

  const handleVendido = async (id) => {
    const confirmar = window.confirm(
      "Deseja marcar este anúncio como vendido? Ele será enviado ao admin para confirmação."
    );
    if (!confirmar) return;

    try {
      // ✅ Alinha com o PainelAdmin: PUT /anuncios/:id/status
      const r = await fetch(`${API_URL}/anuncios/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: "aguardando venda" }), // mesmo rótulo do Admin
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      setAnuncios((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "aguardando venda" } : a))
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

        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>📋 Meus Anúncios</h2>

        {carregando ? (
          <p>Carregando…</p>
        ) : anuncios.length === 0 ? (
          <p>Nenhum anúncio encontrado para este anunciante.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {anuncios.map((anuncio) => {
              const id = anuncio._id || anuncio.id;
              const capa = anuncio.capaUrl || "";
              const km = anuncio.kilometragemAtual ?? anuncio.kilometragem ?? "-";
              const lugares = anuncio.quantidadeLugares ?? anuncio.lugares ?? "-";
              const status = String(anuncio.status || "").toLowerCase();

              return (
                <div
                  key={id}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "12px",
                    backgroundColor: "#fff",
                  }}
                >
                  {capa && (
                    <img
                      src={capa}
                      alt={anuncio.modeloCarroceria || "Ônibus"}
                      style={{
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        marginBottom: "10px",
                      }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}

                  <h4 style={{ marginBottom: "10px", color: "#0B1021" }}>
                    {(anuncio.fabricanteCarroceria || "").trim()} {(anuncio.modeloCarroceria || "").trim()}
                  </h4>

                  <p style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <strong>Preço:</strong> {formatarBRL(anuncio.valor)}
                  </p>
                  <p style={{ fontSize: "14px", marginBottom: "4px" }}>
                    <strong>Kilometragem:</strong> {km}
                  </p>
                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <strong>Lugares:</strong> {lugares}
                  </p>

                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                    <strong>Status:</strong>{" "}
                    {status === "vendido"
                      ? "✅ Vendido"
                      : status === "aguardando venda" || status === "pendente_venda"
                      ? "⏳ Aguardando Confirmação"
                      : "🟢 Aprovado"}
                  </p>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleEditar(id)}
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
                      onClick={() => handleVendido(id)}
                      disabled={status === "vendido" || status === "aguardando venda" || status === "pendente_venda"}
                      style={{
                        flex: 1,
                        backgroundColor:
                          status === "vendido" || status === "aguardando venda" || status === "pendente_venda"
                            ? "#bbb"
                            : "#f44336",
                        border: "none",
                        padding: "10px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        color: "white",
                        cursor:
                          status === "vendido" || status === "aguardando venda" || status === "pendente_venda"
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {status === "vendido"
                        ? "✅ Vendido"
                        : status === "aguardando venda" || status === "pendente_venda"
                        ? "⏳ Aguardando Confirmação"
                        : "✅ Marcar Vendido"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


