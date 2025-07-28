import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './Home.css';
import logoWebBuses from './assets/logo-webbuses.png';
import banner1 from './assets/banner1.png';
import banner2 from './assets/banner2.png';
import { API_URL } from './config';

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

  useEffect(() => {
    const buscarAnunciosDoBackend = async () => {
      try {
        const resposta = await fetch(`${API_URL}/anuncios`);
        const todos = await resposta.json();
        const aprovados = todos
          .filter(anuncio => anuncio.status === "aprovado")
          .reverse(); // Mostra os mais recentes primeiro
        setTodosAnuncios(aprovados);
        setAnuncios(aprovados);
      } catch (erro) {
        console.error("Erro ao buscar anúncios do backend:", erro);
        setTodosAnuncios([]);
        setAnuncios([]);
      }
    };

    buscarAnunciosDoBackend();
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

  const totalPaginas = Math.ceil(anuncios.length / anunciosPorPagina);

  const anunciosExibidos = anuncios.slice(
    (paginaAtual - 1) * anunciosPorPagina,
    paginaAtual * anunciosPorPagina
  );

  const irParaLoginAnunciante = () => {
    navigate("/login-anunciante");
  };

  useEffect(() => {
    const slides = document.querySelectorAll('.slide');
    let index = 0;
    const intervalo = setInterval(() => {
      slides.forEach(slide => slide.classList.remove('ativo'));
      index = (index + 1) % slides.length;
      slides[index].classList.add('ativo');
    }, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const [curtidas, setCurtidas] = useState({});
  const [curtido, setCurtido] = useState({});

  const handleCurtir = (id) => {
    setCurtidas((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + (curtido[id] ? -1 : 1),
    }));
    setCurtido((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCompartilhar = (id) => {
    const link = `${window.location.origin}/onibus/${id}`;
    const mensagem = encodeURIComponent(`🚍 Veja esse ônibus à venda: ${link}`);
    const opcoes = `
🔗 Compartilhar Anúncio:

✅ Copiar Link
✅ Enviar por WhatsApp
✅ Publicar no Facebook
    `;
    const acao = window.prompt(opcoes + `\nDigite: 1, 2 ou 3`);
    if (acao === "1") {
      navigator.clipboard.writeText(link);
      alert("✅ Link copiado para área de transferência!");
    } else if (acao === "2") {
      window.open(`https://wa.me/?text=${mensagem}`, "_blank");
    } else if (acao === "3") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, "_blank");
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="barra-pesquisa-container">
          <img src={logoWebBuses} alt="Web Buses" className="logo-img" />
          <div className="barra-pesquisa">
            <input
              type="text"
              placeholder="Buscar ônibus por modelo..."
              className="input-pesquisa"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select className="filtro-pesquisa">
              <option value="carroceria">Modelo de Carroceria</option>
              <option value="chassis">Modelo de Chassis</option>
            </select>
            <button className="botao-lupa" onClick={() => setBusca(busca)}>🔍</button>
          </div>
        </div>
        <button className="botao-anunciar" onClick={irParaLoginAnunciante}>
          Anuncie seu Ônibus
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
          <span onClick={() => setFiltroModelo("lowdriver")}>Low Driver (6x2 e 8x2)</span>
          <span onClick={() => setFiltroModelo("doubledecker")}>Double Decker (6x2 e 8x2)</span>
        </div>
        {filtroModelo && (
          <p style={{ color: "#fff", marginTop: 10, cursor: "pointer" }} onClick={() => setFiltroModelo(null)}>
            🔄 Mostrar todos os modelos
          </p>
        )}
      </div>

      <section className="carrossel">
        <div className="slides">
          <img src={banner1} alt="Banner 1" className="slide ativo" />
          <img src={banner2} alt="Banner 2" className="slide" />
        </div>
      </section>

      <section className="hero">
        <div className="hero-content">
          <h2>Encontre o ônibus ideal para seu negócio</h2>
          <p>Venda e compre ônibus e utilitários com segurança e agilidade.</p>
        </div>
      </section>

      <main className="anuncios">
        <h2>Últimos anúncios</h2>

        {anunciosExibidos.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 20 }}>
            Nenhum anúncio encontrado.
          </p>
        ) : (
          <div className="grid-anuncios">
            {anunciosExibidos.map((anuncio) => (
              <div className="card-anuncio" key={anuncio._id || anuncio.id}>
                <img
                  src={
                    anuncio.fotoCapaUrl ||
                    (anuncio.imagens && anuncio.imagens.length > 0 && anuncio.imagens[0]) ||
                    ""
                  }
                  alt={anuncio.modeloCarroceria}
                  className="imagem-capa"
                />
                <h3>{`${anuncio.fabricanteCarroceria || ''} ${anuncio.modeloCarroceria || anuncio.modelo}`}</h3>
                <p>
                  {Number(anuncio.valor).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <span>{anuncio.kilometragem || "—"} Km</span><br />
                <span>
                  {anuncio.localizacao
                    ? `${anuncio.localizacao.cidade} - ${anuncio.localizacao.estado}`
                    : "Localização não informada"}
                </span>
                <div className="acoes-anuncio">
                  <Link to={`/onibus/${anuncio._id || anuncio.id}`}>
                    <button className="botao-saiba-mais">Saiba Mais</button>
                  </Link>
                  <button
                    className={`botao-curtir ${curtido[anuncio._id] ? "curtido" : ""}`}
                    onClick={() => handleCurtir(anuncio._id)}
                  >
                    ❤️ {curtidas[anuncio._id] || 0}
                  </button>
                  <button
                    className="botao-compartilhar"
                    onClick={() => handleCompartilhar(anuncio._id)}
                  >
                    🔗 Compartilhar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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

