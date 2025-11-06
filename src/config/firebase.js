// src/config/firebase.js
import 'dotenv/config';
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';

// Variável global do Canvas/ambiente (caso exista)
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==============================
// 1) Carrega Service Account
// ==============================
let serviceAccount = null;

if (process.env.FIREBASE_CREDENTIALS) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } catch (e) {
    console.error('ERRO CRÍTICO: FIREBASE_CREDENTIALS não é JSON válido.', e);
  }
} else if (process.env.SERVICE_ACCOUNT_PATH) {
  try {
    const fileContent = fs.readFileSync(process.env.SERVICE_ACCOUNT_PATH, 'utf8');
    serviceAccount = JSON.parse(fileContent);
  } catch (e) {
    console.error('ERRO CRÍTICO: Falha ao ler SERVICE_ACCOUNT_PATH.', e);
  }
}

if (!serviceAccount || !serviceAccount.project_id) {
  console.error('ERRO FATAL: Service Account inválida/ausente. Configure FIREBASE_CREDENTIALS ou SERVICE_ACCOUNT_PATH.');
  process.exit(1);
}

const projectId = serviceAccount.project_id;

// ==============================
// 2) Resolve o bucket de Storage
// ==============================
// Dê preferência a FIREBASE_STORAGE_BUCKET;
// se não existir, caia no padrão do Firebase (PROJECT_ID.appspot.com)
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET && process.env.FIREBASE_STORAGE_BUCKET.trim()
    ? process.env.FIREBASE_STORAGE_BUCKET.trim()
    : `${projectId}.appspot.com`;

// Dica importante:
// - O **ID do bucket** geralmente é PROJECT_ID.appspot.com.
// - Domínios como *.firebasestorage.app são para servir arquivos, não para nome do bucket.
// - Se der 404 "bucket does not exist", verifique no Console do Firebase > Storage se o bucket foi inicializado
//   e copie exatamente o **ID do bucket** mostrado lá.

// ==============================
// 3) Inicializa o Admin App (singleton)
// ==============================
let adminApp;
try {
  adminApp = getApp();
} catch {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId,
    storageBucket, // <- usa o bucket resolvido
  });

  // Log leve para diagnosticar em dev
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Firebase Admin] inicializado', {
      projectId,
      storageBucket,
    });
  }
}

// ==============================
// 4) Exports (Firestore/Auth/Storage)
// ==============================
const db = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);
const storage = getStorage(adminApp);
const bucket = storage.bucket(); // já aponta para `storageBucket`

export { db, adminAuth, storage, bucket, adminApp, projectId };
export default adminApp;
