// src/RoboFlutuante.jsx
import React, { useState, useEffect } from "react";
import "./RoboFlutuante.css";
import roboIcon from "./assets/modelos/robo-webbuses.png";

const falas = [
  "👋 Bem-vindo à Web Buses!",
  "🔍 Use a busca acima para encontrar seu ônibus ideal.",
  "🚌 Filtre por modelo clicando nos tipos de carroceria.",
  "📢 Anuncie seu veículo clicando em 'Anuncie seu Ônibus'.",
  "ℹ️ Clique em 'Saiba Mais' para ver todos os detalhes do anúncio."
];

function RoboFlutuante() {
  const [passo, setPasso] = useState(0);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const jaViu = localStorage.getItem("robo_visto_webbuses");
    if (!jaViu) {
      setVisivel(true);
      localStorage.setItem("robo_visto_webbuses", "true");
    }
  }, []);

  useEffect(() => {
    if (visivel && passo < falas.length - 1) {
      const timer = setTimeout(() => setPasso(passo + 1), 7000);
      return () => clearTimeout(timer);
    }
  }, [passo, visivel]);

  if (!visivel) return null;

  return (
    <div className="robo-flutuante">
      <img src={roboIcon} alt="Robô Web Buses" className="icone-robo" />
      <div className="fala-robo">{falas[passo]}</div>
      <button className="fechar-robo" onClick={() => setVisivel(false)}>✖</button>
    </div>
  );
}

export default RoboFlutuante;
