import express from 'express';
import * as sessaoController from '../controllers/sessao.controller.js';
import { uploadProcess } from '../middlewares/upload.middleware.js'; // ⬅️ Assumindo que você tem isso

// Importa os TRÊS middlewares de autenticação
import { 
  authMiddleware, 
  checkAuthStatus, 
  extractUserId 
} from '../middlewares/auth.middleware.js';

const router = express.Router();

/*
 * ============================================
 * Rotas de Gerenciamento (Formulários POST que redirecionam)
 * ============================================
 */

// POST /campanhas/:id/sessoes
// (Cria uma sessão - vem de um form, então usa 'authMiddleware')
router.post(
  '/campanhas/:id/sessoes',
  authMiddleware,  // 1. Força login (redireciona se falhar)
  extractUserId,   // 2. Pega o userId
  uploadProcess,   // 3. Processa o upload (se houver)
  sessaoController.criarSessaoPost
);

// POST /campanhas/:id/sessoes/:sid/apagar
// (Apaga uma sessão - vem de um form, então usa 'authMiddleware')
router.post(
  '/campanhas/:id/sessoes/:sid/apagar',
  authMiddleware,  // 1. Força login (redireciona se falhar)
  extractUserId,   // 2. Pega o userId
  sessaoController.apagarSessaoPost
);


/*
 * ============================================
 * Rotas de Jogo (Carregamento de Página e API)
 * ============================================
 */

// GET /sessoes/:sid
// (Carrega a página de jogo - usa 'authMiddleware' para proteger a página)
router.get(
  '/sessoes/:sid',
  authMiddleware,  // 1. Força login (redireciona se falhar)
  extractUserId,   // 2. Pega o userId
  sessaoController.jogarSessaoGet
);

// POST /sessoes/:sid/combat/start
// (Inicia o combate - É um 'fetch'!)
// 🛑 ESTA É A MUDANÇA PRINCIPAL 🛑
router.post(
  '/sessoes/:sid/combat/start',
  checkAuthStatus,  // 1. APENAS verifica o login (NÃO redireciona)
  extractUserId,    // 2. Retorna erro JSON 401 se 'checkAuthStatus' falhar
  sessaoController.iniciarCombatePost // 3. Roda o controller
);

// POST /sessoes/:sid/combat/action
// (Ação de combate - No seu EJS, isso é um <form post>, não um fetch)
router.post(
  '/sessoes/:sid/combat/action',
  authMiddleware,  // 1. Força login (redireciona se falhar)
  extractUserId,   // 2. Pega o userId
  sessaoController.acaoCombatePost
);

// POST /sessoes/:sid/combat/finish
// (Finaliza combate - No seu EJS, isso é um <form post>, não um fetch)
router.post(
  '/sessoes/:sid/combat/finish',
  authMiddleware,  // 1. Força login (redireciona se falhar)
  extractUserId,   // 2. Pega o userId
  sessaoController.finalizarCombatePost
);


export default router;