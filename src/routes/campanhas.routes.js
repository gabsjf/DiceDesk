import { Router } from "express";
import {
  index,
  criarGet,
  criarPost,
  detalhes,
  editarGet,
  editarPost,
  apagarGet,
  apagarPost
} from "../controllers/campanha.controller.js";

const router = Router();
router.get("/", index);
router.get("/criar", criarGet);
router.post("/criar", criarPost);
router.get("/:id", detalhes);
router.get("/editar/:id", editarGet);
router.post("/editar/:id", editarPost);
router.get("/apagar/:id", apagarGet);
router.post("/apagar/:id", apagarPost);

export default router;
