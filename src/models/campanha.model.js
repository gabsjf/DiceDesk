// src/models/campanha.model.js
import { v4 as uuid } from "uuid";

// Armazenamento em memória (mock)
const _campanhas = [
  {
    id: "1",
    nome: "A Crônica do Reino Perdido",
    sistema: "Dungeons & Dragons 5e",
    descricao: "Uma aventura épica em um reino mágico.",
    capaUrl: "",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10")
  },
  {
    id: "2",
    nome: "A Ascensão de Cthulhu",
    sistema: "Chamado de Cthulhu",
    descricao: "Uma investigação sombria sobre cultos e horrores.",
    capaUrl: "",
    createdAt: new Date("2025-02-15"),
    updatedAt: new Date("2025-02-15")
  }
];

export const CampanhaModel = {
  listar() {
    // retorna cópia para evitar mutação externa
    return _campanhas.slice();
  },

  obterPorId(id) {
    return _campanhas.find(c => c.id === id) || null;
  },

  criar({ nome, sistema, descricao, capaUrl }) {
    const now = new Date();
    const nova = {
      id: uuid(),
      nome,
      sistema,
      descricao: descricao || "",
      capaUrl: capaUrl || "",
      createdAt: now,
      updatedAt: now
    };
    // mais recente primeiro
    _campanhas.unshift(nova);
    return nova;
  },

  atualizar(id, { nome, sistema, descricao, capaUrl }) {
    const c = _campanhas.find(x => x.id === id);
    if (!c) return null;
    c.nome = nome;
    c.sistema = sistema;
    c.descricao = descricao || "";
    if (typeof capaUrl !== "undefined") c.capaUrl = capaUrl || "";
    c.updatedAt = new Date();
    return c;
  },

  remover(id) {
    const i = _campanhas.findIndex(x => x.id === id);
    if (i >= 0) {
      _campanhas.splice(i, 1);
      return true;
    }
    return false;
  }
};
