// src/PaginaOnibus.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PaginaOnibus.css";
import { API_URL } from "./config";

const PaginaOnibus = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ mostra a capa oficial imediatamente (sem esperar o JSON)
  const capaUrl = `${API_URL}/anuncios/${id}/capa`;

  const [onibus, setOnibus] = useState(null);
  const [imagemAtual, setImagemAtual] = useState(() => capaUrl);
  const [miniaturas, setMiniaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  // quando trocar de anúncio, já troca a capa imediata
  useEffect(() => {
    setImagemAtual(capaUrl);
    setMiniaturas([capaUrl]);
    setOnibus(null);
    setLoading(true);

    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API_URL}/anuncios/${id}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!r.ok) throw new Error("Anúncio não encontrado");
        const anuncio = await r.json();

        setOnibus(anuncio);

        // ✅ miniaturas: usa as do anúncio se existirem, senão mantém só a capa
        const thumbs =
          Array.isArray(anuncio.imagens) && anuncio.imagens.length > 0
            ? anuncio.imagens
            : [capaUrl];
        setMiniaturas(thumbs);

        // mantém a capa exibida; se quiser, pode forçar a primeira imagem do anúncio:
        // setImagemAtual(thumbs[0]);
      } catch (e) {
        console.error("❌ Erro ao carregar anúncio:", e);
        setOnibus(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVoltar = () => {
    const params = new URLSearchParams(window.location.search);
    const veioDoPreview = params.get("from") === "preview";

    if (veioDoPreview) {
      navigate("/");
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // 🔗 WhatsApp (funciona mesmo enquanto o JSON não chegou por completo)
  const modelo =
    (onibus?.fabricanteCarroceria || "") +
    " " +
    (onibus?.modeloCarroceria || "");
  const telefoneBruto = (onibus?.telefoneBruto || "").replace(/\D/g, "");
  const mensagem = `Olá! Gostaria de maiores informações sobre o ônibus ${modelo} anunciado no Web Buses.`;
  const linkWhatsapp =
    telefoneBruto.length >= 10
      ? `https://wa.me/55${telefoneBruto}?text=${encodeURIComponent(mensagem)}`
      : undefined;

  return (
    <div className="pagina-onibus">
      <div className="galeria">
        {/* ✅ imagem principal aparece na hora (capaUrl), sem esperar a API */}
        <img
          src={imagemAtual}
          alt={onibus?.modeloCarroceria || "Ônibus"}
          className="imagem-destaque"
          loading="eager"
          decoding="async"
        />
        <div className="miniaturas">
          {miniaturas.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`foto ${idx + 1}`}
              className={`miniatura ${img === imagemAtual ? "ativa" : ""}`}
              loading="lazy"
              decoding="async"
              onClick={() => setImagemAtual(img)}
            />
          ))}
        </div>
      </div>

      <div className="detalhes">
        <h1 className="titulo">
          {(onibus?.fabricanteCarroceria || "").trim()}{" "}
          {(onibus?.modeloCarroceria || "").trim()}
        </h1>

        {/* enquanto carrega, mostra placeholders simples */}
        {loading && (
          <p style={{ color: "white", marginTop: 8 }}>⏳ Carregando detalhes…</p>
        )}

        {!loading && !onibus && (
          <p style={{ color: "white", marginTop: 8 }}>🚫 Anúncio não encontrado.</p>
        )}

        {onibus && (
          <>
            <section className="bloco-informacoes">
              <h2 className="secao-titulo">🛠️ Detalhes Técnicos</h2>
              <div className="grid-detalhes">
                <div className="card-detalhe">
                  <span>
                    <strong>Tipo de Modelo:</strong>{" "}
                    {onibus.tipoModelo || "Não informado"}
                  </span>
                  <span>
                    <strong>Fabricante da Carroceria:</strong>{" "}
                    {onibus.fabricanteCarroceria}
                  </span>
                  <span>
                    <strong>Modelo da Carroceria:</strong>{" "}
                    {onibus.modeloCarroceria}
                  </span>
                  <span>
                    <strong>Fabricante do Chassis:</strong>{" "}
                    {onibus.fabricanteChassis}
                  </span>
                  <span>
                    <strong>Modelo do Chassis:</strong>{" "}
                    {onibus.modeloChassis}
                  </span>
                  <span>
                    <strong>Ano/Modelo:</strong> {onibus.anoModelo}
                  </span>
                  <span>
                    <strong>Localização:</strong>{" "}
                    {onibus.localizacao?.cidade} - {onibus.localizacao?.estado}
                  </span>
                </div>
                <div className="card-detalhe">
                  <span>
                    <strong>Rodagem:</strong> {onibus.kilometragem} km
                  </span>
                  <span>
                    <strong>Poltronas:</strong> {onibus.lugares}
                  </span>
                  <span>
                    <strong>Cor predominante:</strong> {onibus.cor}
                  </span>
                </div>
              </div>
            </section>

            <section className="bloco-contato">
              <p className="preco">
                💰{" "}
                {Number(onibus.valor).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <p className="anunciante">📞 Anunciante: {onibus.nomeAnunciante}</p>
              {linkWhatsapp ? (
                <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp">
                  💬 Falar no WhatsApp
                </a>
              ) : (
                <span className="btn-whatsapp disabled" aria-disabled="true">
                  💬 WhatsApp indisponível
                </span>
              )}
            </section>

            {onibus.descricao && (
              <section className="descricao-bloco">
                <h2 className="secao-titulo">📝 Descrição do anúncio</h2>
                <p>
                  {onibus.descricao.split("\n").map((linha, idx) => (
                    <span key={idx}>
                      {linha}
                      <br />
                    </span>
                  ))}
                </p>
              </section>
            )}
          </>
        )}

        <button onClick={handleVoltar} className="btn-voltar">
          ← Voltar
        </button>
      </div>
    </div>
  );
};

export default PaginaOnibus;
