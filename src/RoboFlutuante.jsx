// src/RoboFlutuante.jsx
import React, { useState, useEffect } from "react";
import "./RoboFlutuante.css";
import roboIcon from "./assets/logo-webbuses.png"; // usa o logo como robô por enquanto

const falas = [
  "👋 Olá! Bem-vindo à Web Buses!",
  "🚌 Digite qualquer modelo de ônibus na barra de pesquisa para começar.",
  "📂 Use o menu de carrocerias para filtrar o tipo de ônibus desejado.",
  "📢 Clique em 'Anuncie seu Ônibus' para publicar seu veículo por R$ 49,90.",
  "🔍 Clique em 'Saiba Mais' em qualquer card para ver os detalhes do ônibus.",
];

function RoboFlutuante() {
  const [passo, setPasso] = useState(0);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const jaVisitou = localStorage.getItem("visita_webbuses");
    if (jaVisitou) {
      setVisivel(false);
    } else {
      localStorage.setItem("visita_webbuses", "true");
    }
  }, []);

  useEffect(() => {
    if (passo < falas.length - 1) {
      const timer = setTimeout(() => setPasso(passo + 1), 5000);
      return () => clearTimeout(timer);
    }
  }, [passo]);

  if (!visivel) return null;

  return (
    <div className="robo-flutuante">
      <img src={roboIcon} alt="Robô Web Buses" className="icone-robo" />
      <div className="fala-robo">{falas[passo]}</div>
    </div>
  );
}

export default RoboFlutuante;
