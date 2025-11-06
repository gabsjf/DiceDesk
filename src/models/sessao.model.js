import { db } from "../config/firebase.js";
import { v4 as uuid } from "uuid"; 
import { FieldValue } from "firebase-admin/firestore";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helpers de Coleção ---
/**
 * Constrói a referência à coleção de sessões para um usuário específico.
 * Caminho: /artifacts/{appId}/users/{userId}/sessoes
 */
function getSessaoCollectionRef(userId) {
  if (!userId) throw new Error("userId é obrigatório para acessar sessões.");
  // Usando a sintaxe de notação de ponto (db.collection)
  return db.collection(`/artifacts/${appId}/users/${userId}/sessoes`);
}

/**
 * Constrói a referência a um documento de sessão específico.
 */
function getSessaoDocRef(userId, id) {
  if (!userId || !id) throw new Error("userId e id são obrigatórios.");
  // Usando a sintaxe de notação de ponto (db.collection().doc())
  return getSessaoCollectionRef(userId).doc(id);
}
// --- Fim Helpers de Coleção ---


export async function listarPorCampanha(userId, campanhaId) {
  // Usando a sintaxe de notação de ponto (collection.where)
  const q = getSessaoCollectionRef(userId)
    .where("campanhaId", "==", campanhaId)
    .orderBy("createdAt", "desc"); // Ordena pela data de criação
  
  const snapshot = await q.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function criar(userId, { campanhaId, titulo, capaUrl }) {
  if (!campanhaId) throw new Error("campanhaId é obrigatório para criar uma sessão.");

  const nova = { 
    campanhaId, 
    titulo, 
    capaUrl: capaUrl || null, 
    createdAt: FieldValue.serverTimestamp(),
    userId: userId // Adiciona o ID do usuário para segurança
  };
  
  // Usando a sintaxe de notação de ponto (collection.add)
  const docRef = await getSessaoCollectionRef(userId).add(nova);
  
  return { id: docRef.id, ...nova };
}

export async function remover(userId, id) {
  const docRef = getSessaoDocRef(userId, id);
  // Usando a sintaxe de notação de ponto (docRef.delete)
  await docRef.delete();
  return true;
}

export const SessaoModel = {
  listarPorCampanha,
  criar,
  remover,
};