// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import PaginaOnibus from "./PaginaOnibus";
import LoginAnunciante from "./LoginAnunciante";
import CadastroAnunciante from "./CadastroAnunciante";
import PainelAnunciante from "./PainelAnunciante";
import SelecionarModeloOnibus from "./SelecionarModeloOnibus";
import FormularioCadastroVeiculo from "./FormularioCadastroVeiculo";
import MeusAnuncios from "./MeusAnuncios";
import EditarAnuncio from "./EditarAnuncio";
import AdminLogin from "./AdminLogin";
import PainelAdmin from "./PainelAdmin";
import PagamentoAnuncio from "./PagamentoAnuncio";
import ListaPorModelo from "./ListaPorModelo";

// ✅ Importa o robô flutuante
import RoboFlutuante from "./RoboFlutuante";

function App() {
  return (
    <Router>
      {/* ✅ Robô fora das rotas, aparece na maioria das páginas */}
      <RoboFlutuante />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onibus/:id" element={<PaginaOnibus />} />
        <Route path="/login-anunciante" element={<LoginAnunciante />} />
        <Route path="/cadastro-anunciante" element={<CadastroAnunciante />} />
        <Route path="/painel-anunciante" element={<PainelAnunciante />} />
        <Route path="/cadastrar-onibus" element={<SelecionarModeloOnibus />} />
        <Route path="/cadastrar-onibus/:modelo/formulario" element={<FormularioCadastroVeiculo />} />
        <Route path="/meus-anuncios" element={<MeusAnuncios />} />
        <Route path="/editar-anuncio/:id" element={<EditarAnuncio />} />
        <Route path="/pagamento-anuncio" element={<PagamentoAnuncio />} />
        <Route path="/login-admin" element={<AdminLogin />} />
        <Route path="/painel-admin" element={<PainelAdmin />} />
        <Route path="/modelo/:slugModelo" element={<ListaPorModelo />} />
      </Routes>
    </Router>
  );
}

export default App;
