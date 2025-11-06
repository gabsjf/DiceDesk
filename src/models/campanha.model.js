import { db } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";

// Variável global fornecida pelo Canvas/ambiente
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helpers de Coleção ---
/**
 * Constrói a referência à coleção de campanhas para um usuário específico.
 * Caminho: /artifacts/{appId}/users/{userId}/campanhas
 */
function getCampanhaCollectionRef(userId) {
  if (!userId) throw new Error("userId é obrigatório para acessar campanhas.");
  // Usando a sintaxe de notação de ponto (db.collection)
  return db.collection(`/artifacts/${appId}/users/${userId}/campanhas`);
}

/**
 * Constrói a referência a um documento de campanha específico.
 */
function getCampanhaDocRef(userId, id) {
  if (!userId || !id) throw new Error("userId e id são obrigatórios.");
  // Usando a sintaxe de notação de ponto (db.collection().doc())
  return getCampanhaCollectionRef(userId).doc(id);
}
// --- Fim Helpers de Coleção ---


// funções principais
export async function listar(userId) {
  const snapshot = await getCampanhaCollectionRef(userId).get();
  // Mapeia os documentos para incluir o ID e os dados
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function findById(userId, id) {
  const docRef = getCampanhaDocRef(userId, id);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }
  
  return { id: docSnap.id, ...docSnap.data() };
}

export async function atualizarPorId(userId, id, patch) {
  const docRef = getCampanhaDocRef(userId, id);
  
  // Remove o ID do patch, pois não queremos atualizar o ID
  const { id: _, ...updateData } = patch;
  
  // Usando a sintaxe de notação de ponto (docRef.update)
  await docRef.update(updateData);
  
  // Retorna a campanha atualizada
  const docSnap = await docRef.get();
  return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function atualizar(userId, patch) {
  if (!patch?.id) return null;
  return atualizarPorId(userId, patch.id, patch);
}

export async function create(userId, data) {
  // Se o ID for fornecido, usa .doc(id) para setDoc
  const docRef = data?.id 
    ? getCampanhaDocRef(userId, data.id) 
    : getCampanhaCollectionRef(userId).doc();
    
  const id = docRef.id;

  const campanha = {
    nome: data?.nome || "Nova campanha",
    sistema: data?.sistema || "",
    descricao: data?.descricao || "",
    capaUrl: data?.capaUrl || null,
    // Adiciona o ID do usuário ao documento (ótimo para regras de segurança)
    userId: userId,
    createdAt: FieldValue.serverTimestamp()
  };
  
  // Usando a sintaxe de notação de ponto (docRef.set)
  await docRef.set(campanha);
  
  return { id, ...campanha };
}

export async function remove(userId, id) {
  const docRef = getCampanhaDocRef(userId, id);
  // Usando a sintaxe de notação de ponto (docRef.delete)
  await docRef.delete();
  
  // Retornamos true se a operação for concluída sem erros.
  return true;
}

/**
 * Wrapper para compatibilidade
 */
export const CampanhaModel = {
  listar,
  findById,
  atualizarPorId,
  atualizar,
  create,
  remove,
  findAll: listar,
  campanhas: null // Removido, pois o array em memória não existe mais
};