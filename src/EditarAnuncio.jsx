// src/EditarAnuncio.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "./config";

function toDigits(v) {
  return String(v || "").replace(/\D/g, "");
}
function parseNumberMaybe(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const limpo = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : v; // se não der parse, devolve original
  }
  return v;
}

export default function EditarAnuncio() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      try {
        const r = await fetch(`${API_URL}/anuncios/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!r.ok) throw new Error("Anúncio não encontrado.");
        const full = await r.json();

        // pode vir direto ou dentro de { data }
        const a = (full && full._id && full) || (full?.data && full.data._id && full.data) || full;

        // ⚠️ mapeia só os campos editáveis (NÃO traz imagens/Cloudinary)
        setFormulario({
          fabricanteCarroceria: a.fabricanteCarroceria || "",
          modeloCarroceria: a.modeloCarroceria || "",
          fabricanteChassis: a.fabricanteChassis || "",
          modeloChassis: a.modeloChassis || "",
          kilometragem: a.kilometragem ?? a.kilometragemAtual ?? "",
          lugares: a.lugares ?? a.quantidadeLugares ?? "",
          cor: a.cor || "",
          anoModelo: a.anoModelo || "",
          valor: a.valor ?? "",
          descricao: a.descricao || "",
          nomeAnunciante: a.nomeAnunciante || "",
          telefoneBruto: a.telefoneBruto || a.telefone || "",
          email: a.email || "",
          localizacao: {
            cidade: a.localizacao?.cidade || "",
            estado: a.localizacao?.estado || "",
          },
          // status permanece controlado pelo admin; aqui só reenviamos para análise
        });
      } catch (e) {
        alert("❌ Anúncio não encontrado ou erro de conexão.");
        navigate("/meus-anuncios");
      } finally {
        setCarregando(false);
      }
    })();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((p) => ({ ...p, [name]: value }));
  };
  const handleLocalizacaoChange = (e) => {
    const { name, value } = e.target;
    setFormulario((p) => ({ ...p, localizacao: { ...(p?.localizacao || {}), [name]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formulario) return;

    setSalvando(true);
    try {
      // ✅ envia apenas campos seguros (sem imagens do Cloudinary)
      const payload = {
        fabricanteCarroceria: (formulario.fabricanteCarroceria || "").trim(),
        modeloCarroceria: (formulario.modeloCarroceria || "").trim(),
        fabricanteChassis: (formulario.fabricanteChassis || "").trim(),
        modeloChassis: (formulario.modeloChassis || "").trim(),
        kilometragem: parseNumberMaybe(formulario.kilometragem),
        lugares: parseNumberMaybe(formulario.lugares),
        cor: (formulario.cor || "").trim(),
        anoModelo: (formulario.anoModelo || "").trim(),
        valor: parseNumberMaybe(formulario.valor),
        descricao: formulario.descricao || "",
        nomeAnunciante: (formulario.nomeAnunciante || "").trim(),
        telefoneBruto: toDigits(formulario.telefoneBruto),
        email: String(formulario.email || "").toLowerCase().trim(),
        localizacao: {
          cidade: (formulario.localizacao?.cidade || "").trim(),
          estado: (formulario.localizacao?.estado || "").trim(),
        },
        // Se o seu fluxo exige nova análise ao editar:
        status: "pendente",
        dataEnvio: new Date().toISOString(),
      };

      const r = await fetch(`${API_URL}/anuncios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      alert("✅ Anúncio atualizado com sucesso. Enviado para nova análise.");
      navigate("/meus-anuncios");
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      alert("❌ Falha ao atualizar o anúncio.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando || !formulario) return <div className="login-page"><div className="login-box">Carregando…</div></div>;

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth: "650px", textAlign: "left" }}>
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Editar Anúncio</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid-formulario">
            <input type="text" name="fabricanteCarroceria" value={formulario.fabricanteCarroceria} onChange={handleChange} placeholder="Fabricante da Carroceria" required />
            <input type="text" name="modeloCarroceria" value={formulario.modeloCarroceria} onChange={handleChange} placeholder="Modelo da Carroceria" required />
            <input type="text" name="fabricanteChassis" value={formulario.fabricanteChassis} onChange={handleChange} placeholder="Fabricante do Chassis" required />
            <input type="text" name="modeloChassis" value={formulario.modeloChassis} onChange={handleChange} placeholder="Modelo do Chassis" required />
            <input type="text" name="kilometragem" value={formulario.kilometragem} onChange={handleChange} placeholder="Kilometragem Atual" required />
            <input type="text" name="lugares" value={formulario.lugares} onChange={handleChange} placeholder="Quantidade de Lugares" required />
            <input type="text" name="cor" value={formulario.cor} onChange={handleChange} placeholder="Cor Predominante" required />
            <input type="text" name="anoModelo" value={formulario.anoModelo} onChange={handleChange} placeholder="Ano/Modelo" required />
            <input type="text" name="cidade" value={formulario.localizacao?.cidade || ""} onChange={handleLocalizacaoChange} placeholder="Cidade" required />
            <input type="text" name="estado" value={formulario.localizacao?.estado || ""} onChange={handleLocalizacaoChange} placeholder="Estado" required />
            <input type="text" name="valor" value={formulario.valor} onChange={handleChange} placeholder="Valor de Venda" required />
          </div>

          <textarea
            name="descricao"
            placeholder="Descrição do anúncio (máx. 5.000 caracteres)"
            rows="6"
            maxLength="5000"
            value={formulario.descricao}
            onChange={handleChange}
            style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 6, border: "1px solid #ccc", fontSize: 15, resize: "vertical" }}
          />

          <p style={{ marginTop: 20, color: "#999" }}>
            ⚠️ As fotos não podem ser alteradas nesta edição. Se quiser mudar imagens, crie um novo anúncio.
          </p>

          <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={salvando}
              style={{ backgroundColor: "#88fe03", color: "#0B1021", fontWeight: "bold", padding: "10px 16px", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              {salvando ? "Salvando…" : "Salvar Alterações"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/meus-anuncios")}
              style={{ backgroundColor: "#ccc", color: "#0B1021", fontWeight: "bold", padding: "10px 16px", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
