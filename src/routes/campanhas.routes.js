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
import { uploadImage } from "../middlewares/upload.js"; // middleware de upload (capa/imagens)

const router = Router();

/** Injeta variável para views que esperam csrfToken */
function attachCsrf(_req, res, next) {
  res.locals.csrfToken = "";
  next();
}

/* ===== Campanhas ===== */
router.get("/", index);

router.get("/criar", attachCsrf, criarGet);
// upload da capa da campanha: campo "capa"
router.post("/criar", uploadImage.single("capa"), criarPost);

router.get("/:id", attachCsrf, detalhes);

router.get("/:id/editar", attachCsrf, editarGet);
// upload opcional de nova capa: campo "capa"
router.post("/:id/editar", uploadImage.single("capa"), editarPost);

router.get("/:id/apagar", attachCsrf, apagarGet);
router.post("/:id/apagar", apagarPost);

/* ===== Sessões dentro da campanha ===== */
// upload opcional da imagem da sessão: campo "imagem"
router.post("/:id/sessoes", uploadImage.single("imagem"), criarSessaoPost);

router.post("/:id/sessoes/:sid/apagar", apagarSessaoPost);

export default router;
