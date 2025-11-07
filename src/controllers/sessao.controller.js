import { SessaoModel } from "../models/sessao.model.js";

/**
 * POST /campanhas/:id/sessoes
 * Cria uma sessão dentro de uma campanha.
 */
export async function criarSessaoPost(req, res) {
  // Assume que req.userId é preenchido pelo middleware extractUserId
  const userId = req.userId;
  const campanhaId = req.params.id;

  // Aceita tanto 'nome' quanto 'titulo' do formulário
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

  // A URL pública vem em req.body.capaUrl (definido pelo processUpload)
  const imagemUrl = req.body.capaUrl || null;

  try {
    const payload = {
      titulo: finalTitulo,
      descricao: descricao ? descricao.trim() : null,
      data: data || null,
      capaUrl: imagemUrl, // Usamos capaUrl para compatibilidade com o Model
      campanhaId: campanhaId // Garante que o ID da campanha esteja no payload para o Model
    };

    // Chamada direta, sem verificação de argumentos, pois a estrutura é finalizada
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
    // Chamada direta: remove(userId, sessaoId)
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
  
  // Usa req.userId (garantido pelo middleware) para buscar
  const userId = req.userId; 

  if (!userId) {
      return res.status(403).send("Acesso negado: ID do Mestre não encontrado.");
  }
  
  // 1. Busca a sessão 
  const sessao = await SessaoModel.findById(userId, sessionId); 

  if (!sessao || sessao.userId !== userId) {
    // Garante que o documento exista E que pertença ao usuário logado
    return res.status(404).send("Sessão de jogo não encontrada ou acesso negado.");
  }
  
  // 🎯 Correção #1: Extrai o ID da Campanha da sessão encontrada
  const campanhaId = sessao.campanhaId;

  // 2. Renderiza a view, passando o campanhaId
  res.render("sessoes/jogar", {
    layout: "_layout", 
    titulo: `Jogando ${sessao.titulo}`,
    sessao: sessao,
    campanhaId: campanhaId, // <-- Variável que estava faltando no template EJS
  });
}

/**
 * POST /sessoes/:sid/combat/start
 * 🎯 Correção #2: Salva o estado de combate na sessão.
 */
export async function iniciarCombatePost(req, res) {
  const userId = req.userId; // Assume que o middleware já validou o usuário
  const sessionId = req.params.sid;
  
  // Captura os dados enviados pelo JavaScript (order e roundStart)
  const { order, roundStart } = req.body; 

  if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: "Dados da sessão inválidos." });
  }

  if (!order || order.length === 0) {
      return res.status(400).json({ success: false, message: "A ordem de iniciativa é obrigatória." });
  }

  try {
    // 1. Monta o payload de combate
    const combatPayload = {
      active: true,
      round: roundStart || 1,
      turnIndex: 0, // Começa no primeiro da ordem
      order: order,
    };

    // 2. Chama a função do Model para atualizar a sessão no Firestore
    const ok = await SessaoModel.ativarCombate(userId, sessionId, combatPayload);

    if (ok) {
        // Sucesso: o backend salvou o estado de combate
        return res.json({ success: true, message: "Combate iniciado e salvo." });
    } else {
        return res.status(404).json({ success: false, message: "Sessão não encontrada." });
    }

  } catch (error) {
    console.error(`Erro ao iniciar combate na sessão ${sessionId}:`, error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor ao iniciar combate." });
  }
}

export function acaoCombatePost(req, res) {
  console.log(`Ação de combate em: ${req.params.sid}`);
  return res.json({ success: true, message: "Ação processada." });
}

export function finalizarCombatePost(req, res) {
  console.log(`Finalizando combate em: ${req.params.sid}`);
  return res.json({ success: true, message: "Combate finalizado." });
}