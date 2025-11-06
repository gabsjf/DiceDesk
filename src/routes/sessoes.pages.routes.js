import { Router } from "express";
// Importe seus controllers
// import { index, criarGet, ... } from "../controllers/sessao.controller.js";

const router = Router();

// Middleware de extração de userId (Repita ou importe se for um arquivo separado)
function extractUserId(req, res, next) {
  const userId = req.user?.uid || req.user?.sub; 
  if (!userId) {
    return res.status(403).send("Acesso negado.");
  }
  req.userId = userId;
  next();
}

// Aplica o middleware a todas as rotas de gerenciamento
router.get("/", extractUserId, /* index */ );
router.get("/criar", extractUserId, /* criarGet */ );
// ... outras rotas de GET que gerenciam sessões ...

export default router;