// src/models/sessao.model.js
import { v4 as uuid } from "uuid";

const _sessoes = []; // { id, campanhaId, titulo, capaUrl, createdAt }

export const SessaoModel = {
  listarPorCampanha(campanhaId) {
    return _sessoes.filter(s => s.campanhaId === campanhaId)
                   .sort((a,b) => b.createdAt - a.createdAt);
  },
  criar({ campanhaId, titulo, capaUrl }) {
    const now = new Date();
    const nova = { id: uuid(), campanhaId, titulo, capaUrl, createdAt: now };
    _sessoes.unshift(nova);
    return nova;
  },
  remover(id) {
    const i = _sessoes.findIndex(s => s.id === id);
    if (i >= 0) { _sessoes.splice(i, 1); return true; }
    return false;
  }
};
