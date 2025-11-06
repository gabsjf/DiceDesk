// src/middlewares/upload.js
import multer from "multer";
import { processUpload } from "./storage.middleware.js";

// 1) Multer em memória
const storage = multer.memoryStorage();

// 2) Filtro: só imagens
const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WEBP ou GIF."));
};

// 3) Limite: 5MB
const limits = { fileSize: 5 * 1024 * 1024 };

// 4) Instância padrão (você pode usar direto se quiser)
const upload = multer({ storage, fileFilter, limits });

// 5) Helper para criar a cadeia completa por campo
//    Ex.: router.post('/criar', uploadImageChain('capa', 'capas'), controller)
function uploadImageChain(fieldName, folder = "uploads") {
  // retorna um array de middlewares na ordem correta
  return [upload.single(fieldName), processUpload(folder)];
}

export default upload;
export { processUpload, uploadImageChain };
