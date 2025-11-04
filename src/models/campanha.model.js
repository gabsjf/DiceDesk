// src/models/campanha.model.js

// banco em memória único do processo
const _db = [
  { id: "1", nome: "A Crônica do Reino Perdido", sistema: "Dungeons & Dragons 5e", descricao: "Uma aventura épica em um reino mágico.", capaUrl: null, sessoes: [] },
  { id: "2", nome: "A Ascensão de Cthulhu", sistema: "Chamado de Cthulhu", descricao: "Uma investigação sombria sobre cultos e horrores.", capaUrl: null, sessoes: [] }
];

// expõe o array para leituras diretas quando necessário
export const campanhas = _db;

function toIdLike(v) { return String(v); }
function nextId() {
  return String(_db.length ? Math.max(..._db.map(c => Number(c.id) || 0)) + 1 : 1);
}

// funções principais
export function listar() {
  return _db;
}

export function findById(id) {
  const key = toIdLike(id);
  return _db.find(c => toIdLike(c.id) === key) || null;
}

export function atualizarPorId(id, patch) {
  const key = toIdLike(id);
  const idx = _db.findIndex(c => toIdLike(c.id) === key);
  if (idx < 0) return null;
  _db[idx] = { ..._db[idx], ...patch };
  return _db[idx];
}

export function atualizar(patch) {
  if (!patch?.id) return null;
  return atualizarPorId(patch.id, patch);
}

// utilidades opcionais
export function create(data) {
  const id = data?.id ? toIdLike(data.id) : nextId();
  const campanha = {
    id,
    nome: data?.nome || "Nova campanha",
    sistema: data?.sistema || "",
    descricao: data?.descricao || "",
    capaUrl: data?.capaUrl || null,
    sessoes: Array.isArray(data?.sessoes) ? data.sessoes : []
  };
  _db.push(campanha);
  return campanha;
}

export function remove(id) {
  const key = toIdLike(id);
  const idx = _db.findIndex(c => toIdLike(c.id) === key);
  if (idx < 0) return false;
  _db.splice(idx, 1);
  return true;
}

/**
 * Wrapper para compatibilidade
 * Permite continuar importando `{ CampanhaModel }`
 * e chamando CampanhaModel.findById, CampanhaModel.listar, etc.
 */
export const CampanhaModel = {
  listar,
  findById,
  atualizarPorId,
  atualizar,
  create,
  remove,
  // aliases úteis em projetos existentes
  findAll: listar,
  campanhas
};
