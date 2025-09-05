// src/controllers/sessao.controller.js
import { v4 as uuid } from "uuid";
import * as CampanhaModel from "../models/campanha.model.js";

/**
 * Helpers bem defensivos para trabalhar com o model
 */
async function getCampanhas() {
  if (typeof CampanhaModel.listar === "function") {
    return await CampanhaModel.listar();
  }
  if (Array.isArray(CampanhaModel.campanhas)) {
    return CampanhaModel.campanhas;
  }
  throw new Error("Nenhum método de listagem encontrado no CampanhaModel.");
}

async function getCampanhaById(id) {
  if (typeof CampanhaModel.obterPorId === "function") {
    return await CampanhaModel.obterPorId(id);
  }
  if (typeof CampanhaModel.findById === "function") {
    return await CampanhaModel.findById(id);
  }
  if (typeof CampanhaModel.getById === "function") {
    return await CampanhaModel.getById(id);
  }
  // fallback manual usando o array exportado
  const todas = await getCampanhas();
  return (todas || []).find(c => String(c.id) === String(id)) || null;
}

async function saveCampanha(campanha) {
  // tenta atualizar usando métodos do model; senão, persiste no array e salva
  if (typeof CampanhaModel.atualizarPorId === "function") {
    return await CampanhaModel.atualizarPorId(campanha.id, campanha);
  }
  if (typeof CampanhaModel.atualizar === "function") {
    return await CampanhaModel.atualizar(campanha);
  }
  if (Array.isArray(CampanhaModel.campanhas)) {
    const idx = CampanhaModel.campanhas.findIndex(c => String(c.id) === String(campanha.id));
    if (idx >= 0) {
      CampanhaModel.campanhas[idx] = campanha;
      if (typeof CampanhaModel.__save === "function") {
        await CampanhaModel.__save();
      } else if (typeof CampanhaModel.save === "function") {
        await CampanhaModel.save();
      }
    }
    return campanha;
  }
  return campanha;
}

/**
 * POST /campanhas/:id/sessoes
 * Cria uma sessão para a campanha
 */
export async function criarSessaoPost(req, res) {
  try {
    const campanhaId = req.params.id;
    // nome pode vir como "nome" ou "titulo" do form
    const nome = (req.body?.nome || req.body?.titulo || "").trim();
    if (!nome) {
      req.session.flash = { type: "danger", message: "Informe o nome da sessão." };
      return res.status(400).redirect(`/campanhas/${campanhaId}`);
    }

    const campanha = await getCampanhaById(campanhaId);
    if (!campanha) {
      return res.status(404).send("Campanha não encontrada");
    }

    // imagem (multer) é opcional
    let capaUrl = null;
    if (req.file) {
      // seu upload middleware salva em /uploads; o app.js já serve /uploads estaticamente
      capaUrl = `/uploads/${req.file.filename}`;
    }

    const novaSessao = {
      id: uuid(),
      titulo: nome,
      capaUrl,
      createdAt: Date.now(),
    };

    campanha.sessoes = Array.isArray(campanha.sessoes) ? campanha.sessoes : [];
    campanha.sessoes.unshift(novaSessao);

    await saveCampanha(campanha);

    // volta para os detalhes da campanha
    return res.redirect(`/campanhas/${campanhaId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro interno ao criar sessão");
  }
}

/**
 * POST /campanhas/:id/sessoes/:sid/apagar
 * Remove uma sessão da campanha
 */
export async function apagarSessaoPost(req, res) {
  try {
    const { id: campanhaId, sid: sessaoId } = req.params;
    const campanha = await getCampanhaById(campanhaId);
    if (!campanha) return res.status(404).send("Campanha não encontrada");

    campanha.sessoes = (campanha.sessoes || []).filter(s => String(s.id) !== String(sessaoId));
    await saveCampanha(campanha);

    return res.redirect(`/campanhas/${campanhaId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro interno ao apagar sessão");
  }
}

/**
 * (Opcional) GET /sessoes/:sid — abrir tela de jogar
 * Se você já tem outro controller/rota pra isso, pode remover.
 */
export async function jogarSessaoGet(req, res) {
  try {
    const sid = req.params.sid;
    // procura a sessão dentro de qualquer campanha
    const todas = await getCampanhas();
    let campanha = null;
    let sessao = null;
    for (const c of (todas || [])) {
      const s = (c.sessoes || []).find(x => String(x.id) === String(sid));
      if (s) { campanha = c; sessao = s; break; }
    }
    if (!sessao) return res.status(404).send("Sessão não encontrada");

    res.render("sessoes/jogar", {
      title: "Jogar",
      campanhaId: campanha.id,
      sessao,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno ao abrir jogar");
  }
}
