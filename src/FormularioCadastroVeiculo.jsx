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
    const file = e.target.files[0];
    if (file) setFotoCapa(file);
  };

  const removerFotoCapa = () => setFotoCapa(null);

  const handleGaleriaChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 9);
    setGaleriaFotos((prev) => [...prev, ...files].slice(0, 9));
  };

  const removerFotoGaleria = (index) => {
    setGaleriaFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.fabricanteCarroceria || !formulario.modeloCarroceria || !formulario.valor) {
      alert("⚠️ Preencha todos os campos obrigatórios antes de enviar.");
      return;
    }

    const capaBase64 = fotoCapa ? await toBase64(fotoCapa) : null;
    const galeriaBase64 = await Promise.all(galeriaFotos.map(toBase64));

    const valorLimpo = formulario.valor
      .replace(/\./g, "")
      .replace(",", ".")
      .replace("R$", "")
      .trim();

    const novoAnuncio = {
      ...formulario,
      valor: parseFloat(valorLimpo),
      tipoModelo: modelo,
      fotoCapaUrl: capaBase64,
      imagens: [capaBase64, ...galeriaBase64],
      status: "pendente",
      dataEnvio: new Date().toISOString(),
    };

    console.log("🔍 Enviando para o backend:", novoAnuncio);

    try {
      const resposta = await fetch(`${API_URL}/anuncios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAnuncio),
      });

      if (resposta.ok) {
        alert("✅ Anúncio enviado com sucesso e aguardando aprovação!");
        navigate("/pagamento-anuncio");
      } else {
        const erro = await resposta.json();
        alert("❌ Erro ao enviar o anúncio: " + (erro?.mensagem || "Erro desconhecido."));
      }
    } catch (erro) {
      console.error("Erro ao enviar anúncio:", erro);
      alert("❌ Erro de conexão com o servidor.");
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

        <form onSubmit={handleSubmit} className="formulario-grid">
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
            <button type="submit" className="enviar">Enviar Anúncio</button>
            <button type="button" className="cancelar" onClick={() => window.history.back()}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormularioCadastroVeiculo;
