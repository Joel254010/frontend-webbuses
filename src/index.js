// src/index.js
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

/** ✅ Fallback global (ajuda em lazy loads antes do App montar) */
function Loading() {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "#fff" }}>
      Carregando…
    </div>
  );
}

/** ✅ ErrorBoundary simples para evitar tela branca em caso de erro inesperado */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, info: null };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // log opcional
    console.error("Erro não tratado na UI:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#fff" }}>
          <h2>Ops! Algo deu errado.</h2>
          <p>Tente recarregar a página. Se persistir, fale com o suporte.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

/** ✅ Registro opcional do Service Worker (PWA)
 *  - Só em produção
 *  - Silencioso se não existir service-worker (sem crash)
 */
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        // console.log("SW registrado:", reg.scope);
      })
      .catch(() => {
        // silencioso
      });
  });
}
