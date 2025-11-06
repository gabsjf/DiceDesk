// src/middlewares/storage.middleware.js

import { getStorage } from "firebase-admin/storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
// Importa a instância de adminApp para garantir que o storage seja inicializado
import { adminApp } from "../config/firebase.js"; 

// Lê o nome do bucket da variável de ambiente
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'default-bucket.appspot.com'; 

// Usa a instância de adminApp e o nome do bucket para inicializar o Storage
const bucket = getStorage(adminApp).bucket(bucketName); 

// Configuração do Multer para armazenar em memória (buffer) antes do Storage
const storage = multer.memoryStorage();

// Cria a instância do Multer que usaremos
const uploadToStorage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

/**
 * Função que faz o upload real do arquivo para o Firebase Storage.
 * @param {Express.Request} req - Objeto de requisição do Express.
 * @param {Express.Response} res - Objeto de resposta do Express.
 * @param {Function} next - Próximo middleware.
 */
export function processUpload(req, res, next) {
  
  // Se o upload for opcional e não houver arquivo, segue em frente
  if (!req.file) {
    // Note: Deixamos o Multer preencher o req.body.capaUrl com 'null'
    // Se o Multer não preencheu req.body, a propriedade será undefined,
    // mas o controller deve lidar com isso.
    return next();
  }

  const file = req.file;
  
  // Cria um nome de arquivo único para o Storage
  const uniqueFileName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
  
  // Define o caminho no Storage: 'uploads/unique-name.jpg'
  const filePath = `uploads/${uniqueFileName}`;
  
  // Cria uma referência ao arquivo no bucket
  const fileUpload = bucket.file(filePath);

  // Cria um stream de escrita para o Firebase Storage
  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    // Garante que o arquivo seja acessível publicamente
    public: true 
  });

  blobStream.on('error', (error) => {
    console.error("Erro ao fazer upload para o Firebase Storage:", error);
    // Retorna o erro imediatamente ao Express
    next(new Error(`Falha no upload: ${error.message}`)); 
  });

  blobStream.on('finish', async () => {
    try {
      // 1. Torna o arquivo publicamente acessível (se necessário)
      await fileUpload.makePublic();

      // 2. Obtém o URL de acesso público (Google Cloud Storage URL)
      // Usa o nome do bucket para construir o URL público
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
      
      // Injeta o URL público no corpo da requisição para uso no controller
      // O Multer já injetou req.body, então isso é seguro.
      req.body.capaUrl = publicUrl; 
      
      next();
    } catch (error) {
      console.error("Erro ao finalizar upload ou obter URL pública:", error);
      next(new Error("Falha ao obter URL pública do arquivo."));
    }
  });

  // Envia o buffer do arquivo para o Firebase Storage
  blobStream.end(file.buffer);
}

export { uploadToStorage };