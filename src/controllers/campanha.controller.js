// src/controllers/campanha.controller.js
import { CampanhaModel } from "../models/campanha.model.js";

/* ========= LISTA ========= */
export async function index(req, res) {
  const userId = res.locals.user?.uid;
  const campanhas = await CampanhaModel.findAll(userId);

  // monta lista única de sistemas para o filtro
  const sistemasSet = new Set(
    (campanhas || [])
      .map(c => c?.sistema || "")
      .filter(Boolean)
  );
  const sistemas = Array.from(sistemasSet).sort();

  res.render("campanhas/index", {
    layout: "_layout",
    titulo: "Campanhas",
    campanhas,
    sistemas,             // <<< IMPORTANTE
    active: "campanhas",  // realça item no menu
  });
}

/* ========= CRIAR ========= */
export function criarGet(req, res) {
  res.render("campanhas/criar", {
    layout: "_layout",
    titulo: "Criar campanha",
    errors: null,
    campanha: {},
    active: "campanhas",
  });
}

export async function criarPost(req, res) {
  const userId = res.locals.user?.uid;
  const { nome, sistema, descricao } = req.body || {};
  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/criar", {
      layout: "_layout",
      titulo: "Criar campanha",
      errors,
      campanha: { nome, sistema, descricao },
      active: "campanhas",
    });
  }

  let capaUrl = null;
  if (req.file) capaUrl = `/uploads/${req.file.filename}`;

  const criada = await CampanhaModel.create(userId, {
    nome: nome.trim(),
    sistema: sistema.trim(),
    descricao: (descricao || "").trim(),
    capaUrl,
  });

  req.session.flash = { success: "Campanha criada com sucesso." };
  return res.redirect(`/campanhas/${criada.id}`);
}

/* ========= DETALHES ========= */
export async function detalhes(req, res) {
  const userId = res.locals.user?.uid;
  const { id } = req.params;
  const campanha = await CampanhaModel.findById(userId, id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");
  campanha.sessoes = campanha.sessoes || [];

  res.render("campanhas/detalhes", {
    layout: "_layout",
    titulo: campanha.nome,
    campanha,
    errors: null,
    active: "campanhas",
  });
}

/* ========= EDITAR ========= */
export async function editarGet(req, res) {
  const userId = res.locals.user?.uid;
  const { id } = req.params;
  const campanha = await CampanhaModel.findById(userId, id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  res.render("campanhas/editar", {
    layout: "_layout",
    titulo: `Editar — ${campanha.nome}`,
    errors: null,
    campanha,
    active: "campanhas",
  });
}

export async function editarPost(req, res) {
  const userId = res.locals.user?.uid;
  const { id } = req.params;
  const original = await CampanhaModel.findById(userId, id);
  if (!original) return res.status(404).send("Campanha não encontrada.");

  const { nome, sistema, descricao } = req.body || {};
  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  const patchBase = {
    ...original,
    nome,
    sistema,
    descricao,
  };

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/editar", {
      layout: "_layout",
      titulo: `Editar — ${original.nome}`,
      errors,
      campanha: patchBase,
      active: "campanhas",
    });
  }

  const patch = {
    nome: nome.trim(),
    sistema: sistema.trim(),
    descricao: (descricao || "").trim(),
  };

  if (req.file) patch.capaUrl = `/uploads/${req.file.filename}`;

  await CampanhaModel.update(userId, id, patch);

  req.session.flash = { success: "Campanha atualizada." };
  return res.redirect(`/campanhas/${id}`);
}

/* ========= APAGAR ========= */
export async function apagarGet(req, res) {
  const userId = res.locals.user?.uid;
  const { id } = req.params;
  const campanha = await CampanhaModel.findById(userId, id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  res.render("campanhas/apagar", {
    layout: "_layout",
    titulo: `Apagar — ${campanha.nome}`,
    campanha,
    active: "campanhas",
  });
}

export async function apagarPost(req, res) {
  const userId = res.locals.user?.uid;
  const { id } = req.params;
  const ok = await CampanhaModel.remove(userId, id);
  if (!ok) return res.status(404).send("Campanha não encontrada.");

  req.session.flash = { success: "Campanha apagada." };
  return res.redirect("/campanhas"); // vai cair no index com sistemas agora
}
