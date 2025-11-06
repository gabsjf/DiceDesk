// src/middlewares/storage.middleware.js
import { bucket } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Faz upload do arquivo já carregado em memória pelo Multer para o Firebase Storage.
 * - folder: subpasta no bucket (ex.: "capas", "sessoes")
 * Saídas no req:
 * - req.fileUrl  -> URL pública do arquivo
 * - req.filePath -> caminho dentro do bucket
 */
export function processUpload(folder = "uploads") {
  return async (req, res, next) => {
    try {
      // Se a rota não recebeu arquivo, segue o fluxo sem erro
      if (!req.file) return next();

      const { originalname, buffer, mimetype } = req.file;
      // nome único: timestamp + uuid + extensão
      const ext = (originalname?.split(".").pop() || "bin").toLowerCase();
      const uniqueName = `${Date.now()}-${uuidv4()}.${ext}`;
      const targetPath = `${folder}/${uniqueName}`;

      const file = bucket.file(targetPath);

      // Salva o arquivo (upload simples)
      await file.save(buffer, {
        metadata: { contentType: mimetype, cacheControl: "public, max-age=31536000" },
        resumable: false
      });

      // Torna público
      await file.makePublic();

      // URL pública (CDN do GCS)
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(targetPath)}`;

      // Expõe no req para o controller usar
      req.fileUrl = publicUrl;
      req.filePath = targetPath;

      return next();
    } catch (err) {
      console.error("Erro ao enviar arquivo para o Firebase Storage:", err);
      // Não exploda o fluxo inteiro: retorne 500 ou chame next(err) conforme seu padrão
      return res.status(500).send("Falha ao salvar o arquivo no Storage.");
    }
  };
}
