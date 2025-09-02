// src/models/campanha.model.js
// Banco em memória único do processo:
const _db = [
  {
    id: "1",
    nome: "A Crônica do Reino Perdido",
    sistema: "Dungeons & Dragons 5e",
    descricao: "Uma aventura épica em um reino mágico.",
    capaUrl: null,
    sessoes: []
  },
  {
    id: "2",
    nome: "A Ascensão de Cthulhu",
    sistema: "Chamado de Cthulhu",
    descricao: "Uma investigação sombria sobre cultos e horrores.",
    capaUrl: null,
    sessoes: []
  }
];

// Helpers de id
function toIdLike(v) { return String(v); }
function nextId() { return String(_db.length ? Math.max(..._db.map(c => Number(c.id)||0)) + 1 : 1); }

export const CampanhaModel = {
  // Lista tudo (referência viva — cuidado pra não substituir o array, só mutar itens)
  findAll() {
    return _db;
  },
  listar()  { return _db; },

  // Busca por id (compara como string)
  findById(id) {
    const key = toIdLike(id);
    return _db.find(c => toIdLike(c.id) === key) || null;
  },

  // Cria campanha
  create(data) {
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
  },

  // Atualiza (merge superficial)
  update(id, patch) {
    const key = toIdLike(id);
    const idx = _db.findIndex(c => toIdLike(c.id) === key);
    if (idx < 0) return null;
    _db[idx] = { ..._db[idx], ...patch };
    return _db[idx];
  },

  // Remove
  remove(id) {
    const key = toIdLike(id);
    const idx = _db.findIndex(c => toIdLike(c.id) === key);
    if (idx < 0) return false;
    _db.splice(idx, 1);
    return true;
  }
};
