import { SessaoModel } from "../models/sessao.model.js";

/**
 * POST /campanhas/:id/sessoes
 * Cria uma sessão dentro de uma campanha.
 */
export async function criarSessaoPost(req, res) {
  const userId = res.locals.userId || req.userId;
  const campanhaId = req.params.id;

  // Aceita tanto 'nome' quanto 'titulo'
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
    };

    let novaSessao;

    // Assumimos que SessaoModel.criar espera (userId, payload)
    novaSessao = await SessaoModel.criar(userId, { campanhaId, ...payload });
    
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
  const userId = res.locals.userId || req.userId;
  const { id: campanhaId, sid: sessaoId } = req.params;

  if (!userId || !campanhaId || !sessaoId) {
    req.session.flash = { danger: "Requisição inválida." };
    return res.redirect("/dashboard");
  }

  try {
    // Chamamos o modelo com a assinatura que ele suporta (userId, sessaoId)
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
 * Rotas de Jogo e Combate (Rotas Públicas)
 * ========================================================= */

/**
 * GET /sessoes/:sid
 * Carrega e renderiza a tela de jogo da sessão.
 */
export async function jogarSessaoGet(req, res) {
  const sessionId = req.params.sid;
  
  // 1. Busca a sessão (você precisa ter um findById que funcione sem userId)
  // NOTA: Como a rota é pública, não temos o userId do mestre na requisição.
  // Você precisará de um SessaoModel.findPublicById(sessionId)
  
  // Usamos um mock temporário para evitar falha no Model (se ele não tiver findById(sessionId))
  // Se seu SessaoModel.findById espera userId, isto falhará.
  const sessao = await SessaoModel.findById("userIdTemporarioPublico", sessionId); 

  if (!sessao) {
    return res.status(404).send("Sessão de jogo não encontrada.");
  }
  
  // 2. Renderiza a view (o caminho 'sessao/jogo' é o correto, confirmado pela sua estrutura)
  res.render("sessao/jogo", {
    layout: "_layout", // Layout principal
    titulo: `Jogando ${sessao.titulo}`,
    sessao: sessao,
  });
}

export function iniciarCombatePost(req, res) {
  console.log(`Iniciando combate na sessão: ${req.params.sid}`);
  return res.json({ success: true, message: "Combate iniciado." });
}

export function acaoCombatePost(req, res) {
  console.log(`Ação de combate em: ${req.params.sid}`);
  return res.json({ success: true, message: "Ação processada." });
}

export function finalizarCombatePost(req, res) {
  console.log(`Finalizando combate em: ${req.params.sid}`);
  return res.json({ success: true, message: "Combate finalizado." });
}