import { Router } from "express";
import { 
    jogarSessaoGet, 
    iniciarCombatePost, 
    acaoCombatePost, 
    finalizarCombatePost 
} from "../controllers/sessao.controller.js";

// 🚨 IMPORTAÇÃO CORRIGIDA: Importa o authMiddleware junto com o extractUserId
import { authMiddleware, extractUserId } from "../middlewares/auth.middleware.js"; 

const router = Router();

// Rota de Jogo (GET /sessoes/:sid)
// 1. authMiddleware: Garante que o usuário está logado e injeta req.user
// 2. extractUserId: Transfere req.user.uid para req.userId
router.get("/:sid", 
    authMiddleware,      
    extractUserId,       
    jogarSessaoGet
); 

// Rotas de Combate (POST /sessoes/:sid/combat/*)
// Todas precisam de autenticação e extração do userId
router.post("/:sid/combat/start", 
    authMiddleware, 
    extractUserId, 
    iniciarCombatePost
);

router.post("/:sid/combat/action", 
    authMiddleware, 
    extractUserId, 
    acaoCombatePost
);

router.post("/:sid/combat/finish", 
    authMiddleware, 
    extractUserId, 
    finalizarCombatePost
);

export default router;