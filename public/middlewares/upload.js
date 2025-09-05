// src/middlewares/upload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Vamos salvar em /public/uploads (já servido como estático pelo app)
const uploadDir = path.resolve(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname || "").toLowerCase();
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, base + ext);
  }
});

const upload = multer({ storage });

// 🔑 Export default (combina com `import upload from ...`)
export default upload;
