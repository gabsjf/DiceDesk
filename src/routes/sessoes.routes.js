import express from 'express';
import * as sessaoController from '../controllers/sessao.controller.js';

// Importa os 3 middlewares
import { 
  authMiddleware, 
  checkAuthStatus, 
  extractUserId 
} from '../middlewares/auth.middleware.js';

// 🛑 DESTA VEZ VAI FUNCIONAR 🛑
console.log("--- ✅ v3 DO sessoes.routes.js FOI LIDA ---");

const router = express.Router();

// Rota GET (para carregar a página)
router.get(
  '/:sid',
  authMiddleware,  // 1. Força login
  extractUserId,   // 2. Pega o userId
  sessaoController.jogarSessaoGet 
);

// Rota POST (para iniciar o combate)
router.post(
  '/:sid/combat/start',
  checkAuthStatus,  // 1. Verifica o cookie
  extractUserId,    // 2. 🛑 GARANTE QUE ELE SEJA EXECUTADO 🛑
  sessaoController.iniciarCombatePost // 3. Roda o controller
);

// Outras rotas POST
router.post(
  '/:sid/combat/action',
  authMiddleware,
  extractUserId,   
  sessaoController.acaoCombatePost
);

router.post(
  '/:sid/combat/finish',
  authMiddleware,
  extractUserId,   
  sessaoController.finalizarCombatePost
);

export default router;