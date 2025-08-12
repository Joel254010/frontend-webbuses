// src/PainelAdmin.jsx — painel admin integrado ao backend novo (Cloudinary)
import React, { useState, useEffect, useCallback } from "react";
import logo from "./assets/logo-webbuses.png";
import { API, ADMIN_ENDPOINT } from "./config";

function PainelAdmin() {
  const [anunciantes, setAnunciantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatarValor = (v) => {
    if (typeof v === "number" && !Number.isNaN(v)) {
      try {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        }).format(v);
      } catch {/* ignore */}
    }
    return v ?? "-";
  };

  // Escolhe capa priorizando Cloudinary (thumb > url); cai no logo se faltar
  const buildCapa = useCallback((anuncio) => {
    if (anuncio?.fotoCapaThumb) return anuncio.fotoCapaThumb;
    if (anuncio?.fotoCapaUrl)   return anuncio.fotoCapaUrl;
    if (anuncio?.capaUrl)       return anuncio.capaUrl; // compat legado
    return logo;
  }, []);

  const carregarAnuncios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "24" });

      // Sem "Cache-Control" pra não gerar preflight; usa cache: "no-store"
      const r = await fetch(`${ADMIN_ENDPOINT}?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const dados = await r.json();
      const lista = Array.isArray(dados?.data)
        ? dados.data
        : Array.isArray(dados)
        ? dados
        : [];

      // Agrupa por anunciante
      const agrupados = {};
      for (const anuncio of lista) {
        const telefoneBruto =
          anuncio.telefoneBruto ||
          (anuncio.telefone ? anuncio.telefone.replace(/\D/g, "") : "");
        const chave =
          telefoneBruto ||
          anuncio.email ||
          anuncio.nomeAnunciante ||
          anuncio.anunciante ||
          anuncio._id;

        if (!agrupados[chave]) {
          agrupados[chave] = {
            id: chave,
            nome: anuncio.nomeAnunciante || "-",
            telefone: telefoneBruto || "-",
            email: anuncio.email || "-",
            cidade: anuncio.localizacao?.cidade || "-",
            estado: anuncio.localizacao?.estado || "-",
            dataCadastro:
              anuncio.dataCadastro || new Date().toLocaleDateString("pt-BR"),
            anuncios: [],
          };
        }
        agrupados[chave].anuncios.push(anuncio);
      }

      setAnunciantes(Object.values(agrupados));
    } catch (e) {
      console.error("Erro ao buscar anúncios (admin):", e);
      setAnunciantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarAnuncios(); }, []);

  const atualizarStatusAnuncio = async (anuncioId, novoStatus) => {
    try {
      const r = await fetch(`${API}/anuncios/${anuncioId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
      alert("Não foi possível atualizar o status.");
    }
  };

  const excluirAnuncio = async (anuncioId) => {
    if (!anuncioId) return alert("❌ ID do anúncio inválido.");
    if (!window.confirm("Deseja realmente excluir este anúncio?")) return;
    try {
      const r = await fetch(`${API}/anuncios/${anuncioId}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.mensagem || e?.erro || `HTTP ${r.status}`);
      }
      await carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao excluir anúncio:", erro);
      alert("Não foi possível excluir o anúncio.");
    }
  };

  const excluirAnunciante = async (anuncianteId) => {
    if (!window.confirm("⚠️ Isso irá excluir TODOS os anúncios deste anunciante. Deseja continuar?")) return;
    try {
      const anunciante = anunciantes.find((a) => a.id === anuncianteId);
      if (anunciante) {
        await Promise.allSettled(
          anunciante.anuncios.map((anuncio) => {
            const id = anuncio._id || anuncio.id;
            return id ? fetch(`${API}/anuncios/${id}`, { method: "DELETE" }) : null;
          })
        );
      }
      await carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao excluir anunciante:", erro);
      alert("Não foi possível excluir os anúncios desse anunciante.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logado");
    window.location.href = "/login-admin";
  };

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <img src={logo} alt="Web Buses" style={styles.logo} />
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={styles.btnDanger}>Sair</button>
      </header>

      <h1 style={styles.h1}>Painel do Administrador</h1>

      {loading ? (
        <div style={styles.skeleton}>Carregando…</div>
      ) : anunciantes.length === 0 ? (
        <p style={styles.muted}>Nenhum anúncio encontrado.</p>
      ) : (
        anunciantes.map((anunciante) => (
          <section key={anunciante.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.h2}>{anunciante.nome}</h2>
                <div style={styles.meta}>
                  <span>📧 {anunciante.email}</span>
                  <span>📱 {anunciante.telefone}</span>
                  <span>📍 {anunciante.cidade} - {anunciante.estado}</span>
                  <span>🗓 {anunciante.dataCadastro}</span>
                </div>
              </div>
              <button
                onClick={() => excluirAnunciante(anunciante.id)}
                style={styles.btnDangerSm}
              >
                Excluir anunciante
              </button>
            </div>

            <div style={styles.grid}>
              {anunciante.anuncios.map((anuncio) => {
                const capa = buildCapa(anuncio);
                const fotosTotal = typeof anuncio.imagensCount === "number"
                  ? anuncio.imagensCount
                  : Array.isArray(anuncio.imagens) ? anuncio.imagens.length : 0;

                return (
                  <div key={anuncio._id} style={styles.item}>
                    <img
                      src={capa}
                      alt="Capa"
                      width={120}
                      height={90}
                      style={styles.thumb}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { if (e?.target?.src !== logo) e.target.src = logo; }}
                    />
                    <div style={styles.itemInfo}>
                      <div style={styles.titleRow}>
                        <strong>{anuncio.modeloCarroceria || anuncio.tipoModelo || "-"}</strong>
                        <span style={styles.badge}>{anuncio.status}</span>
                      </div>
                      <div style={styles.row}>
                        <span>{formatarValor(anuncio.valor)}</span>
                        <button
                          style={styles.btnLight}
                          onClick={() => window.open(`/onibus/${anuncio._id}?from=admin`, "_blank")}
                          title="Abrir anúncio"
                        >
                          Ver fotos ({fotosTotal})
                        </button>
                      </div>

                      {anuncio.status === "pendente" || anuncio.status === "aguardando pagamento" ? (
                        <div style={styles.actions}>
                          <button onClick={() => atualizarStatusAnuncio(anuncio._id, "aprovado")} style={styles.btnOk}>
                            Aprovar
                          </button>
                          <button onClick={() => atualizarStatusAnuncio(anuncio._id, "rejeitado")} style={styles.btnWarn}>
                            Rejeitar
                          </button>
                          <button onClick={() => excluirAnuncio(anuncio._id)} style={styles.btnDanger}>
                            Excluir
                          </button>
                        </div>
                      ) : anuncio.status === "aguardando venda" ? (
                        <div style={styles.actions}>
                          <span style={styles.badgeWarn}>🚧 Aguardando Confirmação</span>
                          <button onClick={() => atualizarStatusAnuncio(anuncio._id, "vendido")} style={styles.btnWarn}>
                            Confirmar venda
                          </button>
                          <button onClick={() => excluirAnuncio(anuncio._id)} style={styles.btnDanger}>
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <div style={styles.actions}>
                          {anuncio.status === "aprovado" ? (
                            <span style={styles.badgeOk}>✅ Aprovado</span>
                          ) : anuncio.status === "vendido" ? (
                            <span style={styles.badgeInfo}>✔️ Vendido</span>
                          ) : (
                            <span style={styles.badgeDanger}>❌ Rejeitado</span>
                          )}
                          <button onClick={() => excluirAnuncio(anuncio._id)} style={styles.btnDanger}>
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "16px", color: "#111", background: "#f6f7f9" },
  header: { display: "flex", alignItems: "center", padding: "8px 12px", background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  logo: { height: 44 },
  h1: { fontSize: 22, margin: "16px 0" },
  h2: { margin: 0, fontSize: 18 },
  skeleton: { padding: 16, background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  muted: { opacity: .8, padding: 8 },
  card: { background: "#fff", borderRadius: 10, padding: 12, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  meta: { display: "flex", gap: 12, flexWrap: "wrap", color: "#444", marginTop: 4, fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  item: { display: "flex", gap: 10, padding: 8, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" },
  thumb: { borderRadius: 6, objectFit: "cover", background: "#eaeaea" },
  itemInfo: { flex: 1, minWidth: 0 },
  titleRow: { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" },
  row: { display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" },
  actions: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  badge: { fontSize: 12, padding: "2px 8px", background: "#eef1f7", borderRadius: 999, color: "#3b3f46" },
  badgeOk: { fontSize: 12, padding: "2px 8px", background: "#e8f7e9", borderRadius: 999, color: "#1a7f2e" },
  badgeWarn: { fontSize: 12, padding: "2px 8px", background: "#fff7e6", borderRadius: 999, color: "#9a6b00" },
  badgeDanger: { fontSize: 12, padding: "2px 8px", background: "#fdeaea", borderRadius: 999, color: "#a32020" },
  badgeInfo: { fontSize: 12, padding: "2px 8px", background: "#e9f6ff", borderRadius: 999, color: "#0a6aa6" },
  btnOk: { background: "#28a745", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  btnWarn: { background: "#ffc107", color: "#000", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  btnDanger: { background: "#dc3545", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  btnDangerSm: { background: "#dc3545", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" },
  btnLight: { background: "#fff", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
};

export default PainelAdmin;
