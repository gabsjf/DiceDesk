// src/controllers/sessao.controller.js
import { CampanhaModel } from "../models/campanha.model.js";
import { randomUUID } from "crypto";

/* ---------- Compat helpers para qualquer implementação de CampanhaModel ---------- */
function getCampanhaById(id) {
  if (!CampanhaModel) return null;

  // métodos comuns
  if (typeof CampanhaModel.findById === "function") return CampanhaModel.findById(id);
  if (typeof CampanhaModel.getById === "function")  return CampanhaModel.getById(id);
  if (typeof CampanhaModel.findOne === "function")  return CampanhaModel.findOne(id);
  if (typeof CampanhaModel.find === "function")     return CampanhaModel.find(id);

  // fallback: procurar em todos
  if (typeof CampanhaModel.findAll === "function") {
    const all = CampanhaModel.findAll();
    return Array.isArray(all) ? all.find(c => String(c.id) === String(id)) : null;
  }

  // último recurso: se houver CampanhaModel.all / CampanhaModel.data
  const pool = CampanhaModel.all || CampanhaModel.data || [];
  return Array.isArray(pool) ? pool.find(c => String(c.id) === String(id)) : null;
}

function getTodasCampanhas() {
  if (typeof CampanhaModel.findAll === "function") return CampanhaModel.findAll();
  return CampanhaModel.all || CampanhaModel.data || [];
}

function persistCampanha(campanha) {
  // se existir update/save/upsert, usa
  if (typeof CampanhaModel.update === "function") return CampanhaModel.update(campanha.id, campanha);
  if (typeof CampanhaModel.save === "function")   return CampanhaModel.save(campanha);
  if (typeof CampanhaModel.upsert === "function") return CampanhaModel.upsert(campanha);

  // fallback: nada a fazer (em memória por referência já atualiza)
  return campanha;
}

/* Localiza { campanha, sessao } pelo id da sessão (percorrendo todas) */
function findSessaoById(sessaoId) {
  const todas = getTodasCampanhas();
  for (const camp of todas) {
    const s = (camp.sessoes || []).find(x => String(x.id) === String(sessaoId));
    if (s) return { campanha: camp, sessao: s };
  }
  return { campanha: null, sessao: null };
}

/* ========== CRIAR SESSÃO (POST /campanhas/:id/sessoes) ========== */
export function criarSessaoPost(req, res) {
  const { id } = req.params;              // campanha id
  const { nome } = req.body || {};
  const campanha = getCampanhaById(id);

  if (!campanha) return res.status(404).send("Campanha não encontrada.");
  if (!nome || !nome.trim()) {
    return res.status(400).send("Nome da sessão é obrigatório.");
  }

  let capaUrl = null;
  if (req.file) {
    capaUrl = `/uploads/${req.file.filename}`;
  }

  const novaSessao = {
    id: randomUUID(),
    nome: nome.trim(),
    titulo: nome.trim(),
    capaUrl,
    createdAt: Date.now()
  };

  campanha.sessoes = campanha.sessoes || [];
  campanha.sessoes.unshift(novaSessao);

  persistCampanha(campanha);

  return res.redirect(`/campanhas/${campanha.id}`);
}

/* ========== APAGAR SESSÃO (POST /campanhas/:id/sessoes/:sid/apagar) ========== */
export function apagarSessaoPost(req, res) {
  const { id, sid } = req.params;   // campanha id, sessão id
  const campanha = getCampanhaById(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  campanha.sessoes = campanha.sessoes || [];
  const idx = campanha.sessoes.findIndex(s => String(s.id) === String(sid));
  if (idx >= 0) {
    campanha.sessoes.splice(idx, 1);
    persistCampanha(campanha);
  }
  return res.redirect(`/campanhas/${campanha.id}`);
}

/* ========== JOGAR SESSÃO (GET /sessoes/:id) ========== */
export function jogarSessaoGet(req, res) {
  const { id } = req.params; // id da sessão
  const { campanha, sessao } = findSessaoById(id);
  if (!sessao) return res.status(404).send("Sessão não encontrada.");

  return res.render("sessoes/jogar", {
    layout: "_layout",
    titulo: `Sessão — ${sessao.titulo || sessao.nome}`,
    campanhaId: campanha?.id || null,
    sessao
  });
}
