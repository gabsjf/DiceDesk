// src/config/firebase.js

import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from 'fs';

// Variável global fornecida pelo Canvas/ambiente
// Esta variável é necessária para a construção dos caminhos do Firestore (segurança)
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


let serviceAccount = null;

// --- ESTRATÉGIA DE CARREGAMENTO DE CREDENCIAIS ---
// Tenta carregar o JSON do service account em ordem de prioridade:
// 1. Variável de ambiente FIREBASE_CREDENTIALS (usado no Render/GCP)
// 2. Caminho do arquivo SERVICE_ACCOUNT_PATH (usado localmente)

if (process.env.FIREBASE_CREDENTIALS) {
    // 1. Prioridade: Credenciais como string JSON completa (ambiente de nuvem)
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } catch (e) {
        console.error("ERRO CRÍTICO: FIREBASE_CREDENTIALS não é um JSON válido.", e);
    }
} else if (process.env.SERVICE_ACCOUNT_PATH) {
    // 2. Alternativa: Credenciais via caminho do arquivo (ambiente local)
    try {
        const fileContent = fs.readFileSync(process.env.SERVICE_ACCOUNT_PATH, 'utf8');
        serviceAccount = JSON.parse(fileContent);
    } catch (e) {
        console.error("ERRO CRÍTICO: Falha ao ler arquivo de Service Account.", e);
        serviceAccount = null;
    }
}


if (!serviceAccount || !serviceAccount.project_id) {
    // Se a Service Account não puder ser carregada, a aplicação não pode iniciar
    console.error("ERRO FATAL: O objeto de Service Account é inválido ou ausente. Verifique FIREBASE_CREDENTIALS ou SERVICE_ACCOUNT_PATH.");
    process.exit(1); 
}

// Extrai o Project ID do JSON secreto
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
    // Garante que o storage também use o ID
    storageBucket: `${projectId}.appspot.com`
  });
}

const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp); 

// EXPORTAÇÃO AJUSTADA: Exporta o serviço de Autenticação como adminAuth
export { db, adminAuth };