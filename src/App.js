// src/App.js
import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Home"; // Home carrega direto (landing)

// === Lazy loading para demais páginas ===
const PaginaOnibus = lazy(() => import("./PaginaOnibus"));
const LoginAnunciante = lazy(() => import("./LoginAnunciante"));
const CadastroAnunciante = lazy(() => import("./CadastroAnunciante"));
const PainelAnunciante = lazy(() => import("./PainelAnunciante"));
const SelecionarModeloOnibus = lazy(() => import("./SelecionarModeloOnibus"));
const FormularioCadastroVeiculo = lazy(() => import("./FormularioCadastroVeiculo"));
const MeusAnuncios = lazy(() => import("./MeusAnuncios"));
const EditarAnuncio = lazy(() => import("./EditarAnuncio"));
const AdminLogin = lazy(() => import("./AdminLogin"));
const PainelAdmin = lazy(() => import("./PainelAdmin"));
const PagamentoAnuncio = lazy(() => import("./PagamentoAnuncio"));
const ListaPorModelo = lazy(() => import("./ListaPorModelo"));

// /privacidade é opcional — se o arquivo não existir, mostramos fallback simples
const PoliticaPrivacidade = lazy(() =>
  import("./PoliticaPrivacidade").catch(() => ({
    default: () => (
      <div style={{ padding: 24, color: "#fff" }}>
        <h2>Política de Privacidade</h2>
        <p>Em breve.</p>
      </div>
    ),
  }))
);

// Fallback global simples
function Loading() {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "#fff" }}>
      Carregando…
    </div>
  );
}

// Sobe pro topo a cada mudança de rota
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// Guards
function AdminGuard({ children }) {
  const ok = localStorage.getItem("admin_logado") === "true";
  return ok ? children : <Navigate to="/login-admin" replace />;
}
function AnuncianteGuard({ children }) {
  let ok = false;
  try {
    const raw = localStorage.getItem("anunciante_logado");
    ok = !!raw && raw !== "null" && raw !== "undefined";
  } catch {}
  return ok ? children : <Navigate to="/login-anunciante" replace />;
}

// 404
function NotFound() {
  return (
    <div style={{ padding: 32, textAlign: "center", color: "#fff" }}>
      <h2>Página não encontrada</h2>
      <p>Verifique o endereço ou volte para a Home.</p>
      <a href="/" style={{ color: "#88fe03", fontWeight: 700 }}>Ir para a Home</a>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/onibus/:id" element={<PaginaOnibus />} />
          <Route path="/login-anunciante" element={<LoginAnunciante />} />
          <Route path="/cadastro-anunciante" element={<CadastroAnunciante />} />
          <Route path="/login-admin" element={<AdminLogin />} />
          <Route path="/pagamento-anuncio" element={<PagamentoAnuncio />} />
          <Route path="/modelo/:slugModelo" element={<ListaPorModelo />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />

          {/* Admin protegida */}
          <Route
            path="/painel-admin"
            element={
              <AdminGuard>
                <PainelAdmin />
              </AdminGuard>
            }
          />

          {/* Anunciante protegido */}
          <Route
            path="/painel-anunciante"
            element={
              <AnuncianteGuard>
                <PainelAnunciante />
              </AnuncianteGuard>
            }
          />
          <Route
            path="/meus-anuncios"
            element={
              <AnuncianteGuard>
                <MeusAnuncios />
              </AnuncianteGuard>
            }
          />
          <Route
            path="/cadastrar-onibus"
            element={
              <AnuncianteGuard>
                <SelecionarModeloOnibus />
              </AnuncianteGuard>
            }
          />
          <Route
            path="/cadastrar-onibus/:modelo/formulario"
            element={
              <AnuncianteGuard>
                <FormularioCadastroVeiculo />
              </AnuncianteGuard>
            }
          />
          <Route
            path="/editar-anuncio/:id"
            element={
              <AnuncianteGuard>
                <EditarAnuncio />
              </AnuncianteGuard>
            }
          />

          {/* Atalhos/legados */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
