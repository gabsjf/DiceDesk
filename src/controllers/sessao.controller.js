// src/controllers/sessao.controller.js
import { CampanhaModel } from "../models/campanha.model.js";
import { SessaoModel } from "../models/sessao.model.js";

/**
 * POST /campanhas/:id/sessoes
 * Cria sessão (nome + imagem opcional). Usa multer na rota.
 * Rota (ordem é importante): upload.single("imagem") -> csrfProtection -> criarSessaoPost
 */
export async function criarSessaoPost(req, res) {
  const { id } = req.params; // campanhaId
  const campanha = CampanhaModel.obterPorId(id);
  if (!campanha) return res.status(404).send("Campanha não encontrada");

  // Em multipart, o multer popula req.body + req.file
  const titulo = (req.body?.nome || "").trim();
  const file = req.file;
  const capaUrl = file ? `/uploads/${file.filename}` : "";

  if (!titulo) {
    const sessoes = SessaoModel.listarPorCampanha(id);
    return res.status(400).render("campanhas/detalhes", {
      title: campanha.nome,
      active: "campanhas",
      campanha: { ...campanha, sessoes },
      sessoes,
      errors: { nome: { msg: "Informe um nome para a sessão." } },
      csrfToken: req.csrfToken() // renovar token na re-renderização
    });
  }

  SessaoModel.criar({ campanhaId: id, titulo, capaUrl });
  req.session.flash = { success: "Sessão criada." };
  return res.redirect(`/campanhas/${id}`);
}

/**
 * POST /campanhas/:id/sessoes/:sid/apagar
 * Remove sessão e volta para a campanha.
 * Rota: router.post("/:id/sessoes/:sid/apagar", csrfProtection, apagarSessaoPost);
 */
export function apagarSessaoPost(req, res) {
  const { id, sid } = req.params; // id = campanhaId, sid = sessaoId
  const ok = SessaoModel.remover(sid);
  if (ok) req.session.flash = { success: "Sessão apagada." };
  return res.redirect(`/campanhas/${id}`);
}
