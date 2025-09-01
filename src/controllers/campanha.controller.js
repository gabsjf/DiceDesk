// src/controllers/campanha.controller.js
import { CampanhaModel } from "../models/campanha.model.js";
import { body, validationResult } from "express-validator";

/* ===========================
 * LISTA
 * =========================== */
export function index(req, res) {
  const campanhas = CampanhaModel.listar();

  // Lista única de sistemas para o filtro da view
  const sistemas = [...new Set(campanhas.map(c => c.sistema).filter(Boolean))];

  res.render("campanhas/index", {
    title: "Campanhas",
    active: "campanhas",
    campanhas,
    sistemas
  });
}

/* ===========================
 * CRIAR (GET)
 * =========================== */
export function criarGet(req, res) {
  res.render("campanhas/criar", {
    title: "Criar Nova Campanha",
    active: "campanhas",
    campanha: {},
    errors: {}
  });
}

/* ===========================
 * CRIAR (POST)
 * =========================== */
export const criarPost = [
  body("nome").trim().notEmpty().withMessage("O nome da campanha é obrigatório."),
  body("sistema").trim().notEmpty().withMessage("O sistema de jogo é obrigatório."),
  body("descricao").trim().optional({ nullable: true }),

  (req, res) => {
    const errors = validationResult(req);
    const { nome, sistema, descricao } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render("campanhas/criar", {
        title: "Criar Nova Campanha",
        active: "campanhas",
        campanha: { nome, sistema, descricao },
        errors: errors.mapped()
      });
    }

    const nova = CampanhaModel.criar({ nome, sistema, descricao });
    req.session.flash = { success: `Campanha '${nova.nome}' criada (Id ${nova.id}).` };
    res.redirect("/campanhas");
  }
];

/* ===========================
 * DETALHES (GET)
 * =========================== */

import { SessaoModel } from "../models/sessao.model.js";
export function detalhes(req, res) {
  const campanha = CampanhaModel.obterPorId(req.params.id);
  if (!campanha) return res.status(404).send("Campanha não encontrada");

  const sessoes = SessaoModel.listarPorCampanha(campanha.id);
  const campanhaView = { ...campanha, sessoes };

  res.render("campanhas/detalhes", {
    title: "Detalhes da Campanha",
    active: "campanhas",
    campanha: campanhaView,
    sessoes,
    errors: {},
    csrfToken: req.csrfToken()  // <— explícito
  });
}


/* ===========================
 * EDITAR (GET)
 * =========================== */
export function editarGet(req, res) {
  const campanha = CampanhaModel.obterPorId(req.params.id);
  if (!campanha) return res.status(404).send("Campanha não encontrada");

  res.render("campanhas/editar", {
    title: "Editar Campanha",
    active: "campanhas",
    campanha,
    errors: {}
  });
}

/* ===========================
 * EDITAR (POST)
 * =========================== */
export const editarPost = [
  body("nome").trim().notEmpty().withMessage("O nome da campanha é obrigatório."),
  body("sistema").trim().notEmpty().withMessage("O sistema de jogo é obrigatório."),
  body("descricao").trim().optional({ nullable: true }),

  (req, res) => {
    const errors = validationResult(req);
    const id = req.params.id;
    const { nome, sistema, descricao } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render("campanhas/editar", {
        title: "Editar Campanha",
        active: "campanhas",
        campanha: { id, nome, sistema, descricao },
        errors: errors.mapped()
      });
    }

    const atualizada = CampanhaModel.atualizar(id, { nome, sistema, descricao });
    if (!atualizada) return res.status(404).send("Campanha não encontrada");

    req.session.flash = { success: `Campanha '${atualizada.nome}' atualizada.` };
    res.redirect("/campanhas");
  }
];

/* ===========================
 * APAGAR (GET)
 * =========================== */
export function apagarGet(req, res) {
  const campanha = CampanhaModel.obterPorId(req.params.id);
  if (!campanha) return res.status(404).send("Campanha não encontrada");

  res.render("campanhas/apagar", {
    title: "Apagar Campanha",
    active: "campanhas",
    campanha
  });
}

/* ===========================
 * APAGAR (POST)
 * =========================== */
export function apagarPost(req, res) {
  const ok = CampanhaModel.remover(req.params.id);
  if (ok) req.session.flash = { success: "Campanha removida." };
  res.redirect("/campanhas");
}
