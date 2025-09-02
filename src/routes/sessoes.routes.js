// src/routes/sessoes.routes.js
import { Router } from "express";
import { jogarSessaoGet } from "../controllers/sessao.controller.js";

const router = Router();

// Tela principal de jogo da sessão
router.get("/:id", jogarSessaoGet);

export default router;
