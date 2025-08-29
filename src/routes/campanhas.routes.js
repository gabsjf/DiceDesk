import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

import {
  index, criarGet, criarPost, detalhes,
  editarGet, editarPost, apagarGet, apagarPost
} from "../controllers/campanha.controller.js";
import { criarSessaoPost } from "../controllers/sessao.controller.js";

const router = Router({ mergeParams: true });

/* ===== Multer inline (sem importar de middlewares) ===== */
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
/* ======================================================= */

// Campanhas (CRUD)
router.get("/", index);
router.get("/criar", criarGet);
router.post("/criar", criarPost);
router.get("/:id", detalhes);
router.get("/editar/:id", editarGet);
router.post("/editar/:id", editarPost);
router.get("/apagar/:id", apagarGet);
router.post("/apagar/:id", apagarPost);

// Sessões (criar via modal)
router.post("/:id/sessoes", upload.single("imagem"), criarSessaoPost);

export default router;
