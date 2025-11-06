// src/config/firebase.js

import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from 'fs'; // 👈 IMPORTANTE: Importar o módulo nativo 'fs'

// 1. OBTÉM O CAMINHO DO ARQUIVO JSON
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH; 

let serviceAccount = {};

try {
    if (!serviceAccountPath) {
        throw new Error("Variável SERVICE_ACCOUNT_PATH não está definida no .env!");
    }

    // 2. LÊ O CONTEÚDO DO ARQUIVO USANDO O CAMINHO
    const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
    
    // 3. FAZ O PARSE DO CONTEÚDO PARA UM OBJETO JAVASCRIPT
    serviceAccount = JSON.parse(fileContent);

} catch (error) {
    console.error("ERRO CRÍTICO: Falha ao carregar credenciais do Firebase.");
    console.error(`Caminho usado: ${serviceAccountPath}`);
    console.error(`Detalhes: ${error.message}`);
    // Garante que a aplicação falhe se a credencial não puder ser carregada
    process.exit(1); 
}

// O restante do seu código pode permanecer o mesmo:
const projectId = serviceAccount.project_id; 

let adminApp;

try {
  // Tenta obter o app existente
  adminApp = getApp();
} catch (e) {
  // Inicializa se não existir
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId, 
  });
}

const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp); 

export { db, adminAuth };