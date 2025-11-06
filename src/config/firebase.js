// src/config/firebase.js
import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";

export const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

let serviceAccount = null;

// Carrega credenciais
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
  console.error("ERRO FATAL: Service Account inválida/ausente.");
  process.exit(1);
}

const projectId = serviceAccount.project_id;

// NORMALIZA bucket vindo da env (aceita gs:// e firebasestorage.app, mas converte)
function normalizeBucketName(raw, projectId) {
  if (!raw || !raw.trim()) return `${projectId}.appspot.com`;
  let v = raw.trim();

  if (v.startsWith("gs://")) v = v.replace(/^gs:\/\//, "");
  // se vier "wyvwern-xxxx.firebasestorage.app" → converte para appspot.com
  if (v.endsWith(".firebasestorage.app")) {
    v = `${projectId}.appspot.com`;
  }
  return v;
}

const bucketName = normalizeBucketName(process.env.FIREBASE_STORAGE_BUCKET, projectId);

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

// Valida o bucket no boot (log amigável no Render)
(async () => {
  try {
    // Apenas tenta pegar metadados; se não existir, vai cair no catch
    await bucket.getMetadata();
    console.log("[Firebase Admin] inicializado", {
      projectId,
      storageBucket: bucket.name,
    });
  } catch (e) {
    console.error(
      "❌ Bucket inválido/inexistente. Use SEMPRE '<projectId>.appspot.com'. Atual:",
      bucket.name,
      "\nErro:",
      e?.message || e
    );
  }
})();

export { db, adminAuth, adminApp, bucket };
