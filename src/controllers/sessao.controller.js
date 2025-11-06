import { SessaoModel } from "../models/sessao.model.js";

// Função responsável por criar uma nova sessão dentro de uma campanha
export async function criarSessaoPost(req, res) {
  const userId = req.userId; // ID do usuário garantido pelo middleware
  const campanhaId = req.params.id; // ID da campanha da URL

  // 🚨 CORREÇÃO: Renomeando 'nome' (vindo do input HTML) para 'titulo'
  // Também garante que a 'descricao' (se adicionada ao modal) seja lida.
  const { nome: titulo, descricao } = req.body || {}; 
  
  // Lógica de validação básica (agora usa 'titulo' corretamente)
  if (!titulo || !titulo.trim()) {
    req.session.flash = { warning: "O título da sessão é obrigatório." };
    return res.redirect(`/campanhas/${campanhaId}`);
  }

  // Lógica de upload opcional
  let capaUrl = null;
  if (req.file) {
    capaUrl = `/uploads/${req.file.filename}`;
  }

  try {
    // Chamada assíncrona ao modelo com userId e campanhaId
    const novaSessao = await SessaoModel.criar(userId, {
      campanhaId,
      titulo: titulo.trim(),
      // Adicionando a descrição ao objeto de dados, se existir
      descricao: descricao ? descricao.trim() : null, 
      capaUrl: capaUrl 
    });

    req.session.flash = { success: `Sessão "${novaSessao.titulo}" criada com sucesso!` };
    // Redireciona para a página de detalhes da campanha
    return res.redirect(`/campanhas/${campanhaId}`); 
    
  } catch (error) {
    console.error("Erro ao criar sessão no Firestore:", error);
    req.session.flash = { danger: "Erro interno ao salvar a nova sessão no banco de dados." };
    return res.redirect(`/campanhas/${campanhaId}`);
  }
}

// Função responsável por apagar uma sessão
export async function apagarSessaoPost(req, res) {
  const userId = req.userId; // ID do usuário garantido pelo middleware
  const campanhaId = req.params.id; // ID da campanha
  const sessaoId = req.params.sid; // ID da sessão (sid)

  try {
    // Chamada assíncrona ao modelo com userId e sessaoId
    const sucesso = await SessaoModel.remover(userId, sessaoId);

    if (sucesso) {
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
 * Funções de Rota Pública (Combat) - Exportadas para resolver o SyntaxError
 * ========================================================= */

// Rota GET /sessoes/:sid
export function jogarSessaoGet(req, res) {
  // Lógica para carregar e renderizar a tela de jogo pública da sessão
  console.log(`Acessando sessão pública: ${req.params.sid}`);
  return res.status(501).send("Funcionalidade de Jogar Sessão (GET) não implementada.");
}

// Rota POST /sessoes/:sid/combat/start
export function iniciarCombatePost(req, res) {
  // Lógica para iniciar o combate (ex: inicializar o tracker, rolar iniciativa)
  console.log(`Iniciando combate na sessão: ${req.params.sid}`);
  return res.json({ success: true, message: "Combate iniciado." });
}

// Rota POST /sessoes/:sid/combat/action
export function acaoCombatePost(req, res) {
  // Lógica para processar uma ação de combate (ex: ataque, magia, cura)
  console.log(`Ação de combate em: ${req.params.sid}`);
  return res.json({ success: true, message: "Ação processada." });
}

// Rota POST /sessoes/:sid/combat/finish
export function finalizarCombatePost(req, res) {
  // Lógica para finalizar o combate e registrar a XP ou o status da sessão
  console.log(`Finalizando combate em: ${req.params.sid}`);
  return res.json({ success: true, message: "Combate finalizado." });
}