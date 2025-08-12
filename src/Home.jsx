// ✅ Home.jsx – robusto para Cloudinary + array raiz ou { anuncios: [] }
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";
import logoWebBuses from "./assets/logo-webbuses.png";
import banner1 from "./assets/banner1.png";
import banner2 from "./assets/banner2.png";
import banner3 from "./assets/banner3.png"; // ✅ nome único
import { API_URL } from "./config";

/* Utils */
function removerAcentos(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Gera slugModelo no front caso a API não envie (virtual não vem na listagem leve)
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

// Tenta descobrir a URL da capa (Cloudinary ou simples)
function getCapa(anuncio) {
  // 1) campo direto
  if (anuncio?.capaUrl) return anuncio.capaUrl;

  // 2) objeto capa: { secure_url | url }
  if (anuncio?.capa?.secure_url) return anuncio.capa.secure_url;
  if (anuncio?.capa?.url) return anuncio.capa.url;

  // 3) imagens array (string ou objeto com secure_url/url)
  const img0 = anuncio?.imagens?.[0];
  if (!img0) return "";

  if (typeof img0 === "string") return img0;
  if (img0?.secure_url) return img0.secure_url;
  if (img0?.url) return img0.url;

  return "";
}

// Converte valor vindo como string “R$ 250.000,00” ou número
function parseValorBRL(valor) {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") {
    // remove R$, pontos de milhar e troca vírgula por ponto
    const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = Number(limpo);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

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

  // 🔄 Carregar anúncios
  useEffect(() => {
    const buscarAnuncios = async () => {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await fetch(`${API_URL}/anuncios`);
        const dados = await resposta.json();

        // Aceita array direto ou { anuncios: [] }
        const bruto = Array.isArray(dados)
          ? dados
          : Array.isArray(dados?.anuncios)
          ? dados.anuncios
          : [];

        // Normaliza + filtra aprovados
        const normalizados = bruto
          .map((a) => {
            const capaUrl = getCapa(a);
            return {
              ...a,
              capaUrl,
              slugModelo: a.slugModelo ?? slugModeloFromTipo(a.tipoModelo || ""),
              _valorNumber: parseValorBRL(a.valor),
            };
          })
          .filter((a) => a?.status === "aprovado");

        setTodosAnuncios(normalizados);
        setAnuncios(normalizados);
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

  // 🔎 Filtros (modelo + busca)
  useEffect(() => {
    let filtrados = [...todosAnuncios];

    if (filtroModelo) {
      filtrados = filtrados.filter((anuncio) => anuncio.slugModelo === filtroModelo);
    }

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
        ]
          .filter(Boolean)
          .join(" ");
        return removerAcentos(campos).includes(alvo);
      });
    }

    setAnuncios(filtrados);
    setPaginaAtual(1);
  }, [filtroModelo, busca, todosAnuncios]);

  // 🎞️ Carrossel
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

  // ❤️ Curtidas (localStorage)
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
    const url = encodeURIComponent(`https://backend-webbuses.onrender.com/preview/${id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const totalPaginas = Math.ceil(anuncios.length / anunciosPorPagina) || 1;
  const anunciosExibidos = anuncios.slice(
    (paginaAtual - 1) * anunciosPorPagina,
    paginaAtual * anunciosPorPagina
  );

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
          {!carregando && !erro && anunciosExibidos.map((anuncio) => {
            const capa = anuncio.capaUrl || "";
            return (
              <div className="card-anuncio" key={anuncio._id}>
                {/* ✅ usa a capa oficial vinda do backend / Cloudinary */}
                {capa ? (
                  <img
                    src={capa}
                    className="imagem-capa"
                    alt={anuncio.modeloCarroceria || "Ônibus"}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // evita quebrar o layout caso a URL da capa esteja inválida
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}

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
                  <span>{anuncio.kilometragem} km</span>
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
                      <button
                        className="botao-compartilhar"
                        onClick={() => toggleMenuCompartilhar(anuncio._id)}
                      >
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
