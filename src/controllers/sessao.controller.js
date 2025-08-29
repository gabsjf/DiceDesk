// src/controllers/sessao.controller.js
import { CampanhaModel } from "../models/campanha.model.js";
import { SessaoModel } from "../models/sessao.model.js";
import { body, validationResult } from "express-validator";

export function listarPorCampanha(req, res) {
  // usado indiretamente na view de detalhes; normalmente renderizamos por campanha
  const { id } = req.params;
  const campanha = CampanhaModel.obterPorId(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada");

  const sessoes = SessaoModel.listarPorCampanha(id);
  res.render("campanhas/detalhes", {
    title: campanha.nome,
    active: "campanhas",
    campanha,
    sessoes,
    errors: {}
  });
}

export const criarSessaoPost = [
  body("titulo").trim().notEmpty().withMessage("Informe um título para a sessão."),
  (req, res) => {
    const { id } = req.params;           // campanhaId
    const errors = validationResult(req);
    const campanha = CampanhaModel.obterPorId(id);
    if (!campanha) return res.status(404).send("Campanha não encontrada");

    if (!errors.isEmpty()) {
      const sessoes = SessaoModel.listarPorCampanha(id);
      return res.status(400).render("campanhas/detalhes", {
        title: campanha.nome,
        active: "campanhas",
        campanha,
        sessoes,
        errors: errors.mapped()
      });
    }

    const titulo = req.body.titulo;
    const file = req.file; // via multer
    const capaUrl = file ? `/uploads/${file.filename}` : "";

    SessaoModel.criar({ campanhaId: id, titulo, capaUrl });
    req.session.flash = { success: "Sessão criada." };
    res.redirect(`/campanhas/${id}`);
  }
];
