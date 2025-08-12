import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./FormularioCadastroVeiculo.css";
import { API_URL } from "./config";

function FormularioCadastroVeiculo() {
  const navigate = useNavigate();
  const { modelo } = useParams();

  const [formulario, setFormulario] = useState({
    nomeAnunciante: "",
    anunciante: "",
    email: "",
    telefone: "",
    telefoneBruto: "",
    fabricanteCarroceria: "",
    modeloCarroceria: "",
    fabricanteChassis: "",
    modeloChassis: "",
    kilometragem: "",
    lugares: "",
    cor: "",
    anoModelo: "",
    localizacao: { cidade: "", estado: "" },
    valor: "",
    descricao: "",
  });

  const [fotoCapa, setFotoCapa] = useState(null);
  const [galeriaFotos, setGaleriaFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("anunciante_logado")) || {};

    const telefoneBruto = dados.telefone?.replace(/\D/g, "") || "";
    const whatsappLink = telefoneBruto ? `https://wa.me/55${telefoneBruto}` : "";

    setFormulario((prev) => ({
      ...prev,
      nomeAnunciante: dados.nome || "",
      anunciante: whatsappLink,
      telefone: dados.telefone || "",
      telefoneBruto,
      email: dados.email || "",
      localizacao: {
        cidade: dados.cidade || "",
        estado: dados.estado || "",
      },
      dataCadastro: new Date().toLocaleDateString("pt-BR"),
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "cidade" || name === "estado") {
      setFormulario((prev) => ({
        ...prev,
        localizacao: { ...prev.localizacao, [name]: value },
      }));
    } else {
      setFormulario((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleValorChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (!raw) raw = "0";
    const valorFormatado = (parseInt(raw, 10) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    setFormulario((prev) => ({ ...prev, valor: valorFormatado }));
  };

  const handleCapaChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFotoCapa(file);
  };

  const removerFotoCapa = () => setFotoCapa(null);

  const handleGaleriaChange = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 9);
    setGaleriaFotos((prev) => [...prev, ...files].slice(0, 9));
  };

  const removerFotoGaleria = (index) => {
    setGaleriaFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.fabricanteCarroceria || !formulario.modeloCarroceria || !formulario.valor) {
      alert("⚠️ Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    // Pelo menos 1 imagem (capa ou galeria) — o backend exige
    if (!fotoCapa && galeriaFotos.length === 0) {
      alert("⚠️ Envie pelo menos uma imagem (capa ou galeria).");
      return;
    }

    // normaliza valor "R$ 150.000,00" -> 150000.00
    const valorLimpo = Number(
      formulario.valor.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")
    );

    // "Cidade, Estado" (o backend já sabe quebrar isso)
    const localizacaoStr = `${formulario.localizacao.cidade || ""}, ${formulario.localizacao.estado || ""}`.trim();

    // FormData (NÃO definir Content-Type manualmente)
    const fd = new FormData();

    // texto
    fd.append("nomeAnunciante", formulario.nomeAnunciante || "");
    fd.append("anunciante", formulario.anunciante || "");
    fd.append("email", formulario.email || "");
    fd.append("telefone", formulario.telefone || "");
    fd.append("telefoneBruto", formulario.telefoneBruto || "");
    fd.append("fabricanteCarroceria", formulario.fabricanteCarroceria || "");
    fd.append("modeloCarroceria", formulario.modeloCarroceria || "");
    fd.append("fabricanteChassis", formulario.fabricanteChassis || "");
    fd.append("modeloChassis", formulario.modeloChassis || "");
    fd.append("kilometragem", formulario.kilometragem || "");
    fd.append("lugares", formulario.lugares || "");
    fd.append("cor", formulario.cor || "");
    fd.append("anoModelo", formulario.anoModelo || "");
    fd.append("localizacao", localizacaoStr);
    fd.append("valor", String(isNaN(valorLimpo) ? "" : valorLimpo));
    fd.append("descricao", formulario.descricao || "");
    fd.append("tipoModelo", modelo || "");
    fd.append("status", "pendente");
    fd.append("dataEnvio", new Date().toISOString());

    // arquivos (nomes esperados pelo backend: "capa" e "imagens")
    if (fotoCapa) fd.append("capa", fotoCapa);
    galeriaFotos.forEach((f) => fd.append("imagens", f)); // múltiplos

    try {
      setEnviando(true);
      const resp = await fetch(`${API_URL}/anuncios`, {
        method: "POST",
        body: fd,
      });

      if (resp.ok) {
        alert("✅ Anúncio enviado com sucesso e aguardando aprovação!");
        navigate("/pagamento-anuncio");
      } else {
        const erro = await resp.json().catch(() => ({}));
        alert("❌ Erro ao enviar o anúncio: " + (erro?.mensagem || "Erro desconhecido."));
      }
    } catch (erro) {
      console.error("Erro ao enviar anúncio:", erro);
      alert("❌ Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="formulario-veiculo">
      <div className="formulario-box">
        <h2>Cadastro do Veículo</h2>

        <p style={{ marginBottom: "20px", color: "#0B1021" }}>
          <strong>Anunciante:</strong> {formulario.nomeAnunciante || "-"}<br />
          <strong>WhatsApp:</strong>{" "}
          {formulario.anunciante && formulario.telefone ? (
            <a href={formulario.anunciante} target="_blank" rel="noopener noreferrer">
              {formulario.telefone}
            </a>
          ) : (
            "-"
          )}
        </p>

        <form onSubmit={handleSubmit} className="formulario-grid" encType="multipart/form-data">
          <div>
            <label>Fabricante da Carroceria:</label>
            <input type="text" name="fabricanteCarroceria" value={formulario.fabricanteCarroceria} onChange={handleChange} required />
          </div>

          <div>
            <label>Modelo da Carroceria:</label>
            <input type="text" name="modeloCarroceria" value={formulario.modeloCarroceria} onChange={handleChange} required />
          </div>

          <div>
            <label>Fabricante do Chassis:</label>
            <input type="text" name="fabricanteChassis" value={formulario.fabricanteChassis} onChange={handleChange} />
          </div>

          <div>
            <label>Modelo do Chassis:</label>
            <input type="text" name="modeloChassis" value={formulario.modeloChassis} onChange={handleChange} />
          </div>

          <div>
            <label>Kilometragem:</label>
            <input type="text" name="kilometragem" value={formulario.kilometragem} onChange={handleChange} placeholder="Ex: 1.250.000,00" />
          </div>

          <div>
            <label>Quantidade de Lugares:</label>
            <input type="text" name="lugares" value={formulario.lugares} onChange={handleChange} placeholder="Ex: 48 poltronas leito" />
          </div>

          <div>
            <label>Cor Predominante:</label>
            <input type="text" name="cor" value={formulario.cor} onChange={handleChange} />
          </div>

          <div>
            <label>Ano/Modelo:</label>
            <input type="text" name="anoModelo" value={formulario.anoModelo} onChange={handleChange} />
          </div>

          <div>
            <label>Cidade:</label>
            <input type="text" name="cidade" value={formulario.localizacao.cidade} onChange={handleChange} />
          </div>

          <div>
            <label>Estado:</label>
            <input type="text" name="estado" value={formulario.localizacao.estado} onChange={handleChange} />
          </div>

          <div>
            <label>Valor de Venda:</label>
            <input type="text" name="valor" value={formulario.valor} onChange={handleValorChange} placeholder="Ex: R$ 150.000,00" required />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Descrição do Anúncio:</label>
            <textarea name="descricao" rows={4} maxLength={5000} value={formulario.descricao} onChange={handleChange}></textarea>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Foto de Capa:</label>
            <input type="file" accept="image/*" onChange={handleCapaChange} />
            {fotoCapa && (
              <div>
                <p>{fotoCapa.name}</p>
                <button type="button" onClick={removerFotoCapa}>Remover</button>
              </div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Galeria de Fotos (até 9):</label>
            <input type="file" accept="image/*" multiple onChange={handleGaleriaChange} />
            {galeriaFotos.length > 0 && (
              <ul>
                {galeriaFotos.map((file, index) => (
                  <li key={index}>
                    {file.name}
                    <button type="button" onClick={() => removerFotoGaleria(index)}>Remover</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="botoes" style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="enviar" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar Anúncio"}
            </button>
            <button type="button" className="cancelar" onClick={() => window.history.back()} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormularioCadastroVeiculo;
