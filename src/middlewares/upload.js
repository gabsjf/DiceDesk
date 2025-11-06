// src/middlewares/upload.js
import multer from "multer";
import { processUpload } from "./storage.middleware.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error("Tipo de arquivo não suportado. Use PNG, JPG, WEBP ou GIF."));
};

const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

function uploadImageChain(fieldName, folder = "uploads") {
  return [upload.single(fieldName), processUpload(folder)];
}

export default upload;
export { processUpload, uploadImageChain };
