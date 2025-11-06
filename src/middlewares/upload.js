// src/middlewares/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Pasta de uploads na raiz do projeto (../uploads em relação a este arquivo)
const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

// Garante que a pasta exista
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage com nome de arquivo seguro
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

// Filtra somente imagens comuns
const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WEBP ou GIF."));
};

// Limites (ex.: 5MB)
const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

// Export default para combinar com: import upload from "../middlewares/upload.js";
export default upload;

// Export opcional da constante, se quiser usar em outro lugar
export { UPLOAD_DIR };
