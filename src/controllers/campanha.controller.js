// src/controllers/campanha.controller.js
import { CampanhaModel } from "../models/campanha.model.js";

/* ========= LISTA ========= */
export function index(req, res) {
  const campanhas = CampanhaModel.findAll();
  res.render("campanhas/index", {
    layout: "_layout",
    titulo: "Campanhas",
    campanhas
  });
}

/* ========= CRIAR ========= */
export function criarGet(req, res) {
  res.render("campanhas/criar", {
    layout: "_layout",
    titulo: "Criar campanha",
    errors: null,
    values: {}
  });
}

export function criarPost(req, res) {
  const { nome, sistema, descricao } = req.body || {};
  const values = { nome, sistema, descricao };

  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/criar", {
      layout: "_layout",
      titulo: "Criar campanha",
      errors,
      values
    });
  }

  let capaUrl = null;
  if (req.file) {
    // se você usa upload de imagem de capa, o middleware multer coloca req.file
    capaUrl = `/uploads/${req.file.filename}`;
  }

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
  const campanha = CampanhaModel.findById(id); // <-- aqui trocamos para findById

  if (!campanha) {
    return res.status(404).send("Campanha não encontrada.");
  }

  // garante array para evitar crash na view
  campanha.sessoes = campanha.sessoes || [];

  res.render("campanhas/detalhes", {
    layout: "_layout",
    titulo: campanha.nome,
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
    errors: null,
    values: campanha
  });
}

export function editarPost(req, res) {
  const { id } = req.params;
  const campanha = CampanhaModel.findById(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada.");

  const { nome, sistema, descricao } = req.body || {};
  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/editar", {
      layout: "_layout",
      titulo: `Editar — ${campanha.nome}`,
      errors,
      values: { ...campanha, nome, sistema, descricao }
    });
  }

  let patch = {
    nome: nome.trim(),
    sistema: sistema.trim(),
    descricao: (descricao || "").trim()
  };

  if (req.file) {
    patch.capaUrl = `/uploads/${req.file.filename}`;
  }

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
    campanha
  });
}

export function apagarPost(req, res) {
  const { id } = req.params;
  const ok = CampanhaModel.remove(id);
  if (!ok) return res.status(404).send("Campanha não encontrada.");
  return res.redirect("/campanhas");
}
