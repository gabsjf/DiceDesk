// src/middlewares/storage.middleware.js
import { bucket } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Sobe arquivo (já em memória pelo Multer) para o Firebase Storage.
 * - folder: subpasta no bucket (ex.: "capas", "sessoes").
 * Seta em req: fileUrl (pública) e filePath (no bucket).
 */
export function processUpload(folder = "uploads") {
  return async (req, res, next) => {
    try {
      if (!req.file) return next(); // sem arquivo, segue

      const { originalname, buffer, mimetype } = req.file;
      const ext = (originalname?.split(".").pop() || "bin").toLowerCase();
      const unique = `${Date.now()}-${uuidv4()}.${ext}`;
      const targetPath = `${folder}/${unique}`;

      const file = bucket.file(targetPath);

      await file.save(buffer, {
        metadata: { contentType: mimetype, cacheControl: "public, max-age=31536000" },
        resumable: false,
      });

      await file.makePublic();

      req.fileUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(targetPath)}`;
      req.filePath = targetPath;
      return next();
    } catch (err) {
      console.error("Erro ao enviar arquivo para o Storage:", err);
      // responde 500 para não travar a requisição
      return res.status(500).send("Falha ao salvar o arquivo no Storage.");
    }
  };
}
