import { CampanhaModel } from "../models/campanha.model.js";
import { SessaoModel } from "../models/sessao.model.js"; // 🚨 NOVA IMPORTAÇÃO

/* ========= LISTA ========= */
export async function index(req, res) {
  const userId = req.userId; // Extraído pelo middleware

  let campanhas = [];
  try {
    campanhas = await CampanhaModel.listar(userId);
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    res.locals.flash = { danger: "Erro ao carregar lista de campanhas." };
  }

  const sistemas = [...new Set(
    (campanhas || []).map(c => c?.sistema).filter(Boolean)
  )].sort();

  res.render("campanhas/index", {
    layout: "_layout",
    titulo: "Campanhas",
    active: "campanhas",
    campanhas,
    sistemas
  });
}


export function criarGet(req, res) {
  res.render("campanhas/criar", {
    layout: "_layout",
    titulo: "Criar campanha",
    active: "campanhas",
    errors: null,
    campanha: {}
  });
}

export async function criarPost(req, res) {
  const userId = req.userId; // Extraído pelo middleware
  const { nome, sistema, descricao } = req.body || {};
  const campanha = { nome, sistema, descricao };

  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/criar", {
      layout: "_layout",
      titulo: "Criar campanha",
      active: "campanhas",
      errors,
      campanha
    });
  }

  let capaUrl = null;
  if (req.file) capaUrl = `/uploads/${req.file.filename}`;
  
  try {
    const criada = await CampanhaModel.create(userId, {
      nome: nome.trim(),
      sistema: sistema.trim(),
      descricao: (descricao || "").trim(),
      capaUrl
    });
    res.locals.flash = { success: `Campanha "${criada.nome}" criada com sucesso!` };
    return res.redirect(`/campanhas/${criada.id}`);

  } catch(error) {
    console.error("Erro ao criar campanha no Firestore:", error);
    res.locals.flash = { danger: "Erro interno ao salvar a campanha." };
    // Em caso de falha, redireciona para a lista
    return res.redirect("/campanhas");
  }
}


export async function detalhes(req, res) {
  const userId = req.userId;
  const campanhaId = req.params.id;
  
  // 1. Busca a campanha principal
  const campanha = await CampanhaModel.findById(userId, campanhaId);
  
  if (!campanha || campanha.userId !== userId) {
    return res.status(404).send("Campanha não encontrada ou acesso negado.");
  }
  
  // 🚨 CORREÇÃO AQUI: Busca as sessões separadamente no Firestore
  try {
    const sessoes = await SessaoModel.listarPorCampanha(userId, campanhaId);
    campanha.sessoes = sessoes; // Anexa as sessões à campanha para renderização
  } catch (error) {
    console.error("Erro ao buscar sessões para a campanha:", error);
    campanha.sessoes = []; // Garante que a renderização não trave
    res.locals.flash = { warning: "Houve um erro ao carregar as sessões desta campanha." };
  }

  res.render("campanhas/detalhes", {
    layout: "_layout",
    titulo: campanha.nome,
    active: "campanhas",
    campanha,
    errors: null
  });
}


export async function editarGet(req, res) {
  const userId = req.userId;
  const campanhaId = req.params.id;

  const campanha = await CampanhaModel.findById(userId, campanhaId);
  if (!campanha || campanha.userId !== userId) {
    return res.status(404).send("Campanha não encontrada ou acesso negado.");
  }

  res.render("campanhas/editar", {
    layout: "_layout",
    titulo: `Editar — ${campanha.nome}`,
    active: "campanhas",
    errors: null,
    campanha
  });
}

export async function editarPost(req, res) {
  const userId = req.userId;
  const campanhaId = req.params.id;

  // 1. Verifica se a campanha existe e se o usuário é o dono
  const campanhaOriginal = await CampanhaModel.findById(userId, campanhaId);
  if (!campanhaOriginal || campanhaOriginal.userId !== userId) {
    return res.status(404).send("Campanha não encontrada ou acesso negado.");
  }

  const { nome, sistema, descricao } = req.body || {};
  const errors = {};
  if (!nome || !nome.trim()) errors.nome = "O nome é obrigatório.";
  if (!sistema || !sistema.trim()) errors.sistema = "O sistema é obrigatório.";

  const campanhaAtualizada = { ...campanhaOriginal, nome, sistema, descricao };

  if (Object.keys(errors).length) {
    return res.status(400).render("campanhas/editar", {
      layout: "_layout",
      titulo: `Editar — ${campanhaOriginal.nome}`,
      active: "campanhas",
      errors,
      campanha: campanhaAtualizada
    });
  }

  const patch = {
    nome: nome.trim(),
    sistema: sistema.trim(),
    descricao: (descricao || "").trim(),
    ...(req.file ? { capaUrl: `/uploads/${req.file.filename}` } : {})
  };

  try {
    await CampanhaModel.atualizarPorId(userId, campanhaId, patch);
    res.locals.flash = { success: `Campanha "${patch.nome}" atualizada.` };
    return res.redirect(`/campanhas/${campanhaId}`);
  } catch(error) {
    console.error("Erro ao atualizar campanha no Firestore:", error);
    res.locals.flash = { danger: "Erro interno ao atualizar a campanha." };
    // Renderiza a página de edição com erro
    return res.status(500).render("campanhas/editar", {
      layout: "_layout",
      titulo: `Editar — ${campanhaOriginal.nome}`,
      active: "campanhas",
      errors: { geral: "Falha na atualização. Tente novamente." },
      campanha: campanhaAtualizada
    });
  }
}


export async function apagarGet(req, res) {
  const userId = req.userId;
  const campanhaId = req.params.id;

  const campanha = await CampanhaModel.findById(userId, campanhaId);
  if (!campanha || campanha.userId !== userId) {
    return res.status(404).send("Campanha não encontrada ou acesso negado.");
  }

  res.render("campanhas/apagar", {
    layout: "_layout",
    titulo: `Apagar — ${campanha.nome}`,
    active: "campanhas",
    campanha
  });
}

export async function apagarPost(req, res) {
  const userId = req.userId;
  const campanhaId = req.params.id;
  
  // 1. Verifica se a campanha existe (opcional, mas bom para segurança)
  const campanha = await CampanhaModel.findById(userId, campanhaId);
  if (!campanha || campanha.userId !== userId) {
    return res.status(404).send("Campanha não encontrada ou acesso negado.");
  }

  try {
    // 2. Apaga (o modelo já verifica se tem ID)
    const ok = await CampanhaModel.remove(userId, campanhaId);
    if (!ok) throw new Error("Falha na remoção do DB.");
    
    res.locals.flash = { success: `Campanha "${campanha.nome}" removida com sucesso.` };
    return res.redirect("/campanhas");
  } catch(error) {
    console.error("Erro ao apagar campanha no Firestore:", error);
    res.locals.flash = { danger: "Erro interno ao apagar a campanha." };
    return res.redirect("/campanhas");
  }
}