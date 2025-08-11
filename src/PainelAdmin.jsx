// src/PainelAdmin.jsx
import React, { useState, useEffect } from "react";
import logo from "./assets/logo-webbuses.png";
import fundo from "./assets/bg-whatsapp.png";
import { API_URL } from "./config";

function PainelAdmin() {
  const [anunciantes, setAnunciantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatarValor = (v) => {
    if (typeof v === "number" && !Number.isNaN(v)) {
      try {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0
        }).format(v);
      } catch {
        return `R$ ${v}`;
      }
    }
    return v || "-";
  };

  // 🔧 monta URL de capa com múltiplos fallbacks
  const buildCapa = (anuncio) => {
    // 1) backend já manda capa pronta (preferencial pois é leve)
    if (anuncio?.capaUrl) return anuncio.capaUrl;

    // 2) registros antigos: se vier URL http/https direta em fotoCapaUrl
    if (anuncio?.fotoCapaUrl && /^https?:\/\//i.test(anuncio.fotoCapaUrl)) {
      return anuncio.fotoCapaUrl;
    }

    // 3) endpoint de capa no backend com resize leve
    return `${API_URL}/anuncios/${anuncio._id}/capa?w=320&q=70&format=webp`;
  };

  const carregarAnuncios = async () => {
    setLoading(true);
    try {
      // ⚡ paginação para reduzir payload inicial e abrir rápido
      const params = new URLSearchParams({ page: "1", limit: "24" });
      const r = await fetch(`${API_URL}/anuncios/admin?${params.toString()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const dados = await r.json();

      const lista = Array.isArray(dados?.data)
        ? dados.data
        : Array.isArray(dados)
        ? dados
        : [];

      // agrupar por anunciante
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
            anuncios: []
          };
        }
        agrupados[chave].anuncios.push(anuncio);
      }

      setAnunciantes(Object.values(agrupados));
    } catch (erro) {
      console.error("Erro ao buscar anúncios (admin):", erro);
      setAnunciantes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAnuncios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizarStatusAnuncio = async (anuncioId, novoStatus) => {
    try {
      await fetch(`${API_URL}/anuncios/${anuncioId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });
      await carregarAnuncios();
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  };

  const excluirAnuncio = async (anuncioId) => {
    if (!anuncioId) return alert("❌ ID do anúncio inválido.");
    if (!window.confirm("Deseja realmente excluir este anúncio?")) return;
    try {
      const r = await fetch(`${API_URL}/anuncios/${anuncioId}`, {
        method: "DELETE"
      });
      if (r.ok) {
        alert("✅ Anúncio excluído com sucesso.");
        await carregarAnuncios();
      } else {
        const e = await r.json().catch(() => ({}));
        alert(
          "❌ Erro ao excluir anúncio: " +
            (e?.mensagem || e?.erro || "Erro desconhecido.")
        );
      }
    } catch (erro) {
      console.error("Erro ao excluir anúncio:", erro);
    }
  };

  const excluirAnunciante = async (anuncianteId) => {
    if (
      !window.confirm(
        "⚠️ Isso irá excluir TODOS os anúncios deste anunciante. Deseja continuar?"
      )
    )
      return;
    try {
      const anunciante = anunciantes.find((a) => a.id === anuncianteId);
      if (anunciante) {
        for (const anuncio of anunciante.anuncios) {
          const id = anuncio._id || anuncio.id;
          if (id)
            await fetch(`${API_URL}/anuncios/${id}`, { method: "DELETE" });
        }
      }
      alert("✅ Anunciante e todos os seus anúncios foram excluídos.");
      await carregarAnuncios();
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
        <button onClick={handleLogout} style={styles.logout}>
          Sair
        </button>
      </div>

      <h1 style={styles.titulo}>Painel do Administrador</h1>

      {loading && (
        <p style={{ marginBottom: 16, opacity: 0.8 }}>Carregando anúncios…</p>
      )}

      {!loading && anunciantes.length === 0 && (
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          Nenhum anúncio encontrado.
        </p>
      )}

      {anunciantes.map((anunciante) => (
        <div key={anunciante.id} style={styles.cardAnunciante}>
          <h2 style={styles.nomeAnunciante}>{anunciante.nome}</h2>
          <p>
            <strong>Email:</strong> {anunciante.email}
          </p>
          <p>
            <strong>Telefone:</strong> {anunciante.telefone}
          </p>
          <p>
            <strong>Localização:</strong> {anunciante.cidade} -{" "}
            {anunciante.estado}
          </p>
          <p>
            <strong>Data de Cadastro:</strong> {anunciante.dataCadastro}
          </p>

          <h3 style={styles.subtitulo}>Anúncios enviados:</h3>

          {anunciante.anuncios.map((anuncio) => {
            // ✅ capa com múltiplos fallbacks
            const capaInicial = buildCapa(anuncio);

            // ✅ contador enxuto vindo do backend; se vier imagens completas, usa length
            const fotosTotal =
              typeof anuncio.imagensCount === "number"
                ? anuncio.imagensCount
                : Array.isArray(anuncio.imagens)
                ? anuncio.imagens.length
                : 0;

            // handler de erro pra reforçar fallback caso a primeira URL falhe
            const handleImgError = (e) => {
              const safe = `${API_URL}/anuncios/${anuncio._id}/capa?w=320&q=70&format=webp`;
              if (e?.target?.src !== safe) {
                e.target.src = safe;
              }
            };

            return (
              <div key={anuncio._id} style={styles.cardAnuncio}>
                <div style={styles.galeria}>
                  <img
                    src={capaInicial}
                    alt="Capa"
                    style={styles.imagemMiniatura}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={handleImgError}
                  />
                </div>

                <div style={styles.infoAnuncio}>
                  <p>
                    <strong>Modelo:</strong>{" "}
                    {anuncio.modeloCarroceria || anuncio.tipoModelo || "-"}
                  </p>
                  <p>
                    <strong>Valor:</strong> {formatarValor(anuncio.valor)}
                  </p>
                  <p>
                    <strong>Status:</strong> {anuncio.status}
                  </p>

                  <div style={{ marginTop: 8 }}>
                    <button
                      style={styles.botaoAprovar}
                      onClick={() =>
                        window.open(
                          `/onibus/${anuncio._id}?from=admin`,
                          "_blank"
                        )
                      }
                      title="Abrir anúncio para verificar fotos e detalhes"
                    >
                      Ver fotos ({fotosTotal})
                    </button>
                  </div>

                  {anuncio.status === "pendente" ||
                  anuncio.status === "aguardando pagamento" ? (
                    <div style={styles.botoes}>
                      <button
                        onClick={() =>
                          atualizarStatusAnuncio(anuncio._id, "aprovado")
                        }
                        style={styles.botaoAprovar}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() =>
                          atualizarStatusAnuncio(anuncio._id, "rejeitado")
                        }
                        style={styles.botaoRejeitar}
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => excluirAnuncio(anuncio._id)}
                        style={styles.botaoExcluir}
                      >
                        Excluir
                      </button>
                    </div>
                  ) : anuncio.status === "aguardando venda" ? (
                    <div style={styles.botoes}>
                      <p style={{ fontWeight: "bold", color: "#ffc107" }}>
                        🚧 Aguardando Confirmação de Venda
                      </p>
                      <button
                        onClick={() =>
                          atualizarStatusAnuncio(anuncio._id, "vendido")
                        }
                        style={styles.botaoRejeitar}
                      >
                        Confirmar Venda
                      </button>
                      <button
                        onClick={() => excluirAnuncio(anuncio._id)}
                        style={styles.botaoExcluir}
                      >
                        Excluir
                      </button>
                    </div>
                  ) : (
                    <>
                      <p
                        style={
                          anuncio.status === "aprovado"
                            ? styles.statusVerde
                            : anuncio.status === "vendido"
                            ? { color: "#00e0ff", fontWeight: "bold" }
                            : styles.statusVermelho
                        }
                      >
                        {anuncio.status === "aprovado"
                          ? "✅ Aprovado"
                          : anuncio.status === "vendido"
                          ? "✔️ Vendido"
                          : "❌ Rejeitado"}
                      </p>
                      <button
                        onClick={() => excluirAnuncio(anuncio._id)}
                        style={styles.botaoExcluir}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <button
            onClick={() => excluirAnunciante(anunciante.id)}
            style={{ ...styles.botaoExcluir, marginTop: 20 }}
          >
            ❌ Excluir Anunciante
          </button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    backgroundSize: "300px",
    backgroundRepeat: "repeat",
    minHeight: "100vh",
    color: "#fff"
  },
  topo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#88fe03",
    padding: "12px 24px",
    borderRadius: 8,
    boxShadow: "0 0 8px rgba(0,0,0,0.3)"
  },
  logo: { height: 60 },
  logout: {
    backgroundColor: "#f00",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer"
  },
  titulo: { fontSize: 28, margin: "24px 0" },
  cardAnunciante: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    boxShadow: "0 0 8px rgba(0,0,0,0.4)"
  },
  nomeAnunciante: { fontSize: 22, marginBottom: 8, color: "#88fe03" },
  subtitulo: { marginTop: 16, fontSize: 18, color: "#fff" },
  cardAnuncio: {
    display: "flex",
    flexWrap: "wrap",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  galeria: { display: "flex", gap: 8, flexWrap: "wrap" },
  imagemMiniatura: {
    width: 100,
    height: 80,
    objectFit: "cover",
    borderRadius: 6
  },
  infoAnuncio: { flex: 1, marginLeft: 16 },
  botoes: { display: "flex", gap: 8, marginTop: 12 },
  botaoAprovar: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  botaoRejeitar: {
    backgroundColor: "#ffc107",
    color: "#000",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  botaoExcluir: {
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  statusVerde: { color: "#88fe03", fontWeight: "bold", marginTop: 10 },
  statusVermelho: { color: "#f00", fontWeight: "bold", marginTop: 10 }
};

export default PainelAdmin;
