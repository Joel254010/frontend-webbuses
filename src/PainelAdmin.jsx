// src/PainelAdmin.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import logo from "./assets/logo-webbuses.png";
import { API, ADMIN_ENDPOINT } from "./config";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

const INTERESSES = [
  "Comprar para renovar minha frota",
  "Vender para renovar minha frota",
  "Financiamento",
  "Consórcio Carta Contemplada",
  "Consórcio Carta Programada",
  "Compra de Peças",
  "Socorro Ônibus Quebrado"
];

function PainelAdmin() {
  // 🔢 paginação (anúncios)
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(null);
  const [lastCount, setLastCount] = useState(0);

  // lista crua acumulada
  const [itens, setItens] = useState([]);

  // agrupado por anunciante (UI)
  const [anunciantes, setAnunciantes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);

  // fotos sob demanda
  const [abertas, setAbertas] = useState({});   // { [id]: boolean }
  const [fotosMap, setFotosMap] = useState({}); // { [id]: string[] }
  const [loadingFotos, setLoadingFotos] = useState({}); // { [id]: boolean }

  // erro do alias /admin (exibimos banner e aplicamos fallback)
  const [adminError, setAdminError] = useState("");

  // =========== LEADS ===========
  const [leads, setLeads] = useState([]);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsLimit, setLeadsLimit] = useState(20);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const [qLead, setQLead] = useState("");
  const [ufLead, setUfLead] = useState("");
  const [interesseLead, setInteresseLead] = useState("");

  const toBRDate = (iso) => {
    try { return new Date(iso).toLocaleString("pt-BR"); } catch { return "-"; }
  };

  const toCSV = (rows) => {
    if (!rows?.length) return "";
    const headers = Object.keys(rows[0]);
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ").trim()}"`;
    return [headers.join(";"), ...rows.map(r => headers.map(h => esc(r[h])).join(";"))].join("\n");
  };

  // ========= ANÚNCIOS =========
  const formatarValor = (v) => {
    if (typeof v === "number" && !Number.isNaN(v)) {
      try {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency", currency: "BRL", maximumFractionDigits: 0,
        }).format(v);
      } catch {}
    }
    return v ?? "-";
  };

  const buildCapa = useCallback((anuncio) => {
    if (anuncio?.fotoCapaThumb) return anuncio.fotoCapaThumb;
    if (anuncio?.fotoCapaUrl)   return anuncio.fotoCapaUrl;
    if (anuncio?.capaUrl)       return anuncio.capaUrl;
    return logo;
  }, []);

  const agrupar = useCallback((lista) => {
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
          dataCadastro: anuncio.dataCadastro || new Date().toLocaleDateString("pt-BR"),
          anuncios: [],
        };
      }
      agrupados[chave].anuncios.push(anuncio);
    }
    return Object.values(agrupados);
  }, []);

  // Carregar página (com fallback /api/anuncios)
  const carregarPagina = useCallback(async (pageToLoad = 1, append = false) => {
    if (append) setCarregandoMais(true); else setLoading(true);
    setAdminError("");

    const params = new URLSearchParams({ page: String(pageToLoad), limit: String(limit) });

    const aplicarLista = (novaLista, totalServer = null) => {
      let atualizados = [];
      setItens((prev) => {
        const map = new Map(prev.map((x) => [(x._id || x.id), x]));
        for (const item of novaLista) {
          map.set(item._id || item.id, item);
        }
        atualizados = Array.from(map.values());
        return atualizados;
      });
      setAnunciantes(agrupar(atualizados));
      setLastCount(novaLista.length);
      if (totalServer !== null && Number.isFinite(totalServer)) setTotal(totalServer);
      setPage(pageToLoad);
    };

    try {
      // 1) Tenta alias /admin (leve, feito pro painel)
      const r = await fetch(`${ADMIN_ENDPOINT}?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const totalHeader = r.headers.get("X-Total-Count");
      let totalServer = totalHeader ? parseInt(totalHeader, 10) : null;

      const dados = await r.json();
      const novaLista = Array.isArray(dados?.data)
        ? dados.data
        : Array.isArray(dados)
        ? dados
        : [];

      if (typeof dados?.total === "number" && !Number.isNaN(dados.total)) {
        totalServer = dados.total;
      }

      aplicarLista(novaLista, totalServer);
    } catch (errAdmin) {
      // 2) Fallback: /api/anuncios
      setAdminError(`Falha no alias /admin (${errAdmin.message}). Usando fallback /api/anuncios.`);
      try {
        const r2 = await fetch(`${API}/anuncios?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
        const dados2 = await r2.json();
        const lista =
          Array.isArray(dados2?.anuncios) ? dados2.anuncios :
          (Array.isArray(dados2) ? dados2 : []);

        const normalizados = lista.map((a) => ({
          ...a,
          capaUrl: a.fotoCapaThumb || a.fotoCapaUrl || a.capaUrl || "",
        }));

        aplicarLista(normalizados, null);
      } catch (errFallback) {
        console.error("Erro no fallback /api/anuncios:", errFallback);
        if (!append) {
          setItens([]); setAnunciantes([]); setTotal(0);
        }
      }
    } finally {
      if (append) setCarregandoMais(false); else setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, agrupar]); // ADMIN_ENDPOINT e API são constantes importadas

  // primeira carga
  useEffect(() => {
    carregarPagina(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMore = total !== null ? itens.length < total : lastCount === limit;

  const handleCarregarMais = () => {
    if (carregandoMais || loading) return;
    carregarPagina(page + 1, true);
  };

  const toggleFotos = async (anuncio) => {
    const id = anuncio._id || anuncio.id;
    if (!id) return;

    if (abertas[id]) {
      setAbertas((p) => ({ ...p, [id]: false }));
      return;
    }

    if (!fotosMap[id]) {
      try {
        setLoadingFotos((p) => ({ ...p, [id]: true }));
        const r = await fetch(`${API}/anuncios/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const full = await r.json();

        let fotos = Array.isArray(full.imagens) ? full.imagens.filter(Boolean) : [];
        if (full.fotoCapaUrl && !fotos.includes(full.fotoCapaUrl)) {
          fotos = [full.fotoCapaUrl, ...fotos];
        }

        setFotosMap((p) => ({ ...p, [id]: fotos }));
      } catch (err) {
        console.error("Erro ao carregar fotos:", err);
        setFotosMap((p) => ({ ...p, [id]: [] }));
      } finally {
        setLoadingFotos((p) => ({ ...p, [id]: false }));
      }
    }

    setAbertas((p) => ({ ...p, [id]: true }));
  };

  const atualizarStatusAnuncio = async (anuncioId, novoStatus) => {
    try {
      const r = await fetch(`${API}/anuncios/${anuncioId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await carregarPagina(1, false);
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
      setItens((prev) => {
        const next = prev.filter((a) => (a._id || a.id) !== anuncioId);
        setAnunciantes(agrupar(next));
        return next;
      });
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
      await carregarPagina(1, false);
    } catch (erro) {
      console.error("Erro ao excluir anunciante:", erro);
      alert("Não foi possível excluir os anúncios desse anunciante.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logado");
    window.location.href = "/login-admin";
  };

  // =========== LEADS: carregar/paginar/filtrar/exportar ===========
  const carregarLeads = useCallback(async (p = 1, l = leadsLimit) => {
    setLeadsLoading(true);
    try {
      const r = await fetch(`${API}/leads?page=${p}&limit=${l}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setLeads(Array.isArray(data.itens) ? data.itens : []);
      setLeadsTotal(Number(data.total || 0));
      setLeadsPage(Number(data.page || p));
      setLeadsLimit(Number(data.limit || l));
    } catch (e) {
      console.error("Erro ao buscar leads:", e);
      setLeads([]); setLeadsTotal(0);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsLimit]); // API é constante importada

  useEffect(() => {
    carregarLeads(1, leadsLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leadsFiltrados = useMemo(() => {
    let base = [...leads];
    if (qLead) {
      const alvo = qLead.toLowerCase();
      base = base.filter((l) =>
        [
          l.nome, l.email, l.telefone, l.detalhes, l.cidade, l.estado, l.interesse, l.origem
        ].filter(Boolean).join(" ").toLowerCase().includes(alvo)
      );
    }
    if (ufLead) base = base.filter((l) => (l.estado || "").toUpperCase() === ufLead);
    if (interesseLead) base = base.filter((l) => (l.interesse || "") === interesseLead);
    return base;
  }, [leads, qLead, ufLead, interesseLead]);

  const baixarCSV = () => {
    const rows = leadsFiltrados.map((l) => ({
      data: toBRDate(l.createdAt),
      nome: l.nome || "-",
      email: l.email || "-",
      telefone: l.telefone ? `+55 ${l.telefone}` : "-",
      interesse: l.interesse || "-",
      uf: (l.estado || "").toUpperCase(),
      cidade: l.cidade || "-",
      origem: l.origem || "-",
      utm_source: l?.utm?.utm_source || "",
      utm_medium: l?.utm?.utm_medium || "",
      utm_campaign: l?.utm?.utm_campaign || "",
    }));
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-webbuses-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPaginasLeads = Math.max(1, Math.ceil(leadsTotal / leadsLimit));

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <img src={logo} alt="Web Buses" style={styles.logo} />
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={styles.btnDanger}>Sair</button>
      </header>

      <h1 style={styles.h1}>Painel do Administrador</h1>

      {adminError ? (
        <div style={{
          background: "#fff7e6",
          border: "1px solid #ffe1a6",
          color: "#8a6d00",
          padding: 8,
          borderRadius: 8,
          marginBottom: 12
        }}>
          {adminError}
        </div>
      ) : null}

      {/* ====== Caixa: ANÚNCIOS ====== */}
      {loading ? (
        <div style={styles.skeleton}>Carregando…</div>
      ) : anunciantes.length === 0 ? (
        <p style={styles.muted}>Nenhum anúncio encontrado.</p>
      ) : (
        <>
          {anunciantes.map((anunciante) => (
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
                <button onClick={() => excluirAnunciante(anunciante.id)} style={styles.btnDangerSm}>
                  Excluir anunciante
                </button>
              </div>

              <div style={styles.grid}>
                {anunciante.anuncios.map((anuncio) => {
                  const id = anuncio._id || anuncio.id;
                  const capa = buildCapa(anuncio);
                  const fotosTotal = Array.isArray(fotosMap[id])
                    ? fotosMap[id].length
                    : (typeof anuncio.imagensCount === "number"
                        ? anuncio.imagensCount
                        : Array.isArray(anuncio.imagens) ? anuncio.imagens.length : 0);

                  const aberto = !!abertas[id];

                  return (
                    <div key={id} style={styles.item}>
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
                            onClick={() => toggleFotos(anuncio)}
                            title={aberto ? "Ocultar fotos" : "Ver fotos"}
                          >
                            {aberto ? "Ocultar fotos" : `Ver fotos (${fotosTotal || 0})`}
                          </button>
                        </div>

                        {aberto && (
                          <div style={{ marginTop: 10 }}>
                            {loadingFotos[id] ? (
                              <div style={styles.muted}>Carregando fotos…</div>
                            ) : (fotosMap[id] && fotosMap[id].length > 0) ? (
                              <div style={styles.gridFotos}>
                                {fotosMap[id].map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`foto ${idx + 1}`}
                                    style={styles.foto}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => { if (e?.target?.src !== logo) e.target.src = logo; }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div style={styles.muted}>Sem fotos para este anúncio.</div>
                            )}
                          </div>
                        )}

                        {/* Ações */}
                        {anuncio.status === "pendente" || anuncio.status === "aguardando pagamento" ? (
                          <div style={styles.actions}>
                            <button onClick={() => atualizarStatusAnuncio(id, "aprovado")} style={styles.btnOk}>
                              Aprovar
                            </button>
                            <button onClick={() => atualizarStatusAnuncio(id, "rejeitado")} style={styles.btnWarn}>
                              Rejeitar
                            </button>
                            <button onClick={() => excluirAnuncio(id)} style={styles.btnDanger}>
                              Excluir
                            </button>
                          </div>
                        ) : anuncio.status === "aguardando venda" ? (
                          <div style={styles.actions}>
                            <span style={styles.badgeWarn}>🚧 Aguardando Confirmação</span>
                            <button onClick={() => atualizarStatusAnuncio(id, "vendido")} style={styles.btnWarn}>
                              Confirmar venda
                            </button>
                            <button onClick={() => excluirAnuncio(id)} style={styles.btnDanger}>
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
                            <button onClick={() => excluirAnuncio(id)} style={styles.btnDanger}>
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
          ))}

          {/* Paginação: Carregar Mais */}
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            {hasMore ? (
              <button
                onClick={handleCarregarMais}
                disabled={carregandoMais}
                style={{ background: "#fff", border: "1px solid #ddd", padding: "10px 16px", borderRadius: 8, cursor: carregandoMais ? "wait" : "pointer" }}
              >
                {carregandoMais ? "Carregando…" : "Carregar mais"}
              </button>
            ) : (
              <span style={{ opacity: 0.8 }}>Todos os anúncios foram carregados.</span>
            )}
          </div>
        </>
      )}

      {/* ====== Caixa: LEADS ====== */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.h2}>Leads (captação)</h2>
          <div style={styles.leadActions}>
            <input
              placeholder="Buscar nome, e-mail, telefone, cidade…"
              value={qLead}
              onChange={(e) => setQLead(e.target.value)}
              style={styles.inp}
            />
            <select value={ufLead} onChange={(e) => setUfLead(e.target.value.toUpperCase())} style={styles.inp}>
              <option value="">UF</option>
              {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={interesseLead} onChange={(e) => setInteresseLead(e.target.value)} style={styles.inp}>
              <option value="">Interesse</option>
              {INTERESSES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <button onClick={baixarCSV} style={styles.btnOk}>Exportar CSV</button>
          </div>
        </div>

        <div style={styles.tableWrap}>
          {leadsLoading ? (
            <div style={styles.muted}>Carregando leads…</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Contato</th>
                  <th style={styles.th}>Interesse</th>
                  <th style={styles.th}>UF</th>
                  <th style={styles.th}>Cidade</th>
                  <th style={styles.th}>Origem</th>
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...styles.td, textAlign: "center", opacity: 0.7 }}>Sem leads neste filtro.</td></tr>
                ) : (
                  leadsFiltrados.map((l) => (
                    <tr key={l._id}>
                      <td style={styles.td}>{toBRDate(l.createdAt)}</td>
                      <td style={styles.td}>{l.nome || "-"}</td>
                      <td style={styles.td}>
                        {l.email ? <div>{l.email}</div> : null}
                        {l.telefone ? <div>+55 {l.telefone}</div> : null}
                      </td>
                      <td style={styles.td}>{l.interesse || "-"}</td>
                      <td style={styles.td}>{(l.estado || "").toUpperCase()}</td>
                      <td style={styles.td}>{l.cidade || "-"}</td>
                      <td style={styles.td}>{l.origem || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação Leads */}
        <div style={styles.pager}>
          <button
            onClick={() => carregarLeads(Math.max(1, leadsPage - 1), leadsLimit)}
            disabled={leadsLoading || leadsPage <= 1}
            style={styles.btnLight}
          >
            ◀ Anterior
          </button>
          <span style={styles.muted}>
            Página {leadsPage} de {totalPaginasLeads} · {leadsTotal} leads
          </span>
          <button
            onClick={() => carregarLeads(Math.min(totalPaginasLeads, leadsPage + 1), leadsLimit)}
            disabled={leadsLoading || leadsPage >= totalPaginasLeads}
            style={styles.btnLight}
          >
            Próxima ▶
          </button>
          <select
            value={leadsLimit}
            onChange={(e) => carregarLeads(1, parseInt(e.target.value, 10))}
            style={styles.inp}
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}/página</option>)}
          </select>
        </div>
      </section>
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
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 },
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
  btnOk: { background: "#28a745", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" },
  btnWarn: { background: "#ffc107", color: "#000", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  btnDanger: { background: "#dc3545", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  btnDangerSm: { background: "#dc3545", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" },
  btnLight: { background: "#fff", border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  gridFotos: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 },
  foto: { width: "100%", height: 100, objectFit: "cover", borderRadius: 6, background: "#eaeaea" },
  leadActions: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  inp: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", minWidth: 160 },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 780 },
  th: { textAlign: "left", padding: "10px", fontWeight: 700, background: "#f3f5f8", borderBottom: "1px solid #e6e9ef", fontSize: 14, whiteSpace: "nowrap" },
  td: { padding: "10px", borderBottom: "1px solid #eee", fontSize: 14, verticalAlign: "top" },
  pager: { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", marginTop: 12, flexWrap: "wrap" },
};

export default PainelAdmin;
