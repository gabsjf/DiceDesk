// src/routes/sessoes.routes.js
import { Router } from "express";
import { criarSessaoPost, apagarSessaoPost } from "../controllers/sessao.controller.js";

const router = Router({ mergeParams: true });

// POST /campanhas/:id/sessoes
router.post("/sessoes", criarSessaoPost);

// POST /campanhas/:id/sessoes/:sid/apagar
router.post("/sessoes/:sid/apagar", apagarSessaoPost);

export default router;
