// src/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";
import logoWebBuses from "./assets/logo-webbuses.png";
import banner1 from "./assets/banner1.png";
import banner2 from "./assets/banner2.png";
import { API_URL } from "./config";
import roboWebBuses from "./assets/modelos/robo-webbuses.png";

function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function Home() {
  const navigate = useNavigate();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [anuncios, setAnuncios] = useState([]);
  const [todosAnuncios, setTodosAnuncios] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState(null);
  const anunciosPorPagina = 12;

  const [curtidas, setCurtidas] = useState({});
  const [curtido, setCurtido] = useState({});
  const [menuCompartilharAtivo, setMenuCompartilharAtivo] = useState(null);

  const [mostrarRobo, setMostrarRobo] = useState(false);
  const [falaRobo, setFalaRobo] = useState("");

  useEffect(() => {
    const jaVisitou = localStorage.getItem("visitou_robo_webbuses");
    if (!jaVisitou) {
      setMostrarRobo(true);
      localStorage.setItem("visitou_robo_webbuses", "true");
    }
  }, []);

  useEffect(() => {
  if (mostrarRobo) {
    const falas = [
      "🚍 Bem-vindo à Web Buses! Aqui você encontra o ônibus ideal para sua frota.",
      "🔎 Use a barra de busca acima para procurar ônibus por modelo ou fabricante.",
      "📁 Filtre por modelo clicando nas opções acima dos banners.",
      "📢 Clique em 'Anuncie seu Ônibus' para publicar por R$49,90.",
      "ℹ️ Clique em 'Saiba Mais' para ver os detalhes do anúncio."
    ];

    let i = 0;
    const intervalo = setInterval(() => {
      setFalaRobo(falas[i]);
      i++;
      if (i >= falas.length) clearInterval(intervalo);
    }, 6000);

    return () => clearInterval(intervalo);
  }
}, [mostrarRobo]);

  useEffect(() => {
    const buscarAnuncios = async () => {
      try {
        const resposta = await fetch(`${API_URL}/anuncios`);
        const todos = await resposta.json();
        const aprovados = todos.filter(anuncio => anuncio.status === "aprovado").reverse();
        setTodosAnuncios(aprovados);
        setAnuncios(aprovados);
      } catch (erro) {
        console.error("Erro ao buscar anúncios:", erro);
      }
    };
    buscarAnuncios();
  }, []);

  useEffect(() => {
    let filtrados = todosAnuncios;
    if (filtroModelo) {
      filtrados = filtrados.filter(anuncio =>
        removerAcentos(anuncio.tipoModelo || "").includes(removerAcentos(filtroModelo))
      );
    }
    if (busca) {
      filtrados = filtrados.filter(anuncio => {
        const campos = [
          anuncio.tipoModelo,
          anuncio.modeloCarroceria,
          anuncio.modeloChassis,
          anuncio.fabricanteCarroceria,
          anuncio.fabricanteChassis
        ].join(" ");
        return removerAcentos(campos).includes(removerAcentos(busca));
      });
    }
    setAnuncios(filtrados);
    setPaginaAtual(1);
  }, [filtroModelo, busca, todosAnuncios]);

  useEffect(() => {
    const slides = document.querySelectorAll(".slide");
    let index = 0;
    const intervalo = setInterval(() => {
      slides.forEach(slide => slide.classList.remove("ativo"));
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
    setCurtidas(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const atualizado = { ...curtidasSalvas, [id]: true };
    setCurtido(atualizado);
    localStorage.setItem("curtidas_webbuses", JSON.stringify(atualizado));
  };

  const toggleMenuCompartilhar = (id) => {
    setMenuCompartilharAtivo(prev => (prev === id ? null : id));
  };

  const copiarLink = (id) => {
    const link = `https://backend-webbuses.onrender.com/preview/${id}`;
    navigator.clipboard.writeText(link);
    alert("✅ Link com imagem copiado!");
    setMenuCompartilharAtivo(null);
  };

  const compartilharWhatsApp = (anuncio) => {
    const texto = encodeURIComponent(
      `🚍 Veja esse ônibus à venda:\n${anuncio.fabricanteCarroceria} ${anuncio.modeloCarroceria}\nhttps://backend-webbuses.onrender.com/preview/${anuncio._id}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  const compartilharFacebook = (id) => {
    const url = encodeURIComponent(`https://backend-webbuses.onrender.com/preview/${id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const totalPaginas = Math.ceil(anuncios.length / anunciosPorPagina);
  const anunciosExibidos = anuncios.slice(
    (paginaAtual - 1) * anunciosPorPagina,
    paginaAtual * anunciosPorPagina
  );

  const irParaLoginAnunciante = () => navigate("/login-anunciante");

  return (
    <div className="home-container">
      {/* topo */}
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

      <div className="menu-carrocerias">
        <p className="menu-titulo">Modelo de Carrocerias:</p>
        <div className="menu-opcoes">
          <span onClick={() => setFiltroModelo("utilitarios")}>Utilitários</span>
          <span onClick={() => setFiltroModelo("micro")}>Micro-Ônibus</span>
          <span onClick={() => setFiltroModelo("4x2")}>Ônibus 4x2</span>
          <span onClick={() => setFiltroModelo("6x2")}>Ônibus 6x2</span>
          <span onClick={() => setFiltroModelo("urbano")}>Ônibus Urbano</span>
          <span onClick={() => setFiltroModelo("lowdriver")}>Low Driver</span>
          <span onClick={() => setFiltroModelo("doubledecker")}>Double Decker</span>
        </div>

        {mostrarRobo && (
  <>
    <img src={roboWebBuses} alt="Robô Web Buses" className="robo-flutuante" />
    {falaRobo && (
      <div className="balao-fala">
        {falaRobo}
      </div>
    )}
  </>
)}

        {filtroModelo && (
          <p
            style={{ color: "#fff", marginTop: 10, cursor: "pointer" }}
            onClick={() => setFiltroModelo(null)}
          >
            🔄 Mostrar todos os modelos
          </p>
        )}
      </div>

      {/* Carrossel */}
      <section className="carrossel">
        <div className="slides">
          <img src={banner1} alt="Banner 1" className="slide ativo" />
          <img src={banner2} alt="Banner 2" className="slide" />
        </div>
      </section>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h2>Encontre o ônibus ideal para seu negócio</h2>
          <p>Venda e compre ônibus e utilitários com segurança e agilidade.</p>
        </div>
      </section>

      {/* Anúncios */}
      <main className="anuncios">
        <h2>Últimos anúncios</h2>
        <div className="grid-anuncios">
          {anunciosExibidos.map((anuncio) => (
            <div className="card-anuncio" key={anuncio._id}>
              <img src={anuncio.imagens?.[0] || ""} className="imagem-capa" alt={anuncio.modeloCarroceria} />
              <div className="info-anuncio">
                <h3>{anuncio.fabricanteCarroceria} {anuncio.modeloCarroceria}</h3>
                <p className="valor">
                  {Number(anuncio.valor).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <span>{anuncio.kilometragem} km</span><br />
                <span>{anuncio.localizacao?.cidade} - {anuncio.localizacao?.estado}</span>
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
          ))}
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
