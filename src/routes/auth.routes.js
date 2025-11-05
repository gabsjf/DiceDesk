// src/routes/auth.routes.js

import { Router } from "express";
import { loginGet, loginPost, registerGet, registerPost, logout } from "../controllers/auth.controller.js";

const router = Router();

router.get("/login", loginGet);
router.post("/login", loginPost);

router.get("/register", registerGet);
router.post("/register", registerPost);

router.get("/logout", logout);

export default router;