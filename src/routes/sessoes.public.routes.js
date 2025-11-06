// src/routes/sessoes.public.routes.js
import { Router } from "express";
import {
  jogarSessaoGet,
  iniciarCombatePost,
  acaoCombatePost,
  finalizarCombatePost
} from "../controllers/sessao.controller.js";

const router = Router();

router.post("/sessoes/:sid/combat/start", iniciarCombatePost);
router.post("/sessoes/:sid/combat/action", acaoCombatePost);
router.post("/sessoes/:sid/combat/finish", finalizarCombatePost);

export default router;
