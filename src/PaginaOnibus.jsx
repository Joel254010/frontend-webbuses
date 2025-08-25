// src/PaginaOnibus.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PaginaOnibus.css";
import { API_URL, API_BASE } from "./config";

/* Helpers */
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

// mesma prioridade do Admin: fotoCapaThumb -> fotoCapaUrl -> capaUrl -> primeira imagem
function getCapa(anuncio) {
  const p =
    normalizeUrlMaybe(anuncio?.fotoCapaThumb) ||
    normalizeUrlMaybe(anuncio?.fotoCapaUrl) ||
    normalizeUrlMaybe(anuncio?.capaUrl);
  if (p) return p;

  const arr = anuncio?.imagens || anuncio?.fotos || anuncio?.images;
  const img0 = Array.isArray(arr) ? arr[0] : null;
  if (typeof img0 === "string") return normalizeUrlMaybe(img0);
  if (img0?.secure_url) return img0.secure_url;
  if (img0?.url) return normalizeUrlMaybe(img0.url);
  if (img0?.path) return normalizeUrlMaybe(img0.path);
  return "";
}

// 🔹 KM: pega o primeiro campo preenchido como TEXTO cru (exatamente o que o anunciante digitou)
function getKmLabelFrom(obj = {}) {
  const first = (...vals) => {
    for (const v of vals) {
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return undefined;
  };
  return first(
    obj.kmLabel,              // caso venha do backend novo
    obj.kilometragem,         // seu campo principal
    obj.kilometragemAtual,
    obj.km,
    obj.rodagem,
    obj.quilometragem,
    obj.quilometragemAtual
  );
}

// 🔢 Normaliza telefone e garante DDI 55 (Brasil)
function normalizePhone(phoneRaw = "") {
  const digits = String(phoneRaw || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export default function PaginaOnibus() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [onibus, setOnibus] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [imagemAtual, setImagemAtual] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let abortado = false;

    const carregar = async () => {
      setLoading(true);
      setErro("");
      setOnibus(null);
      setFotos([]);
      setImagemAtual("");

      try {
        const r = await fetch(`${API_URL}/anuncios/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const full = await r.json();
        if (abortado) return;

        // full pode vir direto ou dentro de { data }
        const item =
          (full && full._id && full) ||
          (full?.data && full.data._id && full.data) ||
          full;

        if (!item || (!item._id && !item.id)) {
          throw new Error("NOT_FOUND");
        }

        const capa = getCapa(item);

        // Galeria como no Admin
        let fotosArr = Array.isArray(item.imagens) ? item.imagens.filter(Boolean) : [];
        if (capa && !fotosArr.includes(capa)) {
          fotosArr = [capa, ...fotosArr];
        }

        // 🔹 injeta kmLabel calculado (texto cru)
        const kmLabel = getKmLabelFrom(item);

        setOnibus({ ...item, kmLabel });
        setFotos(fotosArr);
        setImagemAtual(fotosArr[0] || capa || "");
      } catch (e) {
        if (!abortado) {
          console.error("Erro ao carregar anúncio:", e);
          setErro("Anúncio não encontrado.");
        }
      } finally {
        if (!abortado) setLoading(false);
      }
    };

    carregar();
    return () => { abortado = true; };
  }, [id]);

  const handleVoltar = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  if (loading) {
    return (
      <div className="pagina-onibus">
        <p style={{ color: "#fff", opacity: 0.8 }}>Carregando anúncio…</p>
      </div>
    );
  }

  if (erro || !onibus) {
    return (
      <div className="pagina-onibus">
        <p style={{ color: "#ff6b6b" }}>🚫 {erro || "Anúncio não encontrado."}</p>
        <button className="btn-voltar" onClick={handleVoltar}>← Voltar</button>
      </div>
    );
  }

  // 🔗 Link de compartilhamento idêntico ao "Copiar link" do Home
  const shareUrl = `https://backend-webbuses.onrender.com/preview/${id}`;

  // WhatsApp: usa o MESMO link do "copiar", sem título/texto extra
  const numero = normalizePhone(
    onibus?.whatsapp || onibus?.telefoneBruto || onibus?.telefone || onibus?.contato?.whatsapp || ""
  );
  const linkWhatsapp = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(shareUrl)}`
    : null; // mantém "indisponível" se não houver número (igual ao seu layout)

  return (
    <div className="pagina-onibus">
      <button className="btn-voltar" onClick={handleVoltar}>← Voltar</button>

      <div className="galeria">
        {imagemAtual && (
          <img
            src={imagemAtual}
            alt="foto principal"
            className="imagem-destaque"
            loading="eager"
            decoding="async"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <div className="miniaturas">
          {fotos.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`foto ${idx + 1}`}
              className={`miniatura ${url === imagemAtual ? "ativa" : ""}`}
              loading="lazy"
              decoding="async"
              onClick={() => setImagemAtual(url)}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ))}
        </div>
      </div>

      <div className="detalhes">
        <h1 className="titulo">
          {(onibus?.fabricanteCarroceria || "").trim()}{" "}
          {(onibus?.modeloCarroceria || "").trim()}
        </h1>

        <section className="bloco-contato">
          <p className="preco">
            {Number(onibus?.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="anunciante">📞 Anunciante: {onibus?.nomeAnunciante || "-"}</p>
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

        <section className="bloco-informacoes">
          <h2 className="secao-titulo">🛠️ Detalhes Técnicos</h2>
          <div className="grid-detalhes">
            <div className="card-detalhe">
              <span><strong>Tipo de Modelo:</strong> {onibus?.tipoModelo || "-"}</span>
              <span><strong>Fabricante Carroceria:</strong> {onibus?.fabricanteCarroceria || "-"}</span>
              <span><strong>Modelo Carroceria:</strong> {onibus?.modeloCarroceria || "-"}</span>
              <span><strong>Fabricante Chassis:</strong> {onibus?.fabricanteChassis || "-"}</span>
              <span><strong>Modelo Chassis:</strong> {onibus?.modeloChassis || "-"}</span>
              <span><strong>Ano/Modelo:</strong> {onibus?.anoModelo || "-"}</span>
              <span><strong>Localização:</strong> {onibus?.localizacao?.cidade} - {onibus?.localizacao?.estado}</span>
            </div>
            <div className="card-detalhe">
              {/* 🔹 Mostra exatamente o texto do anunciante; sem colar ' km' */}
              <span><strong>Rodagem:</strong> {onibus?.kmLabel ?? "Não informado"}</span>
              <span><strong>Poltronas:</strong> {onibus?.lugares || "-"}</span>
              <span><strong>Cor:</strong> {onibus?.cor || "-"}</span>
            </div>
          </div>
        </section>

        {onibus?.descricao && (
          <section className="descricao-bloco">
            <h2 className="secao-titulo">📝 Descrição do anúncio</h2>
            <p>
              {String(onibus.descricao).split("\n").map((linha, idx) => (
                <span key={idx}>
                  {linha}
                  <br />
                </span>
              ))}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
