import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Home.css'; // reutiliza o mesmo layout de cards

function ListaPorModelo() {
  const { slugModelo } = useParams();
  const [anuncios, setAnuncios] = useState([]);

  useEffect(() => {
    const todos = JSON.parse(localStorage.getItem("anuncios_webbuses")) || [];
    const aprovados = todos.filter(anuncio =>
      anuncio.status === "aprovado" &&
      anuncio.modeloCarroceria?.toLowerCase().includes(slugModelo.toLowerCase())
    );
    setAnuncios(aprovados);
  }, [slugModelo]);

  return (
    <div className="home-container">
      <header className="home-header" style={{ backgroundColor: "#161616", justifyContent: "center" }}>
        <h2 style={{ color: "white", margin: "16px 0" }}>
          Modelos encontrados: {slugModelo.replace(/-/g, " ")}
        </h2>
      </header>

      <main className="anuncios">
        {anuncios.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
            Nenhum anúncio encontrado para esse modelo.
          </p>
        ) : (
          <div className="grid-anuncios">
            {anuncios.map((anuncio) => (
              <div className="card-anuncio" key={anuncio.id}>
                <img
                  src={
                    anuncio.fotoCapaUrl ||
                    (anuncio.imagens && anuncio.imagens.length > 0 && anuncio.imagens[0]) ||
                    ""
                  }
                  alt={anuncio.modeloCarroceria}
                  className="imagem-capa"
                />
                <h3>{`${anuncio.fabricanteCarroceria} ${anuncio.modeloCarroceria}`}</h3>
                <p>{anuncio.valor}</p>
                <span>{anuncio.kilometragem || "—"} Km</span><br />
                <span>
                  {anuncio.localizacao
                    ? `${anuncio.localizacao.cidade} - ${anuncio.localizacao.estado}`
                    : "Localização não informada"}
                </span>
                <Link to={`/onibus/${anuncio.id}`}>
                  <button className="botao-saiba-mais">Saiba Mais</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ListaPorModelo;
