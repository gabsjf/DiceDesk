import { Router } from "express";
import {
  index,
  criarGet,
  criarPost,
  detalhes,
  apagarGet,
  apagarPost,
  editarGet,
  editarPost,
} from "../controllers/campanha.controller.js";
import { uploadImageChain } from "../middlewares/upload.js";

const router = Router();

// Lista
router.get("/", index);

// Criar
router.get("/criar", criarGet);
router.post("/criar", uploadImageChain("capa", "capas"), criarPost);

// Detalhes
router.get("/:id", detalhes);

// Editar
router.get("/:id/editar", editarGet);
router.post("/:id/editar", uploadImageChain("capa", "capas"), editarPost);

// Apagar
router.get("/:id/apagar", apagarGet);
router.post("/:id/apagar", apagarPost);

export default router;
