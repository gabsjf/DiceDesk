// src/routes/campanhas.routes.js
import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import csrf from "csurf";
import { fileURLToPath } from "url";

import {
  index, criarGet, criarPost, detalhes,
  editarGet, editarPost, apagarGet, apagarPost
} from "../controllers/campanha.controller.js";

import { criarSessaoPost, apagarSessaoPost } from "../controllers/sessao.controller.js";

const router = Router({ mergeParams: true });

/* ===== Multer inline ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    cb(null, base + ext);
  }
});
const upload = multer({ storage });

/* ===== CSRF por rota (cookie-based) ===== */
const csrfProtection = csrf({
  cookie: {
    key: "_csrf",         
    sameSite: "lax",
    httpOnly: true        
  }
});

// Helper para injetar token após csrfProtection
const attachCsrf = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

/* ===== Campanhas (CRUD) ===== */
router.get("/", index);

/* criar */
router.get("/criar", csrfProtection, attachCsrf, criarGet);
router.post("/criar", csrfProtection, criarPost);

/* detalhes (tem formulário no modal) */
router.get("/:id", csrfProtection, attachCsrf, detalhes);

/* editar */
router.get("/editar/:id", csrfProtection, attachCsrf, editarGet);
router.post("/editar/:id", csrfProtection, editarPost);

/* apagar */
router.get("/apagar/:id", apagarGet);
router.post("/apagar/:id", csrfProtection, apagarPost);

/* Sessões (POST multipart: multer ANTES do csurf!) */
router.post("/:id/sessoes", upload.single("imagem"), csrfProtection, criarSessaoPost);
router.post("/:id/sessoes/:sid/apagar", csrfProtection, apagarSessaoPost);

export default router;
