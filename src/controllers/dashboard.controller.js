// src/controllers/dashboard.controller.js

import { CampanhaModel } from "../models/campanha.model.js";

/**
 * Retorna itens únicos de um array.
 */
function uniq(arr) { return [...new Set(arr)]; }

/**
 * Função utilitária para converter valor em Data, usada para ordenação.
 */
function toDate(d) { return d instanceof Date ? d : (d ? new Date(d) : null); }

export async function index(req, res) {
  // O middleware extractUserId já injetou e garantiu que req.userId existe.
  const userId = req.userId; 

  let campanhas = [];
  try {
    // Chama a Model de forma assíncrona (await) e passa o userId
    campanhas = await CampanhaModel.listar(userId);
  } catch (error) {
    console.error("Erro ao buscar campanhas no Firestore:", error);
    // Em caso de falha de banco de dados, mostra um erro ao usuário
    res.locals.flash = { danger: "Erro ao carregar dados do banco de dados." };
    // Permite que a página seja renderizada, mas com dados vazios
  }


  const total = campanhas.length;
  const sistemas = uniq(campanhas.map(c => c.sistema).filter(Boolean));
  const totalSistemas = sistemas.length;

  // Ordena por data de criação (createdAt) de forma decrescente
  const recentes = campanhas
    .slice()
    .sort((a, b) => (toDate(b?.createdAt)?.getTime() || 0) - (toDate(a?.createdAt)?.getTime() || 0))
    .slice(0, 4);

  
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
    
    proximaSessao: null,
    ultimasCampanhas: recentes,
    atividades,
    sistemas
  });
}