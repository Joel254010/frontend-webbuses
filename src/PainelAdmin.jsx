// src/PainelAdmin.jsx
import React, { useState, useEffect } from "react";
import logo from "./assets/logo-webbuses.png";
import fundo from "./assets/bg-whatsapp.png";
import { API_URL } from "./config";

const PAGE_LIMIT = 50;

function PainelAdmin() {
  const [anunciantes, setAnunciantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandidos, setExpandidos] = useState(() => new Set()); // ids abertos

  const carregarPagina = async (p = 1) => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/anuncios/admin?page=${p}&limit=${PAGE_LIMIT}`);
      if (!r.ok) throw new Error("Falha ao buscar admin");
      const { data, paginaAtual, totalPaginas, total } = await r.json();

      const agrupados = {};
      (data || []).forEach((anuncio) => {
        const telefoneBruto =
          anuncio.telefoneBruto ||
          (anuncio.telefone ? anuncio.telefone.replace(/\D/g, "") : "");
        const chave =
          telefoneBruto || anuncio.email || anuncio.nomeAnunciante || anuncio.anunciante || "desconhecido";

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

        const capaThumb = `${API_URL}/anuncios/${anuncio._id}/capa?w=120&q=65&format=webp`;
        const count = Number(anuncio.imagensCount || 0);

        agrupados[chave].anuncios.push({
          ...anuncio,
          capaThumb,
          imagensCount: count,
        });
      });

      setAnunciantes(Object.values(agrupados));
      setPage(paginaAtual || p);
      setTotalPaginas(totalPaginas || 1);
      setTotal(total || 0);
    } catch (e) {
      console.error(e);
      setAnunciantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPagina(1);
  }, []);

  const toggleExpandir = (anuncioId) => {
    setExpandidos((old) => {
      const next = new Set(old);
      if (next.has(anuncioId)) next.delete(anuncioId);
      else next.add(anuncioId);
      return next;
    });
  };

  const handlePrev = () => page > 1 && carregarPagina(page - 1);
  const handleNext = () => page < totalPaginas && carregarPagina(page + 1);

  const atualizarStatusAnuncio = async (anuncioId, novoStatus) => {
    try {
      await fetch(`${API_URL}/anuncios/${anuncioId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      await carregarPagina(page);
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  };

  const excluirAnuncio = async (anuncioId) => {
    if (!anuncioId) return alert("❌ ID do anúncio inválido.");
    if (!window.confirm("Deseja realmente excluir este anúncio?")) return;

    try {
      const resposta = await fetch(`${API_URL}/anuncios/${anuncioId}`, { method: "DELETE" });
      if (resposta.ok) {
        alert("✅ Anúncio excluído com sucesso.");
        await carregarPagina(page);
      } else {
        const erro = await resposta.json();
        alert("❌ Erro ao excluir anúncio: " + (erro?.mensagem || "Erro desconhecido."));
      }
    } catch (erro) {
      console.error("Erro ao excluir anúncio:", erro);
    }
  };

  const excluirAnunciante = async (anuncianteId) => {
    if (!window.confirm("⚠️ Isso irá excluir TODOS os anúncios deste anunciante. Deseja continuar?")) return;

    try {
      const anunciante = anunciantes.find((a) => a.id === anuncianteId);
      if (anunciante) {
        for (const anuncio of anunciante.anuncios) {
          const id = anuncio._id || anuncio.id;
          if (id) await fetch(`${API_URL}/anuncios/${id}`, { method: "DELETE" });
        }
      }
      alert("✅ Anunciante e todos os seus anúncios foram excluídos.");
      await carregarPagina(page);
    } catch (erro) {
      console.error("Erro ao excluir anunciante:", erro);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logado");
    window.location.href = "/login-admin";
  };

  return (
    <div style={{ ...styles.container, backgroundImage: `url(${fundo})` }}>
      <div style={styles.topo}>
        <img src={logo} alt="Web Buses" style={styles.logo} />
        <button onClick={handleLogout} style={styles.logout}>Sair</button>
      </div>

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h1 style={styles.titulo}>Painel do Administrador</h1>
        <div style={{color:"#fff"}}>Total: <strong>{total}</strong></div>
      </div>

      {/* Paginação */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={handlePrev} disabled={page<=1} style={styles.btnPage}>← Anterior</button>
        <span style={{ margin: "0 12px", color:"#fff" }}>
          Página <strong>{page}</strong> de <strong>{totalPaginas}</strong>
        </span>
        <button onClick={handleNext} disabled={page>=totalPaginas} style={styles.btnPage}>Próxima →</button>
      </div>

      {loading && <p style={{ color: "#fff" }}>⏳ Carregando anúncios…</p>}

      {!loading && anunciantes.map((anunciante) => (
        <div key={anunciante.id} style={styles.cardAnunciante}>
          <h2 style={styles.nomeAnunciante}>{anunciante.nome}</h2>
          <p><strong>Email:</strong> {anunciante.email}</p>
          <p><strong>Telefone:</strong> {anunciante.telefone}</p>
          <p><strong>Localização:</strong> {anunciante.cidade} - {anunciante.estado}</p>
          <p><strong>Data de Cadastro:</strong> {anunciante.dataCadastro}</p>

          <h3 style={styles.subtitulo}>Anúncios enviados:</h3>
          {anunciante.anuncios.map((anuncio) => {
            const aberto = expandidos.has(anuncio._id);

            // 🔹 Sem hooks aqui: calcula thumbs inline quando expandido (limite 6)
            let thumbs = [];
            const n = Math.min(Number(anuncio.imagensCount || 0), 6);
            if (aberto) {
              thumbs = n > 0
                ? Array.from({ length: n }, (_, i) =>
                    `${API_URL}/anuncios/${anuncio._id}/foto/${i}?w=100&q=65&format=webp`
                  )
                : [anuncio.capaThumb];
            }

            return (
              <div key={anuncio._id} style={styles.cardAnuncio}>
                <div style={styles.galeria}>
                  <img src={anuncio.capaThumb} alt="Capa" style={styles.imagemMiniatura} />
                  {aberto && thumbs.map((img, index) => (
                    <img key={index} src={img} alt={`Foto ${index + 1}`} style={styles.imagemMiniatura} loading="lazy" />
                  ))}
                </div>
                <div style={styles.infoAnuncio}>
                  <p><strong>Modelo:</strong> {anuncio.modeloCarroceria}</p>
                  <p><strong>Valor:</strong> {anuncio.valor}</p>
                  <p><strong>Status:</strong> {anuncio.status}</p>

                  <div style={styles.botoes}>
                    <button onClick={() => toggleExpandir(anuncio._id)} style={styles.botaoToggle}>
                      {aberto ? "Ocultar fotos" : `Ver fotos (${anuncio.imagensCount || 0})`}
                    </button>

                    {anuncio.status === "pendente" || anuncio.status === "aguardando pagamento" ? (
                      <>
                        <button onClick={() => atualizarStatusAnuncio(anuncio._id, "aprovado")} style={styles.botaoAprovar}>Aprovar</button>
                        <button onClick={() => atualizarStatusAnuncio(anuncio._id, "rejeitado")} style={styles.botaoRejeitar}>Rejeitar</button>
                        <button onClick={() => excluirAnuncio(anuncio._id)} style={styles.botaoExcluir}>Excluir</button>
                      </>
                    ) : anuncio.status === "aguardando venda" ? (
                      <>
                        <p style={{ fontWeight: "bold", color: "#ffc107", margin: 0 }}>🚧 Aguardando Confirmação de Venda</p>
                        <button onClick={() => atualizarStatusAnuncio(anuncio._id, "vendido")} style={styles.botaoRejeitar}>Confirmar Venda</button>
                        <button onClick={() => excluirAnuncio(anuncio._id)} style={styles.botaoExcluir}>Excluir</button>
                      </>
                    ) : (
                      <>
                        <p style={
                          anuncio.status === "aprovado" ? styles.statusVerde :
                          anuncio.status === "vendido" ? { color: "#00e0ff", fontWeight: "bold", margin: 0 } :
                          styles.statusVermelho
                        }>
                          {anuncio.status === "aprovado" ? "✅ Aprovado" :
                           anuncio.status === "vendido" ? "✔️ Vendido" :
                           "❌ Rejeitado"}
                        </p>
                        <button onClick={() => excluirAnuncio(anuncio._id)} style={styles.botaoExcluir}>Excluir</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={() => excluirAnunciante(anunciante.id)} style={{ ...styles.botaoExcluir, marginTop: 20 }}>
            ❌ Excluir Anunciante
          </button>
        </div>
      ))}

      <div style={{ marginTop: 16 }}>
        <button onClick={handlePrev} disabled={page<=1} style={styles.btnPage}>← Anterior</button>
        <span style={{ margin: "0 12px", color:"#fff" }}>
          Página <strong>{page}</strong> de <strong>{totalPaginas}</strong>
        </span>
        <button onClick={handleNext} disabled={page>=totalPaginas} style={styles.btnPage}>Próxima →</button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 24, backgroundSize: "300px", backgroundRepeat: "repeat", minHeight: "100vh", color: "#fff" },
  topo: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#88fe03", padding: "12px 24px", borderRadius: 8, boxShadow: "0 0 8px rgba(0,0,0,0.3)" },
  logo: { height: 60 },
  logout: { backgroundColor: "#f00", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer" },
  titulo: { fontSize: 28, margin: "24px 0" },
  cardAnunciante: { backgroundColor: "#222", borderRadius: 12, padding: 16, marginBottom: 32, boxShadow: "0 0 8px rgba(0,0,0,0.4)" },
  nomeAnunciante: { fontSize: 22, marginBottom: 8, color: "#88fe03" },
  subtitulo: { marginTop: 16, fontSize: 18, color: "#fff" },
  cardAnuncio: { display: "flex", flexWrap: "wrap", backgroundColor: "#333", borderRadius: 8, padding: 12, marginBottom: 16 },
  galeria: { display: "flex", gap: 8, flexWrap: "wrap" },
  imagemMiniatura: { width: 100, height: 80, objectFit: "cover", borderRadius: 6 },
  infoAnuncio: { flex: 1, marginLeft: 16 },
  botoes: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
  botaoAprovar: { backgroundColor: "#28a745", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  botaoRejeitar: { backgroundColor: "#ffc107", color: "#000", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  botaoExcluir: { backgroundColor: "#dc3545", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  botaoToggle: { backgroundColor: "#444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  btnPage: { backgroundColor: "#444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  statusVerde: { color: "#88fe03", fontWeight: "bold", marginTop: 10 },
  statusVermelho: { color: "#f00", fontWeight: "bold", marginTop: 10 }
};

export default PainelAdmin;
