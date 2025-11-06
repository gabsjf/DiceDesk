// src/controllers/sessao.controller.js
import { SessaoModel } from "../models/sessao.model.js";

/**
 * POST /campanhas/:id/sessoes
 * Cria uma sessão dentro de uma campanha.
 * - Lê o userId de res.locals (fallback para req.userId)
 * - Aceita 'nome' ou 'titulo' como título
 * - Usa req.fileUrl (definido pelo processUpload) como imagem opcional
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

  // Com Firebase Storage, a URL pública vem em req.fileUrl (se houver arquivo)
  const imagemUrl = req.fileUrl || null;

  try {
    // Alguns modelos usam assinatura (userId, campanhaId, data),
    // outros (userId, data) dentro da própria função resolvem o caminho.
    // Preferimos a assinatura explícita (userId, campanhaId, payload).
    const payload = {
      titulo: finalTitulo,
      descricao: descricao ? descricao.trim() : null,
      data: data || null,
      imagemUrl,
    };

    let novaSessao;

    if (SessaoModel?.criar?.length >= 3) {
      // (userId, campanhaId, payload)
      novaSessao = await SessaoModel.criar(userId, campanhaId, payload);
    } else {
      // (userId, payload) — o model precisa inferir o caminho; passamos campanhaId dentro
      novaSessao = await SessaoModel.criar(userId, { campanhaId, ...payload });
    }

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
 * - Suporta remover(userId, campanhaId, sessaoId) e remover(userId, sessaoId)
 */
export async function apagarSessaoPost(req, res) {
  const userId = res.locals.userId || req.userId;
  const { id: campanhaId, sid: sessaoId } = req.params;

  if (!userId || !campanhaId || !sessaoId) {
    req.session.flash = { danger: "Requisição inválida." };
    return res.redirect("/dashboard");
  }

  try {
    let ok = false;

    if (SessaoModel?.remover?.length >= 3) {
      // remover(userId, campanhaId, sessaoId)
      ok = await SessaoModel.remover(userId, campanhaId, sessaoId);
    } else {
      // remover(userId, sessaoId)
      ok = await SessaoModel.remover(userId, sessaoId);
    }

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
 * Rotas públicas (placeholders)
 * ========================================================= */

export function jogarSessaoGet(req, res) {
  console.log(`Acessando sessão pública: ${req.params.sid}`);
  return res.status(501).send("Funcionalidade de Jogar Sessão (GET) não implementada.");
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
