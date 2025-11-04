// src/controllers/campanha.controller.js
import { CampanhaModel } from "../models/campanha.model.js";

/* ========= LISTA ========= */
export function index(req, res) {
  const campanhas =
    typeof CampanhaModel.findAll === "function"
      ? CampanhaModel.findAll()
      : typeof CampanhaModel.listar === "function"
      ? CampanhaModel.listar()
      : [];

  const sistemas = [...new Set(
    (campanhas || []).map(c => c?.sistema).filter(Boolean)
  )].sort();

  res.render("campanhas/index", {
    layout: "_layout",
    titulo: "Campanhas",
    active: "campanhas",
    campanhas,
    sistemas
  });
}

/* ========= CRIAR ========= */
export function criarGet(req, res) {
  res.render("campanhas/criar", {
    layout: "_layout",
    titulo: "Criar campanha",
    active: "campanhas",
    errors: null,
    campanha: {}
  });
}

export function criarPost(req, res) {
  const { nome, sistema, descricao } = req.body || {};
  const campanha = { nome, sistema, descricao };

  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/criar", {
      layout: "_layout",
      titulo: "Criar campanha",
      active: "campanhas",
      errors,
      campanha
    });
  }

  let capaUrl = null;
  if (req.file) capaUrl = `/uploads/${req.file.filename}`;

  const criada = CampanhaModel.create({
    nome: nome.trim(),
    sistema: sistema.trim(),
    descricao: (descricao || "").trim(),
    capaUrl
  });

  return res.redirect(`/campanhas/${criada.id}`);
}

/* ========= DETALHES ========= */
export function detalhes(req, res) {
  const { id } = req.params;
  const campanha = CampanhaModel.findById(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  campanha.sessoes = campanha.sessoes || [];

  res.render("campanhas/detalhes", {
    layout: "_layout",
    titulo: campanha.nome,
    active: "campanhas",
    campanha,
    errors: null
  });
}

/* ========= EDITAR ========= */
export function editarGet(req, res) {
  const { id } = req.params;
  const campanha = CampanhaModel.findById(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  res.render("campanhas/editar", {
    layout: "_layout",
    titulo: `Editar — ${campanha.nome}`,
    active: "campanhas",
    errors: null,
    campanha
  });
}

export function editarPost(req, res) {
  const { id } = req.params;
  const campanhaOriginal = CampanhaModel.findById(id);
  if (!campanhaOriginal) return res.status(404).send("Campanha não encontrada.");

  const { nome, sistema, descricao } = req.body || {};
  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  const campanhaAtualizada = { ...campanhaOriginal, nome, sistema, descricao };

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/editar", {
      layout: "_layout",
      titulo: `Editar — ${campanhaOriginal.nome}`,
      active: "campanhas",
      errors,
      campanha: campanhaAtualizada
    });
  }

  const patch = {
    nome: nome.trim(),
    sistema: sistema.trim(),
    descricao: (descricao || "").trim(),
    ...(req.file ? { capaUrl: `/uploads/${req.file.filename}` } : {})
  };

  CampanhaModel.update(id, patch);
  return res.redirect(`/campanhas/${id}`);
}

/* ========= APAGAR ========= */
export function apagarGet(req, res) {
  const { id } = req.params;
  const campanha = CampanhaModel.findById(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  res.render("campanhas/apagar", {
    layout: "_layout",
    titulo: `Apagar — ${campanha.nome}`,
    active: "campanhas",
    campanha
  });
}

export function apagarPost(req, res) {
  const { id } = req.params;
  const ok = CampanhaModel.remove(id);
  if (!ok) return res.status(404).send("Campanha não encontrada.");
  return res.redirect("/campanhas");
}
