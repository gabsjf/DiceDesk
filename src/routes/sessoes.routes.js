import { Router } from "express";
import { jogarSessaoGet, iniciarCombatePost, acaoCombatePost, finalizarCombatePost } from "../controllers/sessao.controller.js";
import { extractUserId } from "../middlewares/auth.middleware.js"; 

const router = Router();

// 🚨 CORREÇÃO: A rota de Jogo deve ser protegida (com extractUserId) e não pública.
router.get("/:sid", extractUserId, jogarSessaoGet); 

// Rotas de Combate (que provavelmente também devem ser protegidas)
router.post("/:sid/combat/start", extractUserId, iniciarCombatePost);
router.post("/:sid/combat/action", extractUserId, acaoCombatePost);
router.post("/:sid/combat/finish", extractUserId, finalizarCombatePost);

export default router;