import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "./config";

function EditarAnuncio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState(null);

  useEffect(() => {
    const carregarAnuncio = async () => {
      try {
        const resposta = await fetch(`${API_URL}/anuncios/${id}`);
        if (!resposta.ok) throw new Error("Anúncio não encontrado.");

        const anuncio = await resposta.json();
        setFormulario(anuncio);
      } catch (erro) {
        alert("❌ Anúncio não encontrado ou erro de conexão.");
        navigate("/meus-anuncios");
      }
    };

    carregarAnuncio();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocalizacaoChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      localizacao: {
        ...prev.localizacao,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const resposta = await fetch(`${API_URL}/anuncios/${id}`, {
        method: "PUT", // ✅ usa PUT agora
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulario,
          status: "pendente", // volta para análise
          dataEnvio: new Date().toISOString(),
        }),
      });

      if (resposta.ok) {
        alert("✅ Anúncio atualizado com sucesso. Enviado para nova análise.");
        navigate("/meus-anuncios");
      } else {
        alert("❌ Falha ao atualizar o anúncio.");
      }
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      alert("❌ Erro de conexão.");
    }
  };

  if (!formulario) return null;

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
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "15px",
              resize: "vertical",
            }}
          />

          <p style={{ marginTop: "20px", color: "#999" }}>
            ⚠️ As fotos não podem ser alteradas nesta edição. Se quiser mudar imagens, crie um novo anúncio.
          </p>

          <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
            <button type="submit" style={{ backgroundColor: "#88fe03", color: "#0B1021", fontWeight: "bold", padding: "10px 16px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Salvar Alterações
            </button>
            <button type="button" onClick={() => navigate("/meus-anuncios")} style={{ backgroundColor: "#ccc", color: "#0B1021", fontWeight: "bold", padding: "10px 16px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarAnuncio;
