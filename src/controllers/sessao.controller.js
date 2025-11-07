import { SessaoModel } from "../models/sessao.model.js";
// Importa o FieldValue para usar o serverTimestamp()
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /campanhas/:id/sessoes
 * Cria uma sessão dentro de uma campanha.
 */
export async function criarSessaoPost(req, res) {
  const userId = req.userId;
  const campanhaId = req.params.id;

  const { nome, titulo, descricao, data } = req.body || {};
  const finalTitulo = (titulo || nome || "").trim();

  if (!userId || !campanhaId) {
    req.session.flash = { danger: "Sessão expirada. Faça login novamente." };
    return res.redirect("/login");
  }

  if (!finalTitulo) {
    req.session.flash = { warning: "O título da sessão é obrigatório." };
    return res.redirect(`/campanhas/${campanhaId}`);
  }

  const imagemUrl = req.body.capaUrl || null;

  try {
    const payload = {
      titulo: finalTitulo,
      descricao: descricao ? descricao.trim() : null,
      data: data || null,
      capaUrl: imagemUrl,
      campanhaId: campanhaId
    };

    await SessaoModel.criar(userId, payload);

    req.session.flash = { success: `Sessão "${finalTitulo}" criada com sucesso!` };
    return res.redirect(`/campanhas/${campanhaId}`);
  } catch (error) {
    console.error("Erro ao criar sessão no Firestore:", error);
    req.session.flash = { danger: "Erro interno ao salvar a sessão." };
    return res.redirect(`/campanhas/${campanhaId}`);
  }
}

/**
 * POST /campanhas/:id/sessoes/:sid/apagar
 * Remove uma sessão de uma campanha.
 */
export async function apagarSessaoPost(req, res) {
  const userId = req.userId;
  const { id: campanhaId, sid: sessaoId } = req.params;

  if (!userId || !campanhaId || !sessaoId) {
    req.session.flash = { danger: "Requisição inválida." };
    return res.redirect("/dashboard");
  }

  try {
    const ok = await SessaoModel.remover(userId, sessaoId);

    if (ok) {
      req.session.flash = { success: "Sessão removida com sucesso." };
    } else {
      req.session.flash = { warning: "Sessão não encontrada ou falha na remoção." };
    }

    return res.redirect(`/campanhas/${campanhaId}`);
  } catch (error) {
    console.error("Erro ao remover sessão no Firestore:", error);
    req.session.flash = { danger: "Erro interno ao apagar a sessão." };
    return res.redirect(`/campanhas/${campanhaId}`);
  }
}

/* =========================================================
 * Rotas de Jogo e Combate (Protegidas/Simulação)
 * ========================================================= */

/**
 * GET /sessoes/:sid
 * Carrega e renderiza a tela de jogo da sessão.
 */
export async function jogarSessaoGet(req, res) {
  const sessionId = req.params.sid;
  const userId = req.userId;

  if (!userId) {
    return res.status(403).send("Acesso negado: ID do Mestre não encontrado.");
  }

  try {
    const sessao = await SessaoModel.findById(userId, sessionId);

    if (!sessao || sessao.userId !== userId) {
      return res.status(404).send("Sessão de jogo não encontrada ou acesso negado.");
    }

    const campanhaId = sessao.campanhaId;

    res.render("sessoes/jogar", {
      layout: "_layout",
      titulo: `Jogando ${sessao.titulo}`,
      sessao: sessao,
      campanhaId: campanhaId,
      userId: userId,
      sessaoId: sessionId,
    });

  } catch (error) {
    console.error("Erro ao carregar sessão de jogo:", error);
    return res.status(500).send("Erro interno ao carregar a sessão.");
  }
}

/**
 * POST /sessoes/:sid/combat/start
 * Inicia e salva o estado de combate na sessão.
 */
export async function iniciarCombatePost(req, res) {
  const userId = req.userId;
  const sessionId = req.params.sid;
  const { order, roundStart } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ success: false, message: "Dados da sessão inválidos." });
  }
  if (!order || order.length === 0) {
    return res.status(400).json({ success: false, message: "A ordem de iniciativa é obrigatória." });
  }

  try {
    const combatPayload = {
      active: true,
      round: roundStart || 1,
      turnIndex: 0,
      order: order,
    };

    const ok = await SessaoModel.ativarCombate(userId, sessionId, combatPayload);

    if (ok) {
      return res.json({ success: true, message: "Combate iniciado e salvo." });
    } else {
      return res.status(404).json({ success: false, message: "Sessão não encontrada." });
    }

  } catch (error) {
    console.error(`Erro ao iniciar combate na sessão ${sessionId}:`, error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor ao iniciar combate." });
  }
}

/**
 * POST /sessoes/:sid/combat/action
 * Processa uma ação durante o combate.
 * ✅ LÓGICA COMPLETA IMPLEMENTADA
 */
export async function acaoCombatePost(req, res) {
  const userId = req.userId;
  const sessionId = req.params.sid;
  // Pega os dados do formulário do modal
  const { type, targetId, amount, condition } = req.body; 

  try {
    // 1. Carrega a sessão atual
    const sessao = await SessaoModel.findById(userId, sessionId);
    if (!sessao || !sessao.combat || !sessao.combat.active) {
      throw new Error("Combate não está ativo ou sessão não encontrada.");
    }

    let combat = sessao.combat;
    let camposParaAtualizar = {}; // Objeto para salvar as mudanças

    // 2. Executa a ação baseada no 'type'
    switch (type) {
      case 'end_turn': {
        const totalPersonagens = combat.order.length;
        let newIndex = (combat.turnIndex + 1) % totalPersonagens;
        let newRound = combat.round;
        if (newIndex === 0) {
          newRound++;
        }
        camposParaAtualizar = {
          "combat.turnIndex": newIndex,
          "combat.round": newRound,
        };
        break;
      }

      case 'damage':
      case 'heal': {
        const val = parseInt(amount) || 0;
        const targetIndex = combat.order.findIndex(p => p.idRef === targetId);
        
        if (targetIndex === -1) throw new Error("Alvo não encontrado.");

        if (type === 'damage') {
          combat.order[targetIndex].hp = Math.max(0, combat.order[targetIndex].hp - val);
        } else { // heal
          combat.order[targetIndex].hp = Math.min(combat.order[targetIndex].hpMax, combat.order[targetIndex].hp + val);
        }
        
        // Salva o array 'order' inteiro de volta
        camposParaAtualizar = { "combat.order": combat.order };
        break;
      }

      case 'condition_add': {
        const targetIndex = combat.order.findIndex(p => p.idRef === targetId);
        if (targetIndex === -1) throw new Error("Alvo não encontrado.");
        
        // Garante que o array exista
        if (!combat.order[targetIndex].conditions) {
          combat.order[targetIndex].conditions = [];
        }
        // Adiciona apenas se já não existir
        if (condition && !combat.order[targetIndex].conditions.includes(condition)) {
          combat.order[targetIndex].conditions.push(condition);
        }
        
        camposParaAtualizar = { "combat.order": combat.order };
        break;
      }

      case 'condition_remove': {
        const targetIndex = combat.order.findIndex(p => p.idRef === targetId);
        if (targetIndex === -1) throw new Error("Alvo não encontrado.");
        
        if (combat.order[targetIndex].conditions) {
          combat.order[targetIndex].conditions = combat.order[targetIndex].conditions.filter(c => c !== condition);
        }
        
        camposParaAtualizar = { "combat.order": combat.order };
        break;
      }

      default:
        // Se o tipo não for reconhecido, não faz nada, apenas redireciona
        console.warn(`Tipo de ação desconhecido recebido: ${type}`);
        // Não jogamos um erro, apenas não fazemos nada e recarregamos a página
        return res.redirect(`/sessoes/${sessionId}`);
    }

    // 3. Adiciona um timestamp e salva no banco
    camposParaAtualizar["combat.updatedAt"] = FieldValue.serverTimestamp();
    await SessaoModel.atualizarCampos(userId, sessionId, camposParaAtualizar);

    // 4. Redireciona de volta para a página
    return res.redirect(`/sessoes/${sessionId}`);

  } catch (error) {
    console.error(`Erro ao processar ação (${type}) na sessão ${sessionId}:`, error);
    return res.redirect(`/sessoes/${sessionId}`);
  }
}

/**
 * POST /sessoes/:sid/combat/finish
 * Finaliza o combate e limpa o estado salvo.
 * ✅ LÓGICA COMPLETA IMPLEMENTADA
 */
export async function finalizarCombatePost(req, res) {
  const userId = req.userId;
  const sessionId = req.params.sid;
  // (req.body.xpTotal e req.body.combatOrderJson estão disponíveis)

  try {
    // 1. Define o 'combat' de volta para 'null' para sair do modo de combate
    const campos = {
      "combat": null 
    };

    // 2. Salva no banco
    await SessaoModel.atualizarCampos(userId, sessionId, campos);

    // 3. Redireciona de volta para a página de sessão (que agora mostrará a party grid)
    return res.redirect(`/sessoes/${sessionId}`);

  } catch (error) {
    console.error(`Erro ao finalizar combate na sessão ${sessionId}:`, error);
    return res.redirect(`/sessoes/${sessionId}`);
  }
}