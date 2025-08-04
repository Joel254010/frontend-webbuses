// src/RoboFlutuante.jsx
import React, { useState, useEffect, useRef } from "react";
import roboImg from "./assets/modelos/robo-flutuante.png";
import "./RoboFlutuante.css";

function RoboFlutuante({ mostrarRobo, setMostrarRobo }) {
  const containerRef = useRef(null);
  const [falaRobo, setFalaRobo] = useState("");
  const [posicaoRobo, setPosicaoRobo] = useState({ top: 200, left: 100 });

  useEffect(() => {
    if (!mostrarRobo) return;

    const falas = [
      { texto: "🚍 Bem-vindo à Web Buses! Aqui você encontra o ônibus ideal para sua frota.", seletor: null },
      { texto: "🔎 Use a barra de busca acima para procurar a melhor opção de compra.", seletor: ".input-pesquisa" },
      { texto: "📁 Filtre por modelo de carrocerias para ver as opções disponíveis.", seletor: ".menu-opcoes" },
      { texto: "📢 Clique em 'Anuncie seu Ônibus Conosco' para publicar seu anúncio.", seletor: ".botao-anunciar" },
      { texto: "ℹ️ Clicando em 'Saiba Mais' você verá todos os detalhes do anúncio.", seletor: ".botao-saiba-mais:last-of-type" }
    ];

    let i = 0;
    let intervaloId;

    const moverERotacionar = () => {
      document.querySelectorAll(".destacado-pelo-robo").forEach(el =>
        el.classList.remove("destacado-pelo-robo")
      );

      const falaAtual = falas[i];
      const alvo = falaAtual.seletor ? document.querySelector(falaAtual.seletor) : null;
      setFalaRobo(falaAtual.texto);

      if (alvo) {
        alvo.classList.add("destacado-pelo-robo");
        const rect = alvo.getBoundingClientRect();
        const containerTop = containerRef.current?.getBoundingClientRect()?.top || 0;

        setPosicaoRobo({
          top: rect.top - containerTop + rect.height + 10 + window.scrollY,
          left: rect.left + rect.width / 2
        });

        // Scroll suave
        setTimeout(() => {
          alvo.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      } else {
        window.scrollTo({ top: i === 0 ? 0 : document.body.scrollHeight, behavior: "smooth" });

        setPosicaoRobo({
          top: window.innerHeight - 180 + window.scrollY,
          left: window.innerWidth / 2 - 100
        });
      }
    };

    moverERotacionar();

    intervaloId = setInterval(() => {
      i++;

      while (i < falas.length && falas[i].seletor && !document.querySelector(falas[i].seletor)) {
        i++;
      }

      if (i < falas.length) {
        moverERotacionar();
      } else {
        clearInterval(intervaloId);
        setTimeout(() => {
          document.querySelectorAll(".destacado-pelo-robo").forEach(el =>
            el.classList.remove("destacado-pelo-robo")
          );
          setMostrarRobo(false);
        }, 4000);
      }
    }, 5000);

    // Limpeza para evitar vazamento de memória
    return () => clearInterval(intervaloId);
  }, [mostrarRobo, setMostrarRobo]);

  if (!mostrarRobo) return null;

  return (
    <div
      ref={containerRef}
      className="robo-flutuante"
      style={{
        position: "absolute",
        top: posicaoRobo.top,
        left: posicaoRobo.left,
        transform: "translate(-50%, 0)"
      }}
    >
      <div className="fala-robo">{falaRobo}</div>
      <img src={roboImg} alt="Robô WebBuses" className="icone-robo" />
    </div>
  );
}

export default RoboFlutuante;
