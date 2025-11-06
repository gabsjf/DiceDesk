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
import { uploadImage } from "../middlewares/upload.js"; // middleware de upload (capa/imagens)

const router = Router();

/**
 * Middleware para injetar o userId na requisição.
 * O userId deve ser injetado previamente pelo authMiddleware em req.user.uid.
 */
function extractUserId(req, res, next) {
  // O ID do usuário (uid) é esperado do Firebase Admin SDK
  // Nota: A propriedade pode ser 'uid' ou 'sub' dependendo de como você configura req.user no auth.middleware.
  const userId = req.user?.uid || req.user?.sub; 
  
  if (!userId) {
    // Se o middleware de auth falhou em injetar, deve haver um erro, 
    // mas por segurança, redireciona ou retorna erro 403.
    console.error("Erro: userId ausente na requisição protegida.");
    return res.status(403).send("Acesso negado. Usuário não identificado.");
  }
  
  // Injeta o userId para os controllers usarem
  req.userId = userId;
  next();
}


/** Injeta variável para views que esperam csrfToken */
function attachCsrf(_req, res, next) {
  res.locals.csrfToken = "";
  next();
}

/* ===== Campanhas ===== */
// Aplica extractUserId a todas as rotas que precisam do banco de dados
router.get("/", extractUserId, index);

router.get("/criar", attachCsrf, criarGet); // O userId será injetado nos controllers
// upload da capa da campanha: campo "capa"
router.post("/criar", extractUserId, uploadImage.single("capa"), criarPost);

router.get("/:id", extractUserId, attachCsrf, detalhes);

router.get("/:id/editar", extractUserId, attachCsrf, editarGet);
// upload opcional de nova capa: campo "capa"
router.post("/:id/editar", extractUserId, uploadImage.single("capa"), editarPost);

router.get("/:id/apagar", extractUserId, attachCsrf, apagarGet);
router.post("/:id/apagar", extractUserId, apagarPost);

/* ===== Sessões dentro da campanha ===== */
// upload opcional da imagem da sessão: campo "imagem"
router.post("/:id/sessoes", extractUserId, uploadImage.single("imagem"), criarSessaoPost);

router.post("/:id/sessoes/:sid/apagar", extractUserId, apagarSessaoPost);

export default router;