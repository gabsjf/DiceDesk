import { Router } from "express";

const router = Router();

// GET /jogadores  -> renderiza a view simples
router.get("/", (req, res) => {
  res.render("jogadores/index", {
    layout: "_layout",
    titulo: "Jogadores",
    active: "jogadores",
  });
});

export default router;
