// src/middlewares/storage.middleware.js

import { getStorage } from "firebase-admin/storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Inicializa o Firebase Storage (usa a instância default do firebase.js)
const bucket = getStorage().bucket(); 

/**
 * Middleware de upload customizado usando Multer e Firebase Storage.
 *
 * Ele intercepta o buffer do arquivo e o envia diretamente para o Firebase Storage.
 * Ele define o campo 'capaUrl' ou 'imagemUrl' na requisição (req.file.path),
 * que será o URL público do Firebase Storage.
 */

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
  if (!req.file) {
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
    // Garante que o arquivo seja acessível publicamente (se a permissão do bucket permitir)
    public: true 
  });

  blobStream.on('error', (error) => {
    console.error("Erro ao fazer upload para o Firebase Storage:", error);
    // Remove o arquivo do buffer em caso de erro
    next(new Error("Falha ao salvar o arquivo."));
  });

  blobStream.on('finish', async () => {
    // 1. Torna o arquivo publicamente acessível (se ainda não estiver)
    await fileUpload.makePublic();

    // 2. Obtém o URL de acesso público (Google Cloud Storage URL)
    // Este URL substitui o caminho local /uploads/...
    file.path = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    // Injeta o path no corpo da requisição para uso posterior (ex: no controller)
    req.body.capaUrl = file.path; 
    
    next();
  });

  // Envia o buffer do arquivo para o Firebase Storage
  blobStream.end(file.buffer);
}

// Exporta o Multer configurado para uso nos roteadores
export { uploadToStorage };