// src/middlewares/upload.js

import multer from "multer";
import { processUpload } from "./storage.middleware.js"; // Importa a função de upload para o Firebase

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WEBP ou GIF."));
};
const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

// Export default para uso simples em rotas (upload.single, etc.)
export default upload;

// Exporta processUpload para encadeamento manual
export { processUpload };