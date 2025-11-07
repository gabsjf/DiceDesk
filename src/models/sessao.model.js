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

/**
 * Busca uma sessão pelo ID e pelo ID do usuário mestre.
 */
export async function findById(userId, id) {
  const docRef = getSessaoDocRef(userId, id);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }
  
  return { id: docSnap.id, ...docSnap.data() };
}


export async function listarPorCampanha(userId, campanhaId) {
  // NOTA: Esta consulta requer um índice composto no Firestore (campanhaId + createdAt)
  const q = getSessaoCollectionRef(userId)
    .where("campanhaId", "==", campanhaId);
    // .orderBy("createdAt", "desc"); // Removido para evitar erro de índice na nuvem
  
  const snapshot = await q.get();
  
  // Ordenação via JS para contornar o erro de índice no Firestore
  const sessoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Ordena por data de criação (createdAt) de forma decrescente
  return sessoes.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
}

export async function criar(userId, payload) {
  if (!payload.campanhaId) throw new Error("campanhaId é obrigatório para criar uma sessão.");

  const nova = { 
    campanhaId: payload.campanhaId, 
    titulo: payload.titulo, 
    descricao: payload.descricao || null,
    capaUrl: payload.capaUrl || null, 
    combat: null, // Novo campo: Combate inicializado como null
    createdAt: FieldValue.serverTimestamp(),
    userId: userId 
  };
  
  const docRef = await getSessaoCollectionRef(userId).add(nova);
  
  return { id: docRef.id, ...nova };
}

export async function remover(userId, id) {
  const docRef = getSessaoDocRef(userId, id);
  await docRef.delete();
  return true;
}

/**
 * 🎯 NOVA FUNÇÃO: Ativa o combate na sessão, salvando a ordem de iniciativa.
 */
export async function ativarCombate(userId, id, combatPayload) {
  const docRef = getSessaoDocRef(userId, id);

  // Usa .update() para modificar apenas o campo 'combat'
  await docRef.update({
    combat: combatPayload,
    updatedAt: FieldValue.serverTimestamp() // Opcional, mas útil
  });
  
  return true; 
}

/**
 * Atualiza campos específicos de uma sessão usando "dot notation".
 */
export async function atualizarCampos(userId, id, campos) {
  if (!userId || !id || !campos) {
    throw new Error("userId, id e campos são obrigatórios para atualizar.");
  }
  
  const docRef = getSessaoDocRef(userId, id);
  await docRef.update(campos);
  return true;
}


export const SessaoModel = {
  listarPorCampanha,
  criar,
  remover,
  findById, 
  ativarCombate,
  atualizarCampos // ✅ Está aqui!
};