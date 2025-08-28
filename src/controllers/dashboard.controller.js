import { CampanhaModel } from "../models/campanha.model.js";

function uniq(arr) { return [...new Set(arr)]; }

export function dashboard(req, res) {
  const campanhas = CampanhaModel.listar();

  // Métricas
  const total = campanhas.length;
  const sistemas = uniq(campanhas.map(c => c.sistema).filter(Boolean));
  const totalSistemas = sistemas.length;

  // “recentes” (por createdAt desc; se não houver, usa ordem do array)
  const toDate = (d) => d instanceof Date ? d : (d ? new Date(d) : null);
  const recentes = campanhas
    .slice()
    .sort((a, b) => (toDate(b?.createdAt)?.getTime() || 0) - (toDate(a?.createdAt)?.getTime() || 0))
    .slice(0, 4);

  // Atividade recente (mock simples por enquanto)
  const atividades = campanhas.slice(0, Math.min(6, campanhas.length)).map((c, i) => ({
    title: `Atualização em "${c.nome}"`,
    detail: c.descricao || "Sem descrição",
    when: i === 0 ? "agora" : `${i}d atrás`,
    icon: "bi-lightning-charge"
  }));

  res.render("dashboard/index", {
    title: "Visão Geral",
    active: "dashboard",
    // Overview
    kpis: {
      totalCampanhas: total,
      totalSistemas,
    },
    // Sessões/agenda podem vir depois; por ora deixamos nulos
    proximaSessao: null,
    ultimasCampanhas: recentes,
    atividades,
    sistemas
  });
}
