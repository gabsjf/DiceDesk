import { Router } from "express";
import { jogarSessaoGet } from "../controllers/sessao.controller.js";

const router = Router();

// GET /sessoes  -> página “em breve”
router.get("/", (req, res) => {
  res.render("sessoes/index", {
    layout: "_layout",
    titulo: "Sessões",
    active: "sessoes",
  });
});

// GET /sessoes/:sid -> tela Jogar já existente
router.get("/:sid", jogarSessaoGet);

export default router;
