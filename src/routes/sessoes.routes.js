import { Router } from "express";
// Importe seus controllers
// import { criarPost, editarPost, apagarPost } from "../controllers/sessao.controller.js";

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

// Aplica o middleware a todas as rotas de ação
router.post("/criar", extractUserId, /* criarPost */ );
router.post("/:id/editar", extractUserId, /* editarPost */ );
router.post("/:id/apagar", extractUserId, /* apagarPost */ );
// ...

export default router;