import { Router } from "express";
// Removida a importação de csurf
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
// Removida a criação de csrfProtection

/** Middleware que injeta variável vazia (para evitar erros na view) */
function attachCsrf(req, res, next) {
  res.locals.csrfToken = "";
  next();
}

// Listagem e CRUD de campanhas
router.get("/", index);
// Removido csrfProtection
router.get("/criar", attachCsrf, criarGet);
router.post("/criar", criarPost); 
router.get("/:id", attachCsrf, detalhes); 
router.get("/:id/editar", attachCsrf, editarGet);
router.post("/:id/editar", editarPost); 
router.get("/:id/apagar", attachCsrf, apagarGet);
router.post("/:id/apagar", apagarPost); 

// Sessões (criar / apagar) dentro da campanha
router.post(
  "/:id/sessoes",
  // csrfProtection REMOVIDO
  upload.single("imagem"),
  criarSessaoPost
);

router.post(
  "/:id/sessoes/:sid/apagar",
  // csrfProtection REMOVIDO
  apagarSessaoPost
);

export default router;
