// src/config/firebase.js

import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Certifique-se de que a variável de ambiente FIREBASE_CREDENTIALS
// contenha o JSON do service account.
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");

// Extrai o Project ID do JSON secreto
const projectId = serviceAccount.project_id; 

let adminApp;

try {
  // Tenta obter o app existente
  adminApp = getApp();
} catch (e) {
  // Inicializa se não existir, passando o project ID explicitamente
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId, 
  });
}

const db = getFirestore(adminApp);
// 🚨 NOVO: Obtém a instância do Auth
const adminAuth = getAuth(adminApp); 

// EXPORTAÇÃO AJUSTADA: Exporta o serviço de Autenticação como adminAuth
export { db, adminAuth };