// ✅ Home.jsx – usa mesma lógica do Admin (fotoCapaThumb → fotoCapaUrl → capaUrl)
// + "KM" antes da quilometragem quando apropriado
// + Ordenação: createdAt desc (tie-breaker: updatedAt desc)
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";
import logoWebBuses from "./assets/logo-webbuses.png";
import banner1 from "./assets/banner1.png";
import banner2 from "./assets/banner2.png";
import banner3 from "./assets/banner3.png";
import { API_URL, API_BASE } from "./config";

/* Utils */
function removerAcentos(str) {
  return String(str || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function slugModeloFromTipo(tipo = "") {
  const raw = removerAcentos(String(tipo).toLowerCase());
  if (raw.includes("utilit")) return "utilitarios";
  if (raw.includes("micro")) return "micro-onibus";
  if (raw.includes("4x2")) return "onibus-4x2";
  if (raw.includes("6x2")) return "onibus-6x2";
  if (raw.includes("urbano")) return "onibus-urbano";
  if (raw.includes("low")) return "lowdriver";
  if (raw.includes("double")) return "doubledecker";
  return raw.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Normaliza qualquer string de URL (http, //, relativa, JSON stringificado) */
function normalizeUrlMaybe(value) {
  if (typeof value !== "string") return "";
  let s = value.trim();
  if (!s) return "";

  // string JSON? {"secure_url":"..."} / {"url":"..."}
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
  if (!s.includes("://")) return `${API_BASE}/${s}`;
  return "";
}

/** Mesmo critério do Admin: fotoCapaThumb → fotoCapaUrl → capaUrl → arrays */
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

function parseValorBRL(valor) {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") {
    const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = Number(limpo);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

/* ===== KM: texto livre (preserva o que o anunciante digitou) ===== */
function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return undefined;
}
function getKmLabelFromAnuncio(a) {
  // pega a primeira variação que vier preenchida
  return firstNonEmpty(
    a.kilometragem,
    a.kilometragemAtual,
    a.km,
    a.rodagem,
    a.quilometragem,
    a.quilometragemAtual
  );
}

/** 👉 Exibir “KM ” apenas quando fizer sentido:
 * - se já tem “km”, mantém como está (só padroniza para “KM”)
 * - se tiver número mas não tem “km”, prefixa “KM ”
 * - se for vazio, cai no “Não informado”
 */
function normalizeKmLabel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "Não informado";
  const lower = s.toLowerCase();
  const hasKmWord = /\bkm\b/.test(lower);
  const hasDigit = /\d/.test(s);
  if (hasKmWord) return s.replace(/\bkm\b/gi, "KM");
  if (hasDigit) return `KM ${s}`;
  return s;
}

/* ===== Datas para ordenação ===== */
function pickCreatedAt(anuncio) {
  return (
    Date.parse(anuncio?.createdAt) ||
    Date.parse(anuncio?.dataCriacao) ||
    Date.parse(anuncio?.created_at) ||
    0
  );
}
function pickUpdatedAt(anuncio) {
  return (
    Date.parse(anuncio?.updatedAt) ||
    Date.parse(anuncio?.dataAtualizacao) ||
    Date.parse(anuncio?.updated_at) ||
    0
  );
}
/* =============================================================== */

function Home() {
  const navigate = useNavigate();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [anuncios, setAnuncios] = useState([]);
  const [todosAnuncios, setTodosAnuncios] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const anunciosPorPagina = 12;

  const [curtidas, setCurtidas] = useState({});
  const [curtido, setCurtido] = useState({});
  const [menuCompartilharAtivo, setMenuCompartilharAtivo] = useState(null);

  useEffect(() => {
    const buscarAnuncios = async () => {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await fetch(`${API_URL}/anuncios`);
        const dados = await resposta.json();

        const bruto = Array.isArray(dados) ? dados : Array.isArray(dados?.anuncios) ? dados.anuncios : [];

        // normaliza + enriquece com datas para ordenação
        const normalizados = bruto
          .map((a) => {
            const _createdAt = pickCreatedAt(a) || 0;
            const _updatedAt = pickUpdatedAt(a) || 0;
            return {
              ...a,
              capaUrl: getCapa(a),
              slugModelo: a.slugModelo ?? slugModeloFromTipo(a.tipoModelo || ""),
              _valorNumber: parseValorBRL(a.valor),
              _kmLabel: getKmLabelFromAnuncio(a), // 👈 texto livre
              _createdAt,
              _updatedAt,
            };
          })
          .filter((a) => a?.status === "aprovado")
          // 🔥 Ordenação: NOVOS primeiro
          // 1) createdAt desc
          // 2) (empate) updatedAt desc
          .sort((b, a) => (a._createdAt - b._createdAt) || (a._updatedAt - b._updatedAt));

        setTodosAnuncios(normalizados);
        setAnuncios(normalizados);

        console.table(
          normalizados.slice(0, 8).map((x) => ({
            id: x._id,
            createdAt: x._createdAt,
            updatedAt: x._updatedAt,
            capaUsada: x.capaUrl || "(vazio)",
            kmLabel: x._kmLabel ?? "(sem km na lista)",
          }))
        );
      } catch (e) {
        console.error("Erro ao buscar anúncios:", e);
        setErro("Não foi possível carregar os anúncios.");
        setTodosAnuncios([]);
        setAnuncios([]);
      } finally {
        setCarregando(false);
      }
    };
    buscarAnuncios();
  }, []);

  // [KM] fallback: se a listagem não trouxe KM, buscar do /anuncios/:id/meta para os cards visíveis (preservando texto cru)
  useEffect(() => {
    if (!todosAnuncios.length) return;

    const start = (paginaAtual - 1) * anunciosPorPagina;
    const end = paginaAtual * anunciosPorPagina;
    const pagina = todosAnuncios.slice(start, end);

    const alvos = pagina.filter((a) => !a._kmLabel).slice(0, anunciosPorPagina);
    if (alvos.length === 0) return;

    let cancelado = false;

    (async () => {
      for (const a of alvos) {
        try {
          const r = await fetch(`${API_URL}/anuncios/${a._id}/meta`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          if (!r.ok) continue;
          const meta = await r.json();
          const label = getKmLabelFromAnuncio(meta);
          if (!label) continue;
          if (cancelado) break;

          // ⚠️ Mantém a ordem atual, só atualiza o item
          setTodosAnuncios((prev) =>
            prev.map((x) => (x._id === a._id ? { ...x, _kmLabel: label } : x))
          );
        } catch {}
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [todosAnuncios, paginaAtual, anunciosPorPagina]);

  // filtros e busca aplicados sobre a base já ordenada
  useEffect(() => {
    let filtrados = [...todosAnuncios];
    if (filtroModelo) filtrados = filtrados.filter((anuncio) => anuncio.slugModelo === filtroModelo);
    if (busca) {
      const alvo = removerAcentos(busca);
      filtrados = filtrados.filter((anuncio) => {
        const campos = [
          anuncio.tipoModelo,
          anuncio.modeloCarroceria,
          anuncio.modeloChassis,
          anuncio.fabricanteCarroceria,
          anuncio.fabricanteChassis,
          anuncio?.localizacao?.cidade,
          anuncio?.localizacao?.estado,
          anuncio?._kmLabel, // permite buscar por "não informado" etc.
        ]
          .filter(Boolean)
          .join(" ");
        return removerAcentos(campos).includes(alvo);
      });
    }
    setAnuncios(filtrados);
    setPaginaAtual(1);
  }, [filtroModelo, busca, todosAnuncios]);

  useEffect(() => {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;
    let index = 0;
    const intervalo = setInterval(() => {
      slides.forEach((slide) => slide.classList.remove("ativo"));
      index = (index + 1) % slides.length;
      slides[index].classList.add("ativo");
    }, 3000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const curtidasSalvas = JSON.parse(localStorage.getItem("curtidas_webbuses")) || {};
    setCurtido(curtidasSalvas);
  }, []);

  const handleCurtir = (id) => {
    const curtidasSalvas = JSON.parse(localStorage.getItem("curtidas_webbuses")) || {};
    if (curtidasSalvas[id]) {
      alert("Você já curtiu esse anúncio.");
      return;
    }
    setCurtidas((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const atualizado = { ...curtidasSalvas, [id]: true };
    setCurtido(atualizado);
    localStorage.setItem("curtidas_webbuses", JSON.stringify(atualizado));
  };

  const toggleMenuCompartilhar = (id) => {
    setMenuCompartilharAtivo((prev) => (prev === id ? null : id));
  };

  const copiarLink = (id) => {
    const link = `https://backend-webbuses.onrender.com/preview/${id}`;
    navigator.clipboard.writeText(link);
    alert("✅ Link com imagem copiado!");
    setMenuCompartilharAtivo(null);
  };

  const compartilharWhatsApp = (anuncio) => {
    const texto = encodeURIComponent(
      `🚍 Veja esse ônibus à venda:\n${anuncio.fabricanteCarroceria || ""} ${anuncio.modeloCarroceria || ""}\nhttps://backend-webbuses.onrender.com/preview/${anuncio._id}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  const compartilharFacebook = (id) => {
    const url = encodeURIComponent(`https://www.webbuses.com/onibus/${id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const totalPaginas = Math.ceil(anuncios.length / anunciosPorPagina) || 1;
  const anunciosExibidos = anuncios.slice((paginaAtual - 1) * anunciosPorPagina, paginaAtual * anunciosPorPagina);

  const irParaLoginAnunciante = () => navigate("/login-anunciante");

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="barra-pesquisa-container">
          <img src={logoWebBuses} alt="Web Buses" className="logo-img" />
          <div className="barra-pesquisa">
            <input
              type="text"
              placeholder="Encontre o ônibus perfeito para sua frota!"
              className="input-pesquisa"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button className="botao-lupa">🔍</button>
          </div>
        </div>
        <button className="botao-anunciar" onClick={irParaLoginAnunciante}>
          Anuncie seu Ônibus Conosco
        </button>
      </header>

      <p className="menu-titulo">Modelo de Carrocerias:</p>
      <div className="menu-opcoes">
        <span onClick={() => setFiltroModelo("utilitarios")}>Utilitários</span>
        <span onClick={() => setFiltroModelo("micro-onibus")}>Micro-Ônibus</span>
        <span onClick={() => setFiltroModelo("onibus-4x2")}>Ônibus 4x2</span>
        <span onClick={() => setFiltroModelo("onibus-6x2")}>Ônibus 6x2</span>
        <span onClick={() => setFiltroModelo("onibus-urbano")}>Ônibus Urbano</span>
        <span onClick={() => setFiltroModelo("lowdriver")}>Low Driver</span>
        <span onClick={() => setFiltroModelo("doubledecker")}>Double Decker</span>
      </div>

      {filtroModelo && (
        <span className="botao-voltar-modelos" onClick={() => setFiltroModelo(null)}>
          🔙 Voltar
        </span>
      )}

      <section className="carrossel">
        <div className="slides">
          <img src={banner1} alt="Banner 1" className="slide ativo" />
          <img src={banner2} alt="Banner 2" className="slide" />
          <img src={banner3} alt="Banner 3" className="slide" />
        </div>
      </section>

      <section className="hero">
        <div className="hero-content">
          <h2>Encontre o ônibus ideal para seu negócio</h2>
        </div>
      </section>

      <main className="anuncios">
        <h2>Últimos anúncios</h2>
        {carregando && <p style={{ color: "#fff", opacity: 0.8 }}>Carregando anúncios…</p>}
        {erro && !carregando && <p style={{ color: "#ff6868" }}>{erro}</p>}

        <div className="grid-anuncios">
          {!carregando &&
            !erro &&
            anunciosExibidos.map((anuncio) => {
              const capa = anuncio.capaUrl || "";
              const kmText = normalizeKmLabel(anuncio._kmLabel);
              return (
                <div className="card-anuncio" key={anuncio._id}>
                  {capa && (
                    <img
                      src={capa}
                      className="imagem-capa"
                      alt={anuncio.modeloCarroceria || "Ônibus"}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div className="info-anuncio">
                    <h3>
                      {anuncio.fabricanteCarroceria || ""} {anuncio.modeloCarroceria || ""}
                    </h3>
                    <p className="valor">
                      {parseValorBRL(anuncio.valor).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <span>{kmText}</span>
                    <br />
                    <span>
                      {anuncio.localizacao?.cidade} - {anuncio.localizacao?.estado}
                    </span>
                    <div className="acoes-anuncio">
                      <Link to={`/onibus/${anuncio._id}`}>
                        <button className="botao-saiba-mais">Saiba Mais</button>
                      </Link>
                      <button
                        className={`botao-curtir ${curtido[anuncio._id] ? "curtido" : ""}`}
                        onClick={() => handleCurtir(anuncio._id)}
                        disabled={!!curtido[anuncio._id]}
                      >
                        ❤️ {curtidas[anuncio._id] || 0}
                      </button>
                      <div className="botao-compartilhar-container">
                        <button className="botao-compartilhar" onClick={() => toggleMenuCompartilhar(anuncio._id)}>
                          🔗 Compartilhar
                        </button>
                        {menuCompartilharAtivo === anuncio._id && (
                          <div className="menu-compartilhar">
                            <button onClick={() => copiarLink(anuncio._id)}>🔗 Copiar Link</button>
                            <button onClick={() => compartilharWhatsApp(anuncio)}>📲 WhatsApp</button>
                            <button onClick={() => compartilharFacebook(anuncio._id)}>📢 Facebook</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {totalPaginas > 1 && (
          <div className="paginacao">
            {[...Array(totalPaginas)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPaginaAtual(i + 1)}
                className={paginaAtual === i + 1 ? "pagina-ativa" : ""}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Web Buses - Todos os direitos reservados.</p>
        <p>Contato: contato@webbuses.com</p>
      </footer>
    </div>
  );
}

export default Home;
