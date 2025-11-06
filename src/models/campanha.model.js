// src/models/campanha.model.js
import { db } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";

// Fonte do appId: tenta variável global do Canvas, cai para ENV, depois um default.
const appId =
  (typeof __app_id !== "undefined" && __app_id) ||
  process.env.APP_ID ||
  "default-app-id";

/* =========================================
   Helpers de referências (encadeadas)
   Caminho: artifacts/{appId}/users/{userId}/campanhas/{id}
========================================= */

function getCampanhaCollectionRef(userId) {
  if (!userId) throw new Error("userId é obrigatório para acessar campanhas.");
  return db
    .collection("artifacts")
    .doc(appId)
    .collection("users")
    .doc(userId)
    .collection("campanhas");
}

function getCampanhaDocRef(userId, id) {
  if (!userId || !id) throw new Error("userId e id são obrigatórios.");
  return getCampanhaCollectionRef(userId).doc(id);
}

/* =========================================
   Operações principais
========================================= */

// Lista todas as campanhas do usuário
export async function listar(userId) {
  const snapshot = await getCampanhaCollectionRef(userId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Busca uma campanha por id
export async function findById(userId, id) {
  const docRef = getCampanhaDocRef(userId, id);
  const snap = await docRef.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// Atualiza parcialmente por id
export async function atualizarPorId(userId, id, patch) {
  const docRef = getCampanhaDocRef(userId, id);

  // Não permitir sobrescrever id no doc
  const { id: _ignored, createdAt: _c, ...rest } = patch || {};
  const updateData = {
    ...rest,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(updateData, { merge: true });
  const snap = await docRef.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// Compat: atualizar(obj) que contém .id
export async function atualizar(userId, patch) {
  if (!patch?.id) return null;
  return atualizarPorId(userId, patch.id, patch);
}

// Cria uma campanha
export async function create(userId, data) {
  const col = getCampanhaCollectionRef(userId);
  const docRef = data?.id ? col.doc(String(data.id)) : col.doc(); // permite id customizado se vier
  const id = docRef.id;

  const campanha = {
    nome: data?.nome || "Nova campanha",
    sistema: data?.sistema || "",
    descricao: data?.descricao || "",
    capaUrl: data?.capaUrl || null,
    sessoes: Array.isArray(data?.sessoes) ? data.sessoes : [],
    userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(campanha, { merge: false });
  return { id, ...campanha };
}

// Remove uma campanha
export async function remove(userId, id) {
  const docRef = getCampanhaDocRef(userId, id);
  await docRef.delete();
  return true;
}

/* =========================================
   Wrapper para compatibilidade com controllers
========================================= */

export const CampanhaModel = {
  listar,
  findById,
  atualizarPorId,
  atualizar,
  // solicitado pelo controller:
  async update(userId, id, patch) {
    return atualizarPorId(userId, id, patch);
  },
  create,
  remove,
  findAll: listar,
  // não usamos array em memória
  campanhas: null,
};
