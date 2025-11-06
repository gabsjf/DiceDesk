// src/middlewares/upload.js

// O Multer deve ser configurado para armazenar em memória (buffer)
// para que o Firebase Storage possa acessá-lo.
import multer from "multer";
import { processUpload } from "./storage.middleware.js"; // Importa a função de upload para o Firebase

// 1. Configura o Multer para usar a memória (Memory Storage)
// Isso é crucial para ambientes de nuvem/serverless.
const storage = multer.memoryStorage();

// 2. Filtra somente imagens comuns
const fileFilter = (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WEBP ou GIF."));
};

// 3. Limites (ex.: 5MB)
const limits = { fileSize: 5 * 1024 * 1024 };

// 4. Cria a instância do Multer (upload)
const upload = multer({ storage, fileFilter, limits });

// Export default: Instância do Multer para uso nas rotas (Ex: upload.single('capa'))
export default upload;

// Exporta o processUpload separadamente para ser chamado logo após o Multer na rota
export { processUpload };