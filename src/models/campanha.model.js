// Simula um "banco" em memória
import { v4 as uuid } from "uuid";

const _campanhas = [
  { id: "1", nome: "A Crônica do Reino Perdido", sistema: "Dungeons & Dragons 5e", descricao: "Uma aventura épica em um reino mágico." },
  { id: "2", nome: "A Ascensão de Cthulhu", sistema: "Chamado de Cthulhu", descricao: "Uma investigação sombria sobre cultos e horrores." }
];

export const CampanhaModel = {
  listar() {
    return _campanhas;
  },

  obterPorId(id) {
    return _campanhas.find(c => c.id === id) || null;
  },

  criar({ nome, sistema, descricao }) {
    const novo = { id: uuid(), nome, sistema, descricao };
    _campanhas.push(novo);
    return novo;
  },

  atualizar(id, { nome, sistema, descricao }) {
    const c = _campanhas.find(x => x.id === id);
    if (!c) return null;
    c.nome = nome;
    c.sistema = sistema;
    c.descricao = descricao;
    return c;
  },

  remover(id) {
    const idx = _campanhas.findIndex(x => x.id === id);
    if (idx >= 0) {
      _campanhas.splice(idx, 1);
      return true;
    }
    return false;
  }
};
