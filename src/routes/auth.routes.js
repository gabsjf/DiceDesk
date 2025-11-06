import { Router } from "express";
import { loginGet, loginPost, registerGet, registerPost, logout } from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", loginGet);
router.post("/login", loginPost);

router.get("/register", registerGet);
router.post("/register", registerPost);

// CORRIGIDO: O frontend faz um POST, então a rota deve ser POST
router.post("/logout", logout); 

// (Removida a linha anterior: router.get("/logout", logout);)

export default router;