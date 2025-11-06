import { Router } from "express";
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
// 🚨 CORREÇÃO 1: Importa o uploadImage (default) E o processUpload (nomeado)
import uploadImage, { processUpload } from "../middlewares/upload.js"; 
import { extractUserId } from "../middlewares/auth.middleware.js"; // Importa o extrator

const router = Router();

/** Injeta variável para views que esperam csrfToken */
function attachCsrf(_req, res, next) {
  res.locals.csrfToken = "";
  next();
}

/* * ATENÇÃO: As rotas protegidas abaixo usam o extractUserId explicitamente 
 * para garantir que o ID do usuário seja injetado antes do Multer.
 */

/* ===== 1. Rotas de Listagem e Criação ===== */
router.get("/", index); // /campanhas/
router.get("/criar", attachCsrf, criarGet); // /campanhas/criar
// 🚨 CORREÇÃO 2: Adiciona processUpload para enviar para o Firebase Storage
router.post("/criar", extractUserId, uploadImage.single("capa"), processUpload, criarPost);

/* ===== 2. Rotas de Detalhes (Deve ser a última rota que usa apenas /:id) ===== */
router.get("/:id", extractUserId, attachCsrf, detalhes); 

/* ===== 3. Rotas de Edição e Remoção ===== */

// Rotas /campanhas/:id/editar
router.get("/:id/editar", extractUserId, attachCsrf, editarGet); 
// 🚨 CORREÇÃO 3: Adiciona processUpload
router.post("/:id/editar", extractUserId, uploadImage.single("capa"), processUpload, editarPost);

// Rotas /campanhas/:id/apagar
router.get("/:id/apagar", extractUserId, attachCsrf, apagarGet); 
router.post("/:id/apagar", extractUserId, apagarPost);


/* ===== 4. Rotas de Sessões (Ações Aninhadas) ===== */

// Criar Sessão (POST /campanhas/:id/sessoes)
// CRUCIAL: extractUserId deve vir antes do Multer.
// 🚨 CORREÇÃO 4: Adiciona processUpload
router.post("/:id/sessoes", extractUserId, uploadImage.single("imagem"), processUpload, criarSessaoPost);

// Apagar Sessão (POST /campanhas/:id/sessoes/:sid/apagar)
router.post("/:id/sessoes/:sid/apagar", extractUserId, apagarSessaoPost);


export default router;