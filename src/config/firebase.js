// src/config/firebase.js
import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";

// Identificador do app (seu código usa em caminhos do Firestore)
export const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

let serviceAccount = null;

// 1) Carrega credenciais
if (process.env.FIREBASE_CREDENTIALS) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } catch (e) {
    console.error("ERRO CRÍTICO: FIREBASE_CREDENTIALS não é JSON válido.", e);
  }
} else if (process.env.SERVICE_ACCOUNT_PATH) {
  try {
    const fileContent = fs.readFileSync(process.env.SERVICE_ACCOUNT_PATH, "utf8");
    serviceAccount = JSON.parse(fileContent);
  } catch (e) {
    console.error("ERRO CRÍTICO: Falha ao ler SERVICE_ACCOUNT_PATH.", e);
  }
}

if (!serviceAccount || !serviceAccount.project_id) {
  console.error("ERRO FATAL: Service Account inválida/ausente. Verifique FIREBASE_CREDENTIALS ou SERVICE_ACCOUNT_PATH.");
  process.exit(1);
}

const projectId = serviceAccount.project_id;

// 2) **Bucket correto**
const bucketName =
  process.env.FIREBASE_STORAGE_BUCKET && process.env.FIREBASE_STORAGE_BUCKET.trim()
    ? process.env.FIREBASE_STORAGE_BUCKET.trim()
    : `${projectId}.appspot.com`; // ✅ este é o padrão correto para GCS

let adminApp;
try {
  adminApp = getApp();
} catch {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId,
    storageBucket: bucketName,
  });
}

const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);
const storage = getStorage(adminApp);
const bucket = storage.bucket(bucketName);

// Log leve para debug no Render
console.log("[Firebase Admin] inicializado", { projectId, storageBucket: bucket.name });

export { db, adminAuth, adminApp, bucket };
