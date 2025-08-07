import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoginAnunciante.css";

// ✅ Import das imagens
import utilitarios from "./assets/modelos/utilitarios.png";
import micro from "./assets/modelos/micro.png";
import quatroPorDois from "./assets/modelos/4x2.png";
import seisPorDois from "./assets/modelos/6x2.png";
import urbano from "./assets/modelos/urbano.png";
import lowdriver from "./assets/modelos/lowdriver.png";
import doubledecker from "./assets/modelos/doubledecker.png";

function SelecionarModeloOnibus() {
  const navigate = useNavigate();

  const opcoes = [
    { nome: "Utilitários", imagem: utilitarios, slug: "utilitarios" },
    { nome: "Micro-Ônibus", imagem: micro, slug: "micro" },
    { nome: "Ônibus 4x2", imagem: quatroPorDois, slug: "4x2" },
    { nome: "Ônibus 6x2", imagem: seisPorDois, slug: "6x2" },
    { nome: "Ônibus Urbano", imagem: urbano, slug: "urbano" },
    { nome: "Low Driver (6x2 e 8x2)", imagem: lowdriver, slug: "low-driver" },
    { nome: "Double Decker (6x2 e 8x2)", imagem: doubledecker, slug: "double-decker" },
  ];

  return (
    <div className="login-page">
      <div className="login-box">
        <h2 style={{ marginBottom: "10px", fontSize: "1.5rem" }}>
          Escolha o modelo do ônibus
        </h2>
        <p style={{ marginBottom: "20px", fontSize: "1rem", color: "#444" }}>
          Selecione o tipo de veículo que deseja anunciar:
        </p>

        <div className="grid-modelos">
          {opcoes.map((opcao, index) => (
            <div
              key={index}
              className="card-opcao"
              onClick={() => navigate(`/cadastrar-onibus/${opcao.slug}/formulario`)}
            >
              <img src={opcao.imagem} alt={opcao.nome} />
              <p>{opcao.nome}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelecionarModeloOnibus;
