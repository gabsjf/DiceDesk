// src/routes/campanhas.routes.js
import { Router } from "express";
import csurf from "csurf";
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
import upload from "../middlewares/upload.js"; // multer single('imagem') configurado lá

const router = Router();
const csrfProtection = csurf({ cookie: false });

/** Middleware que injeta token CSRF nas views dessa rota */
function attachCsrf(req, res, next) {
  res.locals.csrfToken = typeof req.csrfToken === "function" ? req.csrfToken() : "";
  next();
}

// Listagem e CRUD de campanhas
router.get("/", index);
router.get("/criar", csrfProtection, attachCsrf, criarGet);
router.post("/criar", csrfProtection, attachCsrf, criarPost);
router.get("/:id", csrfProtection, attachCsrf, detalhes);
router.get("/:id/editar", csrfProtection, attachCsrf, editarGet);
router.post("/:id/editar", csrfProtection, attachCsrf, editarPost);
router.get("/:id/apagar", csrfProtection, attachCsrf, apagarGet);
router.post("/:id/apagar", csrfProtection, attachCsrf, apagarPost);

// Sessões (criar / apagar) dentro da campanha
router.post(
  "/:id/sessoes",
  csrfProtection,
  attachCsrf,
  upload.single("imagem"),
  criarSessaoPost
);

router.post(
  "/:id/sessoes/:sid/apagar",
  csrfProtection,
  attachCsrf,
  apagarSessaoPost
);

export default router;
