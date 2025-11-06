
import { v4 as uuid } from "uuid";
import * as CampanhaModel from "../models/campanha.model.js";
import { DND_CONDITIONS } from "../constants/conditions.js";


async function getCampanhas() {
  if (typeof CampanhaModel.listar === "function") return CampanhaModel.listar();
  if (Array.isArray(CampanhaModel.campanhas)) return CampanhaModel.campanhas;
  return [];
}
async function getCampanhaById(idRaw) {
  const idStr = String(idRaw).trim();
  if (typeof CampanhaModel.findById === "function") {
    const c = await CampanhaModel.findById(idStr);
    if (c) return c;
  }
  if (Array.isArray(CampanhaModel.campanhas)) {
    return CampanhaModel.campanhas.find(c => String(c.id) === idStr) || null;
  }
  return null;
}
async function getCampanhaAndSessaoBySid(sid) {
  const todas = await getCampanhas();
  for (const c of todas) {
    const s = (c.sessoes || []).find(x => String(x.id) === String(sid));
    if (s) return { campanha: c, sessao: s };
  }
  return { campanha: null, sessao: null };
}
async function saveCampanha(campanha) {
  if (typeof CampanhaModel.atualizarPorId === "function") {
    const u = await CampanhaModel.atualizarPorId(campanha.id, campanha);
    return u || campanha;
  }
  if (typeof CampanhaModel.atualizar === "function") {
    const u = await CampanhaModel.atualizar(campanha);
    return u || campanha;
  }
  if (Array.isArray(CampanhaModel.campanhas)) {
    const idx = CampanhaModel.campanhas.findIndex(c => String(c.id) === String(campanha.id));
    if (idx >= 0) CampanhaModel.campanhas[idx] = campanha;
  }
  return campanha;
}


export async function criarSessaoPost(req, res) {
  try {
    const campanhaId = req.params.id;
    const nome = (req.body?.nome || req.body?.titulo || "").trim();

    if (!nome) {
      req.session.flash = { danger: "Informe o nome da sessão." };
      return res.status(400).redirect(`/campanhas/${campanhaId}`);
    }

    const campanha = await getCampanhaById(campanhaId);
    if (!campanha) return res.status(404).send("Campanha não encontrada");

    const novaSessao = {
      id: uuid(),
      titulo: nome,
      capaUrl: null,
      createdAt: Date.now(),
      combat: null
    };

    campanha.sessoes = Array.isArray(campanha.sessoes) ? campanha.sessoes : [];
    campanha.sessoes.unshift(novaSessao);
    await saveCampanha(campanha);

    req.session.flash = { success: "Sessão criada com sucesso." };
    return res.redirect(`/campanhas/${campanhaId}`);
  } catch (err) {
    console.error("criarSessaoPost erro:", err);
    return res.status(500).send("Erro interno ao criar sessão");
  }
}

export async function apagarSessaoPost(req, res) {
  try {
    const { id: campanhaId, sid: sessaoId } = req.params;
    const campanha = await getCampanhaById(campanhaId);
    if (!campanha) return res.status(404).send("Campanha não encontrada");

    campanha.sessoes = (campanha.sessoes || []).filter(s => String(s.id) !== String(sessaoId));
    await saveCampanha(campanha);

    req.session.flash = { success: "Sessão removida." };
    return res.redirect(`/campanhas/${campanhaId}`);
  } catch (err) {
    console.error("apagarSessaoPost erro:", err);
    return res.status(500).send("Erro interno ao apagar sessão");
  }
}

/* ===== TELA JOGAR ===== */

// GET /sessoes/:sid
export async function jogarSessaoGet(req, res) {
  try {
    const sid = String(req.params.sid).trim();
    const { campanha, sessao } = await getCampanhaAndSessaoBySid(sid);
    if (!sessao) return res.status(404).send("Sessão não encontrada");

    const personagens = sessao.personagens || sessao.participantes || [];
    res.render("sessoes/jogar", {
      title: "Jogar",
      campanhaId: campanha.id,
      sessao,
      personagens,
      conditions: DND_CONDITIONS
    });
  } catch (err) {
    console.error("jogarSessaoGet erro:", err);
    res.status(500).send("Erro interno ao abrir jogar");
  }
}

/* ===== COMBATE ===== */

// POST /sessoes/:sid/combat/start
export async function iniciarCombatePost(req, res) {
  try {
    const sid = String(req.params.sid).trim();
    const { campanha, sessao } = await getCampanhaAndSessaoBySid(sid);
    if (!sessao) return res.status(404).send("Sessão não encontrada");

    const { order = [], roundStart = 1 } = req.body || {};
    if (!Array.isArray(order) || order.length === 0) {
      req.session.flash = { danger: "Defina participantes com iniciativa." };
      return res.redirect(`/sessoes/${sid}`);
    }

    order.sort((a, b) => Number(b.init || 0) - Number(a.init || 0));

    sessao.combat = {
      active: true,
      round: Number(roundStart) || 1,
      turnIndex: 0,
      order: order.map(p => ({
        idRef: String(p.idRef || ""),
        name: String(p.name || "Sem nome"),
        type: p.type === "PC" ? "PC" : "NPC",
        level: Number(p.level || 0),
        init: Number(p.init || 0),
        hpMax: Number(p.hpMax ?? p.hp ?? 0),
        hp: Number(p.hp ?? p.hpMax ?? 0),
        conditions: []
      })),
      log: [{ id: uuid(), ts: Date.now(), type: "combat_started" }],
      xpTotal: 0,
      startedAt: Date.now(),
      endedAt: null
    };

    await saveCampanha(campanha);
    req.session.flash = { success: "Combate iniciado." };
    return res.redirect(`/sessoes/${sid}`);
  } catch (e) {
    console.error("iniciarCombatePost erro:", e);
    res.status(500).send("Erro ao iniciar combate");
  }
}

// POST /sessoes/:sid/combat/action
export async function acaoCombatePost(req, res) {
  try {
    const sid = String(req.params.sid).trim();
    const { campanha, sessao } = await getCampanhaAndSessaoBySid(sid);
    if (!sessao?.combat?.active) {
      req.session.flash = { danger: "Combate não está ativo." };
      return res.redirect(`/sessoes/${sid}`);
    }

    const state = sessao.combat;
    const { type, sourceId, targetId, amount, condition } = req.body || {};

    const active = state.order[state.turnIndex];
    const activeId = active?.idRef;

    // toda ação de efeito precisa vir do personagem do turno
    const needsTurnLock = ["damage", "heal", "condition_add", "condition_remove"].includes(type);
    if (needsTurnLock && String(sourceId) !== String(activeId)) {
      req.session.flash = { danger: `Agora é o turno de ${active?.name || "outro personagem"}.` };
      return res.redirect(`/sessoes/${sid}`);
    }

    const targetIdx = state.order.findIndex(p => String(p.idRef) === String(targetId));
    if (needsTurnLock && targetIdx < 0) {
      req.session.flash = { danger: "Alvo não encontrado." };
      return res.redirect(`/sessoes/${sid}`);
    }

    const log = (t, data) => state.log.push({ id: uuid(), ts: Date.now(), type: t, data });

    if (type === "damage") {
      const v = Math.max(0, Number(amount || 0));
      state.order[targetIdx].hp = Math.max(0, state.order[targetIdx].hp - v);
      log("damage", { sourceId, targetId, amount: v });
    } else if (type === "heal") {
      const v = Math.max(0, Number(amount || 0));
      state.order[targetIdx].hp = Math.min(state.order[targetIdx].hpMax, state.order[targetIdx].hp + v);
      log("heal", { sourceId, targetId, amount: v });
    } else if (type === "condition_add") {
      const name = String(condition || "").trim();
      if (!DND_CONDITIONS.includes(name)) {
        req.session.flash = { danger: "Condição inválida." };
        return res.redirect(`/sessoes/${sid}`);
      }
      const set = new Set(state.order[targetIdx].conditions || []);
      set.add(name);
      state.order[targetIdx].conditions = Array.from(set);
      log("condition_add", { sourceId, targetId, condition: name });
    } else if (type === "condition_remove") {
      const name = String(condition || "").trim();
      state.order[targetIdx].conditions = (state.order[targetIdx].conditions || []).filter(c => c !== name);
      log("condition_remove", { sourceId, targetId, condition: name });
    } else if (type === "end_turn") {
      state.turnIndex = (state.turnIndex + 1) % state.order.length;
      if (state.turnIndex === 0) state.round += 1;
      log("end_turn", { round: state.round, turnIndex: state.turnIndex });
    } else {
      req.session.flash = { danger: "Ação inválida." };
    }

    await saveCampanha(campanha);
    return res.redirect(`/sessoes/${sid}`);
  } catch (e) {
    console.error("acaoCombatePost erro:", e);
    res.status(500).send ("Erro ao processar ação");
  }
}

// POST /sessoes/:sid/combat/finish
export async function finalizarCombatePost(req, res) {
  try {
    const sid = String(req.params.sid).trim();
    const { campanha, sessao } = await getCampanhaAndSessaoBySid(sid);
    if (!sessao?.combat?.active) {
      req.session.flash = { danger: "Combate não está ativo." };
      return res.redirect(`/sessoes/${sid}`);
    }
    const xpTotal = Math.max(0, Number(req.body?.xpTotal || 0));

    sessao.combat.active = false;
    sessao.combat.endedAt = Date.now();
    sessao.combat.xpTotal = xpTotal;
    sessao.combat.log.push({ id: uuid(), ts: Date.now(), type: "combat_finished", data: { xpTotal } });

    await saveCampanha(campanha);
    req.session.flash = { success: "Combate finalizado. XP registrado." };
    return res.redirect(`/sessoes/${sid}`);
  } catch (e) {
    console.error("finalizarCombatePost erro:", e);
    res.status(500).send("Erro ao finalizar combate");
  }
}
