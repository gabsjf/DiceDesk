// src/routes/campanhas.routes.js
import { Router } from "express";
import {
  index,
  criarGet,
  criarPost,
  detalhes,
  apagarGet,
  apagarPost,
  editarGet,
  editarPost,
} from "../controllers/campanha.controller.js";
import { criarSessaoPost, apagarSessaoPost } from "../controllers/sessao.controller.js";
import upload from "../middlewares/upload.js";

const router = Router();

function attachCsrf(req, res, next) {
  res.locals.csrfToken = "";
  next();
}

/* Lista e criação */
router.get("/", index);
router.get("/criar", attachCsrf, criarGet);
router.post("/criar", upload.single("capa"), criarPost);

/* Aliases GET para rotas invertidas */
router.get("/editar/:id", (req, res) => res.redirect(`/campanhas/${req.params.id}/editar`));
router.get("/apagar/:id", (req, res) => res.redirect(`/campanhas/${req.params.id}/apagar`));

/* Aliases POST para rotas invertidas, mantendo método e body via 307 */
router.post("/editar/:id", (req, res) => res.redirect(307, `/campanhas/${req.params.id}/editar`));
router.post("/apagar/:id", (req, res) => res.redirect(307, `/campanhas/${req.params.id}/apagar`));

/* Detalhes, editar e apagar no formato canônico */
router.get("/:id", attachCsrf, detalhes);
router.get("/:id/editar", attachCsrf, editarGet);
router.post("/:id/editar", upload.single("capa"), editarPost);
router.get("/:id/apagar", attachCsrf, apagarGet);
router.post("/:id/apagar", apagarPost);

/* Sessões dentro da campanha */
router.post("/:id/sessoes", upload.single("imagem"), criarSessaoPost);
router.post("/:id/sessoes/:sid/apagar", apagarSessaoPost);

export default router;
