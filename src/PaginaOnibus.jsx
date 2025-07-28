// src/PaginaOnibus.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./PaginaOnibus.css";
import { API_URL } from "./config";

const PaginaOnibus = () => {
  const { id } = useParams();
  const [onibus, setOnibus] = useState(null);
  const [imagemAtual, setImagemAtual] = useState("");

  useEffect(() => {
    const buscarAnuncio = async () => {
      try {
        const resposta = await fetch(`${API_URL}/anuncios/${id}`);
        if (!resposta.ok) throw new Error("Anúncio não encontrado");

        const anuncio = await resposta.json();
        setOnibus(anuncio);
        setImagemAtual(anuncio.imagens?.[0] || "");
      } catch (erro) {
        console.error("❌ Erro ao carregar anúncio:", erro);
        setOnibus(null);
      }
    };

    buscarAnuncio();
  }, [id]);

  if (!onibus) {
    return (
      <div className="pagina-onibus">
        <p style={{ color: "white", textAlign: "center", marginTop: "60px" }}>
          🚫 Anúncio não encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="pagina-onibus">
      <div className="galeria">
        <img src={imagemAtual} alt={onibus.modeloCarroceria} className="imagem-destaque" />
        <div className="miniaturas">
          {onibus.imagens?.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`foto ${idx + 1}`}
              className={`miniatura ${img === imagemAtual ? "ativa" : ""}`}
              onClick={() => setImagemAtual(img)}
            />
          ))}
        </div>
      </div>

      <div className="detalhes">
        <h1 className="titulo">{onibus.fabricanteCarroceria} {onibus.modeloCarroceria}</h1>

        <section className="bloco-informacoes">
          <h2 className="secao-titulo">🛠️ Detalhes Técnicos</h2>
          <div className="grid-detalhes">
            <div className="card-detalhe">
              <span><strong>Tipo de Modelo:</strong> {onibus.tipoModelo || "Não informado"}</span>
              <span><strong>Fabricante da Carroceria:</strong> {onibus.fabricanteCarroceria}</span>
              <span><strong>Modelo da Carroceria:</strong> {onibus.modeloCarroceria}</span>
              <span><strong>Fabricante do Chassis:</strong> {onibus.fabricanteChassis}</span>
              <span><strong>Modelo do Chassis:</strong> {onibus.modeloChassis}</span>
              <span><strong>Ano/Modelo:</strong> {onibus.anoModelo}</span>
              <span><strong>Localização:</strong> {onibus.localizacao?.cidade} - {onibus.localizacao?.estado}</span>
            </div>
            <div className="card-detalhe">
              <span><strong>Rodagem:</strong> {onibus.kilometragem} km</span>
              <span><strong>Poltronas:</strong> {onibus.lugares}</span>
              <span><strong>Cor predominante:</strong> {onibus.cor}</span>
            </div>
          </div>
        </section>

        <section className="bloco-contato">
          <p className="preco">
  💰 {Number(onibus.valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}
</p>
          <p className="anunciante">📞 Anunciante: {onibus.nomeAnunciante}</p>
          <a
            href={onibus.anunciante}
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp"
          >
            Falar no WhatsApp
          </a>
        </section>

        <section className="descricao-bloco">
          <h2 className="secao-titulo">📝 Descrição do anúncio</h2>
          <p>{onibus.descricao}</p>
        </section>

        <button onClick={() => window.history.back()} className="btn-voltar">
          ← Voltar
        </button>
      </div>
    </div>
  );
};

export default PaginaOnibus;
