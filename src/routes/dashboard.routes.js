// src/routes/dashboard.routes.js

import { Router } from "express";
import { index } from "../controllers/dashboard.controller.js";
import { extractUserId } from "../middlewares/auth.middleware.js"; // Importa o extrator

const router = Router();

// Aplica o middleware de extração de ID do usuário ANTES do controller
router.get("/", extractUserId, index); 

export default router;